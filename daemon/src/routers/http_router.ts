import Router from "@koa/router";
import formidable from "formidable";
import fs from "fs-extra";
import path from "path";
import { DAEMON_INDEX_HTML } from "../const/index_html";
import FileWriter from "../entity/file_writer";
import { $t } from "../i18n";
import { DiskQuotaService } from "../service/disk_quota_service";
import { ioTaskService } from "../service/io_task_service";
import { missionPassport } from "../service/mission_passport";
import FileManager from "../service/system_file";
import InstanceSubsystem from "../service/system_instance";
import uploadManager from "../service/upload_manager";
import { clearUploadFiles } from "../tools/filepath";
import { sendFile } from "../utils/speed_limit";

const router = new Router();

// Define the HTTP home page display route
router.all("/", async (ctx) => {
  ctx.body = DAEMON_INDEX_HTML;
  ctx.status = 200;
});

// File download route
router.get("/download/:key/:fileName", async (ctx) => {
  const key = ctx.params.key;
  const paramsFileName = ctx.params.fileName;
  try {
    // Get the task from the task center
    const mission = missionPassport.getMission(key, "download");
    if (!mission) throw new Error((ctx.body = "Access denied: No task found"));
    const instance = InstanceSubsystem.getInstance(mission.parameter.instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_http_router.instanceNotExist"));
    if (!FileManager.checkFileName(paramsFileName))
      throw new Error($t("TXT_CODE_http_router.fileNameNotSpec"));

    const cwd = instance.absoluteCwdPath();
    const fileRelativePath = mission.parameter.fileName;

    // Check for file cross-directory security risks
    const fileManager = new FileManager(cwd);
    if (!fileManager.check(fileRelativePath))
      throw new Error((ctx.body = "Access denied: Invalid destination"));

    const fileAbsPath = fileManager.toAbsolutePath(fileRelativePath);
    await sendFile(ctx, fileAbsPath);
  } catch (error: any) {
    if (!ctx.res.headersSent) {
      ctx.body = $t("TXT_CODE_http_router.downloadErr", { error: error.message });
      ctx.status = 500;
    }
  } finally {
    missionPassport.deleteMission(key);
  }
});

// Old version upload route
router.post("/upload/:key", async (ctx) => {
  const key = String(ctx.params.key);
  const unzip = Boolean(ctx.query.unzip);
  const zipCode = String(ctx.query.code);
  let tmpFiles: formidable.File | formidable.File[] | undefined;
  try {
    const mission = missionPassport.getMission(key, "upload");
    if (!mission) throw new Error("Access denied: No task found");
    const instance = InstanceSubsystem.getInstance(mission.parameter.instanceUuid);
    if (!instance) throw new Error("Access denied: No instance found");

    // Check disk quota before uploading
    const quotaService = DiskQuotaService.getInstance();

    const uploadDir = mission.parameter.uploadDir;
    const cwd = instance.absoluteCwdPath();
    const tmpFiles = ctx.request.files?.file;
    if (tmpFiles) {
      let uploadedFile: formidable.File;
      if (tmpFiles instanceof Array) {
        uploadedFile = tmpFiles[0];
      } else if (tmpFiles) {
        uploadedFile = tmpFiles;
      } else {
        throw new Error("Empty File!");
      }

      const originFileName = uploadedFile.originalFilename || "";
      if (!FileManager.checkFileName(path.basename(originFileName)))
        throw new Error("Access denied: Malformed file name");

      // Check disk quota before upload
      const fileSize = uploadedFile.size;
      if (await quotaService.wouldExceedQuota(instance, fileSize)) {
        throw new Error($t("TXT_CODE_disk_quota_exceeded_write"));
      }

      const fileManager = new FileManager(cwd, undefined, instance.instanceUuid);

      const ext = path.extname(originFileName);
      const basename = path.basename(originFileName, ext);

      let tempFileSaveName = basename + ext;
      let counter = 1;

      while (
        fs.existsSync(
          fileManager.toAbsolutePath(path.normalize(path.join(uploadDir, tempFileSaveName)))
        ) &&
        ctx.query.overwrite === "false"
      ) {
        if (counter == 1) {
          tempFileSaveName = `${basename}-copy${ext}`;
        } else {
          tempFileSaveName = `${basename}-copy-${counter}${ext}`;
        }
        counter++;
      }

      let fileSaveRelativePath = path.normalize(path.join(uploadDir, tempFileSaveName));

      if (!fileManager.checkPath(fileSaveRelativePath))
        throw new Error("Access denied: Invalid destination");

      const fileSaveAbsolutePath = fileManager.toAbsolutePath(fileSaveRelativePath);

      await fs.move(uploadedFile.filepath, fileSaveAbsolutePath, {
        overwrite: true
      });

      if (unzip) {
        const instanceFiles = new FileManager(
          instance.absoluteCwdPath(),
          undefined,
          instance.instanceUuid
        );
        instanceFiles.unzip(fileSaveAbsolutePath, ".", zipCode);
      }
      ctx.body = "OK";
      return;
    }
    ctx.body = "Access denied: No file found";
    ctx.status = 500;
  } catch (error: any) {
    ctx.body = error.message;
    ctx.status = 500;
  } finally {
    missionPassport.deleteMission(key);
    if (tmpFiles) clearUploadFiles(tmpFiles);
  }
});

router.post("/upload-new/:key", async (ctx) => {
  const key = String(ctx.params.key);
  const unzip = Boolean(ctx.query.unzip);
  const zipCode = String(ctx.query.code);
  const filename = String(ctx.query.filename);
  const size = Number(ctx.query.size);
  let ioTaskId: string | undefined;
  if (ctx.query.stop) {
    const writer = uploadManager.get(key);
    if (writer) {
      await writer.stop();
      await ioTaskService.finishTask(writer.ioTaskId, "cancelled", "stopped");
      uploadManager.delete(key);
      ctx.body = "OK";
      return;
    } else {
      ctx.body = "Access denied: No task found";
      ctx.status = 500;
      return;
    }
  }
  try {
    const mission = missionPassport.getMission(key, "upload");
    if (!mission) throw new Error("Access denied: No task found");
    const instance = InstanceSubsystem.getInstance(mission.parameter.instanceUuid);
    if (!instance) throw new Error("Access denied: No instance found");

    // Check disk quota before starting upload
    const quotaService = DiskQuotaService.getInstance();
    if (await quotaService.wouldExceedQuota(instance, size)) {
      throw new Error($t("TXT_CODE_disk_quota_exceeded_write"));
    }

    const uploadDir = mission.parameter.uploadDir;
    const cwd = instance.absoluteCwdPath();
    const overwrite = ctx.query.overwrite !== "false";
    const ioTask = ioTaskService.startTask({
      instanceUuid: instance.instanceUuid,
      type: "upload",
      path: path.join(uploadDir, filename)
    });
    ioTaskId = ioTask.task?.id;
    const hooks = {
      onProgress: (current: number, total: number) => {
        const percent = total > 0 ? (current / total) * 100 : 0;
        ioTaskService.updateProgress(ioTaskId, percent);
      },
      onComplete: (status: "success" | "failed" | "cancelled", message?: string) => {
        const mapped =
          status === "success" ? "success" : status === "cancelled" ? "cancelled" : "failed";
        ioTaskService.finishTask(ioTaskId, mapped, message);
      }
    };
    const filePath = await FileWriter.getPath(
      cwd,
      uploadDir,
      filename,
      overwrite,
      instance.instanceUuid
    );
    let fr = uploadManager.getByPath(filePath);
    if (fr && size != fr.writer.size) {
      uploadManager.delete(fr.id);
      await fr.writer.stop();
      fr = undefined;
    }
    if (!fr) {
      const fileWriter = new FileWriter(
        cwd,
        filename,
        size,
        unzip,
        zipCode,
        filePath,
        instance.instanceUuid,
        hooks,
        ioTaskId
      );
      await fileWriter.init();
      const id = uploadManager.add(fileWriter);
      fr = { id, writer: fileWriter };
    } else {
      fr.writer.attachHooks(hooks, ioTaskId);
    }

    ctx.body = {
      data: {
        id: fr.id,
        received: fr.writer.received
      },
      status: 200
    };
    return;
  } catch (error: any) {
    ctx.body = error.message;
    ctx.status = 500;
    await ioTaskService.finishTask(ioTaskId, "failed", error.message);
  } finally {
    missionPassport.deleteMission(key);
  }
});

router.post("/upload-piece/:id", async (ctx) => {
  const id = String(ctx.params.id);
  const offset = Number(ctx.query.offset);
  const tmpFiles = ctx.request.files?.file;

  try {
    if (!tmpFiles) {
      ctx.body = "Access denied: No file found";
      ctx.status = 500;
    }

    let uploadedFile: formidable.File;
    if (tmpFiles instanceof Array) {
      uploadedFile = tmpFiles[0];
    } else if (tmpFiles) {
      uploadedFile = tmpFiles;
    } else {
      throw new Error("Empty File!");
    }
    const writer = uploadManager.get(id);
    if (!writer) throw new Error("Access denied: No task found");

    const chunk = await fs.readFile(uploadedFile.filepath);
    await writer.write(offset, chunk);

    if (tmpFiles) clearUploadFiles(tmpFiles);

    ctx.body = "OK";
    return;
  } catch (error: any) {
    ctx.body = error.message;
    ctx.status = 500;
  }
});

export default router;
