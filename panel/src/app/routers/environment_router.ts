import Router from "@koa/router";
import axios from "axios";
import { normalizeDockerPlatform } from "mcsmanager-common";
import { ROLE } from "../entity/user";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import RemoteRequest from "../service/remote_command";
import RemoteServiceSubsystem from "../service/remote_service";

const router = new Router({ prefix: "/environment" });

// [Top-level Permission]
// Get the specified remote service mirror list
router.get(
  "/image",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { daemonId: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("environment/images", {});
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// create image
router.post(
  "/image",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { daemonId: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const config = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request(
        "environment/new_image",
        config
      );
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// delete the specified image
router.delete(
  "/image",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { daemonId: String, imageId: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const imageId = String(ctx.query.imageId);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("environment/del_image", {
        imageId
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// Get the list of existing containers of the specified remote service
router.get(
  "/containers",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { daemonId: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("environment/containers", {});
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// Get the list of existing networks for the specified remote service
router.get(
  "/networkModes",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { daemonId: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("environment/networkModes", {});
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// Get the image creation progress of the specified remote service
router.get(
  "/progress",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { daemonId: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("environment/progress", {});
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// Get supported platforms for a Docker image (via daemon)
router.post(
  "/image_platforms",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { daemonId: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const { imageName } = ctx.request.body as { imageName: string };
      if (!imageName) {
        ctx.body = { status: 400, message: "Image name is required" };
        return;
      }
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("environment/image_platforms", {
        imageName
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// Get supported platforms for a Docker image from Docker Hub or custom registry (proxy endpoint to avoid CORS)
router.post("/dockerhub_image_platforms", permission({ level: ROLE.ADMIN }), async (ctx) => {
  try {
    const { imageName } = ctx.request.body as { imageName: string };
    if (!imageName) {
      ctx.body = { status: 400, message: "Image name is required" };
      return;
    }

    // Parse image name: image:tag, namespace/image:tag, or registry/namespace/image:tag
    const parts = imageName.split("/");
    let registry = "registry-1.docker.io";
    let repository: string;
    let tag = "latest";

    if (parts.length === 1) {
      // Format: image:tag or image
      const [img, imgTag] = parts[0].includes(":") ? parts[0].split(":") : [parts[0], "latest"];
      repository = `library/${img}`;
      tag = imgTag;
    } else if (parts.length === 2) {
      // Format: namespace/image:tag or registry/repo:tag
      if (parts[0].includes(".") || parts[0].includes(":")) {
        // likely a registry
        registry = parts[0];
        const [repo, repoTag] = parts[1].includes(":") ? parts[1].split(":") : [parts[1], "latest"];
        repository = repo;
        tag = repoTag;
      } else {
        // Format: namespace/image:tag (Docker Hub)
        const [repo, repoTag] = parts[1].includes(":") ? parts[1].split(":") : [parts[1], "latest"];
        repository = `${parts[0]}/${repo}`;
        tag = repoTag;
      }
    } else {
      // Format: registry/namespace/image:tag (3+ parts)
      registry = parts[0];
      const lastPart = parts[parts.length - 1];
      const [lastRepo, lastTag] = lastPart.includes(":")
        ? lastPart.split(":")
        : [lastPart, "latest"];
      repository = parts.slice(1, -1).concat(lastRepo).join("/");
      tag = lastTag;
    }

    // Normalize registry URL
    const registryUrl = registry.includes("://") ? registry : `https://${registry}`;
    const isDockerHub = registry === "registry-1.docker.io" || registry === "docker.io";

    // Get authentication token
    let token = "";
    if (isDockerHub) {
      // Docker Hub authentication
      try {
        const tokenResponse = await axios.get(
          `https://auth.docker.io/token?service=registry.docker.io&scope=repository:${repository}:pull`
        );
        token = tokenResponse.data.token || tokenResponse.data.access_token || "";
      } catch (tokenError) {
        // continue without token for public images
      }
    } else {
      // For custom registries, try to get token from registry's auth endpoint
      // Most registries use /v2/ endpoint, but authentication varies
      // For now, we'll proceed without token (works for public images)
      // Custom registries may require additional authentication configuration
    }

    // Fetch manifest list using Docker Registry HTTP API V2
    const headers: Record<string, string> = {
      Accept:
        "application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.docker.distribution.manifest.v2+json, application/vnd.oci.image.index.v1+json, application/vnd.oci.image.manifest.v1+json"
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const manifestUrl = `${registryUrl}/v2/${repository}/manifests/${tag}`;
    const manifestResponse = await axios.get(manifestUrl, { headers });

    const manifest = manifestResponse.data;
    const platforms: string[] = [];

    // Check if it's a manifest list (multi-platform image)
    if (manifest.manifests && Array.isArray(manifest.manifests)) {
      for (const m of manifest.manifests) {
        if (m.platform) {
          platforms.push(normalizeDockerPlatform(m.platform));
        }
      }
    }

    ctx.body = platforms;
  } catch (err: any) {
    // Return empty array on error (graceful fallback)
    ctx.body = [];
  }
});

export default router;
