import { t } from "i18next";
import { DefaultDocker } from "../../../service/docker_service";
import logger from "../../../service/log";
import { sleep } from "../../../tools/time";
import Instance from "../../instance/instance";
import InstanceCommand from "../base/command";

export function checkDockerName(name: string) {
  const asciiRegex = /^[\x00-\x7F]+$/;
  return asciiRegex.test(name);
}

export async function checkImage(name: string) {
  try {
    if (!checkDockerName(name)) {
      logger.warn(`Invalid Docker image name format: ${name}`);
      return false;
    }
    const docker = new DefaultDocker();
    const image = docker.getImage(name);
    const info = await image.inspect();
    return info.Size > 0 ? true : false;
  } catch (error: any) {
    // Image doesn't exist locally or Docker daemon error
    if (error?.statusCode === 404) {
      // Image not found - this is expected if image hasn't been pulled yet
      return false;
    }
    logger.debug(`Failed to check image ${name}:`, error?.message || error);
    return false;
  }
}

export default class DockerPullCommand extends InstanceCommand {
  constructor() {
    super("DockerPullCommand");
  }

  private stopFlag = false;

  private stopped(instance: Instance) {
    this.stopFlag = true;
    instance.asynchronousTask = undefined;
  }

  private async awaitImageDone(instance: Instance, name: string) {
    let count = 0;
    const maxAttempts = 20 * 30; // 20 minutes total (30 attempts * 3 seconds)

    while (true) {
      count++;
      instance.println("CONTAINER", t("TXT_CODE_977cb449"));

      if (await checkImage(name)) {
        logger.info(`Image ${name} successfully pulled and verified`);
        return true;
      }

      if (count >= maxAttempts) {
        const errorMsg = t("TXT_CODE_4cc91afe");
        logger.error(
          `Timeout waiting for image ${name} to be available after ${maxAttempts} attempts`
        );
        instance.println("ERROR", errorMsg);
        throw new Error(errorMsg);
      }

      if (this.stopFlag) {
        const errorMsg = t("TXT_CODE_361a79c6");
        logger.warn(`Image pull for ${name} was stopped by user`);
        instance.println("ERROR", errorMsg);
        throw new Error(errorMsg);
      }

      await sleep(3000);
    }
  }

