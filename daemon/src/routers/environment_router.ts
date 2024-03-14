import { $t } from "../i18n";
import { DockerManager } from "../service/docker_service";
import * as protocol from "../service/protocol";
import { routerApp } from "../service/router";
import * as fs from "fs-extra";
import path from "path";
import { v4 } from "uuid";
import logger from "../service/log";
import os from "os";

// Get the image list of this system
routerApp.on("environment/images", async (ctx, data) => {
  try {
    const docker = new DockerManager().getDocker();
    const result = await docker.listImages();
    protocol.response(ctx, result);
  } catch (error: any) {
    protocol.responseError(ctx, $t("TXT_CODE_environment_router.dockerInfoErr"));
  }
});

// Get the list of containers in this system
routerApp.on("environment/containers", async (ctx, data) => {
  try {
    const docker = new DockerManager().getDocker();
    const result = await docker.listContainers();
    protocol.response(ctx, result);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// Get the network list of this system
routerApp.on("environment/networkModes", async (ctx, data) => {
  try {
    const docker = new DockerManager().getDocker();
    const result = await docker.listNetworks();
    protocol.response(ctx, result);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// create image
routerApp.on("environment/new_image", async (ctx, data) => {
  try {
    const dockerFileText = data.dockerFile;
    const name = data.name;
    const tag = data.tag;
    // Initialize the image file directory and Dockerfile
    const uuid = v4();
    const dockerFileDir = path.normalize(path.join(process.cwd(), "tmp", uuid));
    if (!fs.existsSync(dockerFileDir)) fs.mkdirsSync(dockerFileDir);

    // write to DockerFile
    const dockerFilepath = path.normalize(path.join(dockerFileDir, "Dockerfile"));
    await fs.writeFile(dockerFilepath, dockerFileText, { encoding: "utf-8" });

    logger.info(
      $t("TXT_CODE_environment_router.crateImage", {
        name: name,
        tag: tag,
        dockerFileText: dockerFileText
      })
    );

    // pre-response
    protocol.response(ctx, true);

    // start creating
    const dockerImageName = `${name}:${tag}`;
    try {
      await new DockerManager().startBuildImage(dockerFileDir, dockerImageName);
      logger.info($t("TXT_CODE_environment_router.crateSuccess", { name: name, tag: tag }));
    } catch (error: any) {
      logger.info(
        $t("TXT_CODE_environment_router.crateErr", { name: name, tag: tag, error: error })
      );
    }
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// delete image
routerApp.on("environment/del_image", async (ctx, data) => {
  try {
    const imageId = data.imageId;
    const docker = new DockerManager().getDocker();
    const image = docker.getImage(imageId);
    if (image) {
      logger.info($t("TXT_CODE_environment_router.delImage", { imageId: imageId }));
      await image.remove();
    } else {
      throw new Error("Image does not exist");
    }
    protocol.response(ctx, true);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// Get the progress of all mirroring tasks
routerApp.on("environment/progress", async (ctx) => {
  try {
    const data: any = {};
    DockerManager.builderProgress.forEach((v, k) => {
      data[k] = v;
    });
    protocol.response(ctx, data);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});
