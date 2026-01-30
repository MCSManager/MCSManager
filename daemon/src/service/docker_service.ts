import Docker from "dockerode";
import http from "http";
import https from "https";
import { normalizeDockerPlatform } from "mcsmanager-common";
import { Readable } from "node:stream";
import os from "os";

function resolveDockerOptionsFromEnv(): Docker.DockerOptions {
  const dockerHost = process.env.DOCKER_HOST?.trim();
  if (dockerHost) {
    const options = parseDockerHostToDockerOptions(dockerHost);
    if (options) return options;
  }
  return {
    socketPath: os.platform() == "win32" ? "//./pipe/docker_engine" : "/var/run/docker.sock"
  };
}

function parseDockerHostToDockerOptions(dockerHost: string): Docker.DockerOptions | undefined {
  // Support both:
  // - Docker CLI style: unix:///run/user/<uid>/docker.sock (rootless Docker)
  // - Raw socket path: /run/user/<uid>/docker.sock

  const value = dockerHost.trim();
  if (!value) return undefined;

  // Windows named pipe (Docker CLI uses: npipe:////./pipe/docker_engine)
  if (value.startsWith("npipe:")) {
    let pipePath = value.slice("npipe:".length);
    // Reduce leading slashes: "////./pipe/docker_engine" -> "//./pipe/docker_engine"
    if (pipePath.startsWith("////")) pipePath = `//${pipePath.slice(4)}`;
    // URL parsing would normalize away "./", keep the canonical dockerode form.
    if (pipePath.startsWith("//pipe/")) pipePath = pipePath.replace("//pipe/", "//./pipe/");
    return { socketPath: pipePath };
  }

  // Unix socket URL (Docker CLI style)
  if (value.startsWith("unix://")) {
    const socketPath = value.slice("unix://".length);
    return socketPath ? { socketPath } : undefined;
  }

  // Support TCP/HTTP(S) style (e.g. tcp://127.0.0.1:2375)
  if (value.includes("://")) {
    try {
      const url = new URL(value);

      if (url.protocol === "unix:") {
        return url.pathname ? { socketPath: url.pathname } : undefined;
      }

      if (url.protocol === "tcp:" || url.protocol === "http:" || url.protocol === "https:") {
        const tlsEnabled = process.env.DOCKER_TLS_VERIFY?.trim() === "1";
        const protocol =
          url.protocol === "https:" ? "https" : tlsEnabled ? "https" : "http";
        const defaultPort = protocol === "https" ? 2376 : 2375;
        const port = url.port ? Number(url.port) : defaultPort;
        return {
          protocol,
          host: url.hostname,
          port
        };
      }
    } catch {
      // Fall through to raw socket path handling.
    }
  }

  // Raw path fallback (common in systemd env files)
  return { socketPath: value };
}

export class DefaultDocker extends Docker {
  public static readonly defaultConfig: Docker.DockerOptions = {
    ...resolveDockerOptionsFromEnv()
  };

  constructor(p?: Docker.DockerOptions) {
    super(Object.assign({}, DefaultDocker.defaultConfig, p ?? {}));
  }
}

export class DockerManager {
  // 1=creating 2=creating completed -1=creating error
  public static readonly builderProgress = new Map<string, number>();

  public docker: Docker;

  constructor(p?: any) {
    this.docker = new DefaultDocker(p);
  }

  public getDocker() {
    return this.docker;
  }

  public static setBuilderProgress(imageName: string, status: number) {
    DockerManager.builderProgress.set(imageName, status);
  }

  public static getBuilderProgress(imageName: string) {
    return DockerManager.builderProgress.get(imageName);
  }

  async startBuildImage(dockerFileDir: string, dockerImageName: string) {
    try {
      // Set the current image creation progress
      DockerManager.setBuilderProgress(dockerImageName, 1);
      // Issue the create image command
      const stream = await this.docker.buildImage(
        {
          context: dockerFileDir,
          src: ["Dockerfile"]
        },
        { t: dockerImageName }
      );
      // wait for creation to complete
      await new Promise((resolve, reject) => {
        this.docker.modem.followProgress(Readable.from(stream), (err, res) =>
          err ? reject(err) : resolve(res)
        );
      });
      // Set the current image creation progress
      DockerManager.setBuilderProgress(dockerImageName, 2);
    } catch (error: any) {
      // Set the current image creation progress
      DockerManager.setBuilderProgress(dockerImageName, -1);
    }
  }