  async exec(instance: Instance) {
    const imageName = instance.config.docker.image;
    if (!imageName) {
      const errorMsg = t("TXT_CODE_17be5f70");
      logger.error(`Docker pull failed: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const cachedStartCount = instance.startCount;

    // If the image exists, there is no need to pull again.
    if (await checkImage(imageName)) {
      logger.info(`Image ${imageName} already exists locally, skipping pull`);
      instance.println("CONTAINER", `Image ${imageName} already exists, skipping download`);
      return;
    }

    try {
      const docker = new DefaultDocker();
      instance.println("CONTAINER", t("TXT_CODE_2fa46b8c") + imageName);
      instance.asynchronousTask = this;

      logger.info(`Starting Docker pull for image: ${imageName}`);

      const stream = await docker.pull(imageName, {});

      let streamError: Error | null = null;
      let hasError = false;

      // wait for the stream to complete and handle errors
      await new Promise<void>((resolve, reject) => {
        stream.on("data", (data: Buffer | string) => {
          try {
            // Docker pull stream sends JSON objects as strings (one per line)
            const dataStr = data.toString();
            const lines = dataStr.split("\n").filter((line) => line.trim());

            for (const line of lines) {
              try {
                const jsonData = JSON.parse(line);

                // progress information
                if (jsonData.status) {
                  const progress = jsonData.progress
                    ? `${jsonData.status} ${jsonData.progress}`
                    : jsonData.status;
                  instance.println("CONTAINER", progress);
                  logger.debug(`Docker pull progress: ${progress}`);
                }

                if (jsonData.error) {
                  hasError = true;
                  const errorMsg = jsonData.error;
                  const errorDetail = jsonData.errorDetail?.message || jsonData.error;

                  logger.error(`Docker pull stream error: ${errorMsg}`, errorDetail);

                  // handle specific error types
                  if (
                    errorMsg.includes("no matching manifest") ||
                    errorMsg.includes("manifest unknown") ||
                    errorDetail?.includes("no matching manifest")
                  ) {
                    // extract platform information if available
                    const platformMatch =
                      errorMsg.match(/linux\/(\w+)/) || errorDetail?.match(/linux\/(\w+)/);
                    const platform = platformMatch ? platformMatch[0] : "the requested platform";

                    streamError = new Error(
                      `No matching manifest for ${platform} in the manifest list. ` +
                        `The image ${imageName} may not support this platform/architecture. ` +
                        `Please check if the image supports your system's architecture.`
                    );
                  } else if (
                    errorMsg.includes("404") ||
                    errorMsg.includes("not found") ||
                    errorMsg.includes("repository does not exist")
                  ) {
                    streamError = new Error(
                      `Image not found: ${imageName}. Please check the image name and tag.`
                    );
                  } else if (
                    errorMsg.includes("401") ||
                    errorMsg.includes("unauthorized") ||
                    errorMsg.includes("authentication required")
                  ) {
                    streamError = new Error(
                      `Authentication failed for image: ${imageName}. Please check your credentials.`
                    );
                  } else if (errorMsg.includes("403") || errorMsg.includes("forbidden")) {
                    streamError = new Error(
                      `Access forbidden for image: ${imageName}. You may not have permission to pull this image.`
                    );
                  } else {
                    streamError = new Error(
                      `Docker pull failed: ${errorMsg}${errorDetail ? ` (${errorDetail})` : ""}`
                    );
                  }
                }
              } catch (parseError) {
                // not JSON, just log it as a string message
                logger.debug(`Docker pull non-JSON data: ${line}`);
              }
            }
          } catch (error: any) {
            logger.debug(`Error parsing Docker pull stream data:`, error);
          }
        });

        stream.on("error", (error: any) => {
          hasError = true;
          logger.error(`Docker pull stream error event:`, error);
          streamError = new Error(
            `Docker pull stream error: ${error?.message || error?.toString() || String(error)}`
          );
        });

        stream.on("end", () => {
          logger.info(`Docker pull stream ended for image: ${imageName}`);
          if (streamError) {
            reject(streamError);
          } else {
            resolve();
          }
        });

        stream.on("close", () => {
          if (!hasError && !streamError) {
            logger.info(`Docker pull stream closed for image: ${imageName}`);
            resolve();
          }
        });
      });

      await this.awaitImageDone(instance, imageName);
      if (cachedStartCount !== instance.startCount) {
        logger.warn(`Instance ${instance.instanceUuid} start count changed during pull, aborting`);
        return;
      }
      instance.println("CONTAINER", t("TXT_CODE_c68b0bef"));
      logger.info(`Successfully pulled Docker image: ${imageName}`);
    } catch (err: any) {
      if (cachedStartCount !== instance.startCount) {
        logger.warn(
          `Instance ${instance.instanceUuid} start count changed during pull, ignoring error`
        );
        return;
      }

      let errorMessage = t("TXT_CODE_db37b7f9");
      const errMsg = err?.message || err?.toString() || String(err);

      // common docker pull errors
      if (
        errMsg.includes("404") ||
        errMsg.includes("not found") ||
        errMsg.includes("repository does not exist")
      ) {
        errorMessage = `Image not found: ${imageName}. Please check the image name and tag.`;
        logger.error(`Docker pull failed - image not found: ${imageName}`);
        instance.println("ERROR", errorMessage);
      } else if (
        errMsg.includes("401") ||
        errMsg.includes("unauthorized") ||
        errMsg.includes("authentication required")
      ) {
        errorMessage = `Authentication failed for image: ${imageName}. Please check your credentials.`;
        logger.error(`Docker pull failed - authentication error: ${imageName}`);
        instance.println("ERROR", errorMessage);
      } else if (errMsg.includes("403") || errMsg.includes("forbidden")) {
        errorMessage = `Access forbidden for image: ${imageName}. You may not have permission to pull this image.`;
        logger.error(`Docker pull failed - access forbidden: ${imageName}`);
        instance.println("ERROR", errorMessage);
      } else if (
        errMsg.includes("network") ||
        errMsg.includes("ECONNREFUSED") ||
        errMsg.includes("ENOTFOUND")
      ) {
        errorMessage = `Network error while pulling image: ${imageName}. Please check your internet connection and Docker registry accessibility.`;
        logger.error(`Docker pull failed - network error: ${imageName}`, err);
        instance.println("ERROR", errorMessage);
      } else if (errMsg.includes("no space left") || errMsg.includes("disk full")) {
        errorMessage = `Insufficient disk space to pull image: ${imageName}. Please free up disk space.`;
        logger.error(`Docker pull failed - disk space: ${imageName}`);
        instance.println("ERROR", errorMessage);
      } else if (
        errMsg.includes("no matching manifest") ||
        errMsg.includes("platform") ||
        errMsg.includes("architecture") ||
        errMsg.includes("os/arch") ||
        errMsg.includes("manifest unknown")
      ) {
        // extract platform info if available
        const platformMatch = errMsg.match(/linux\/(\w+)/);
        const platform = platformMatch ? platformMatch[0] : "the requested platform";
        errorMessage = `No matching manifest for ${platform} in the manifest list. The image ${imageName} may not support this platform/architecture. Please check if the image supports your system's architecture.`;
        logger.error(`Docker pull failed - platform mismatch: ${imageName}`, errMsg);
        instance.println("ERROR", errorMessage);
      } else {
        // generic error with original message
        errorMessage = [t("TXT_CODE_db37b7f9"), errMsg].join("\n");
        logger.error(`Docker pull failed for ${imageName}:`, err);
        instance.println("ERROR", errorMessage);
      }

      throw new Error(errorMessage);
    } finally {
      this.stopped(instance);
    }
  }

  async stop(instance: Instance): Promise<void> {
    this.stopped(instance);
  }
}
