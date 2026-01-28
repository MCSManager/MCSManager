import Docker from "dockerode";
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
}