  /**
   * Get all supported platform types (e.g., linux/arm64, linux/amd64)
   * Returns the native platform of the Docker daemon.
   * For additional platforms via buildx, you may need to query buildx separately.
   * @returns Array of supported platform strings
   */
  async getSupportedPlatforms(): Promise<string[]> {
    try {
      const info = await this.docker.info();
      const platforms: string[] = [];

      // get native platform from system info
      const osType = info.OSType?.toLowerCase() || "linux";
      const arch = info.Architecture || os.arch();

      // map Docker architecture to platform format
      const archMap: Record<string, string> = {
        x86_64: "amd64",
        amd64: "amd64",
        aarch64: "arm64",
        arm64: "arm64",
        armv7l: "arm",
        armv6l: "arm",
        arm: "arm",
        ppc64le: "ppc64le",
        s390x: "s390x",
        i386: "386",
        "386": "386"
      };

      const platformArch = archMap[arch] || arch;
      const nativePlatform = `${osType}/${platformArch}`;
      platforms.push(nativePlatform);

      return platforms;
    } catch (error: any) {
      // fallback: determine platform from Node.js os module
      const osType = os.platform() === "win32" ? "windows" : "linux";
      const nodeArch = os.arch();
      const archMap: Record<string, string> = {
        x64: "amd64",
        arm64: "arm64",
        arm: "arm"
      };
      const platformArch = archMap[nodeArch] || nodeArch;
      return [`${osType}/${platformArch}`];
    }
  }

  /**
   * Get supported platforms for a Docker image
   * Attempts to fetch manifest from registry to get platform information
   * @param imageName Image name in format "image:tag" or "registry/image:tag"
   * @returns Array of supported platform strings (e.g., ["linux/amd64", "linux/arm64"])
   */
  async getImagePlatforms(imageName: string): Promise<string[]> {
    try {
      // try to get manifest from registry using Docker Registry HTTP API V2
      return await this.getImagePlatformsFromRegistry(imageName);
    } catch (error: any) {
      // if we can't determine platforms, return empty array
      return [];
    }
  }

  /**
   * Fetch image platforms from Docker registry using HTTP API V2
   * @param imageName Image name in format "image:tag" or "registry/image:tag"
   * @returns Array of supported platform strings
   */
  private async getImagePlatformsFromRegistry(imageName: string): Promise<string[]> {
    try {
      // Parse image name: registry/repo/image:tag or repo/image:tag
      const parts = imageName.split("/");
      let registry = "registry-1.docker.io";
      let repository: string;
      let tag = "latest";

      if (parts.length === 1) {
        // format: image:tag or image
        const [img, imgTag] = parts[0].includes(":") ? parts[0].split(":") : [parts[0], "latest"];
        repository = `library/${img}`;
        tag = imgTag;
      } else if (parts.length === 2) {
        // format: repo/image:tag or registry/repo:tag
        if (parts[0].includes(".") || parts[0].includes(":")) {
          // likely a registry
          registry = parts[0];
          const [repo, repoTag] = parts[1].includes(":")
            ? parts[1].split(":")
            : [parts[1], "latest"];
          repository = repo;
          tag = repoTag;
        } else {
          // format: repo/image:tag
          const [repo, repoTag] = parts[1].includes(":")
            ? parts[1].split(":")
            : [parts[1], "latest"];
          repository = `${parts[0]}/${repo}`;
          tag = repoTag;
        }
      } else {
        // format: registry/repo/image:tag
        registry = parts[0];
        const lastPart = parts[parts.length - 1];
        const [lastRepo, lastTag] = lastPart.includes(":")
          ? lastPart.split(":")
          : [lastPart, "latest"];
        repository = parts.slice(1, -1).concat(lastRepo).join("/");
        tag = lastTag;
      }

      // normalize registry URL
      const registryUrl = registry.includes("://") ? registry : `https://${registry}`;
      const url = new URL(registryUrl);
      const protocol = url.protocol === "https:" ? https : http;

      return new Promise((resolve) => {
        const options = {
          hostname: url.hostname,
          port: url.port || (url.protocol === "https:" ? 443 : 80),
          path: `/v2/${repository}/manifests/${tag}`,
          method: "GET",
          headers: {
            Accept:
              "application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.docker.distribution.manifest.v2+json, application/vnd.oci.image.index.v1+json, application/vnd.oci.image.manifest.v1+json"
          }
        };

        const req = protocol.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            if (res.statusCode !== 200) {
              resolve([]);
              return;
            }

            try {
              const manifest = JSON.parse(data);
              const platforms: string[] = [];

              // check if it's a manifest list (multi-platform)
              if (manifest.manifests && Array.isArray(manifest.manifests)) {
                for (const m of manifest.manifests) {
                  if (m.platform) {
                    platforms.push(normalizeDockerPlatform(m.platform));
                  }
                }
              } else if (manifest.config || manifest.layers) {
                // single platform manifest
                // Try to get platform from config if available
                if (manifest.config?.digest) {
                  // for single platform, we'd need to fetch the config blob
                  // for now, return empty and let the caller handle it
                }
              }

              resolve(platforms);
            } catch (parseError) {
              resolve([]);
            }
          });
        });

        req.on("error", () => {
          resolve([]);
        });

        req.setTimeout(5000, () => {
          req.destroy();
          resolve([]);
        });

        req.end();
      });
    } catch (error: any) {
      return [];
    }
  }
}
