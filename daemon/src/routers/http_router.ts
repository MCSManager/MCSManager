import Router from "@koa/router";
import formidable from "formidable";
import fs from "fs-extra";
import path from "path";
import { DAEMON_INDEX_HTML } from "../const/index_html";
import FileWriter from "../entity/file_writer";
import Instance from "../entity/instance/instance";
import { $t } from "../i18n";
import { missionPassport } from "../service/mission_passport";
import FileManager from "../service/system_file";
import InstanceSubsystem from "../service/system_instance";
import uploadManager from "../service/upload_manager";
import { clearUploadFiles } from "../tools/filepath";
import { sendFile } from "../utils/speed_limit";

// Helper function to normalize path for comparison
function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "");
}

// Helper function to check if a path is locked
function isPathLocked(instance: Instance, targetPath: string): boolean {
  const lockedFiles = instance.config.lockedFiles || [];
  if (lockedFiles.length === 0) return false;

  const normalizedTarget = normalizePath(targetPath);

  for (const lockedPath of lockedFiles) {
    const normalizedLocked = normalizePath(lockedPath);

    // Check if target is exactly the locked path
    if (normalizedTarget === normalizedLocked) {
      return true;
    }

    // Check if target is inside a locked directory
    if (normalizedTarget.startsWith(normalizedLocked + "/")) {
      return true;
    }
  }

  return false;
}

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
      const fileManager = new FileManager(cwd);

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

      // Check if target file is locked (only when overwriting existing file, and only for non-admin users)
      const isAdminUser = mission.parameter.isAdmin === true;
      if (fs.existsSync(fileSaveAbsolutePath) && ctx.query.overwrite !== "false" && !isAdminUser) {
        if (isPathLocked(instance, fileSaveRelativePath)) {
          throw new Error($t("TXT_CODE_file_locked_upload_error"));
        }
      }

      await fs.move(uploadedFile.filepath, fileSaveAbsolutePath, {
        overwrite: true
      });

      if (unzip) {
        const instanceFiles = new FileManager(instance.absoluteCwdPath());
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
  if (ctx.query.stop) {
    const writer = uploadManager.get(key);
    if (writer) {
      await writer.stop();
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
    const uploadDir = mission.parameter.uploadDir;
    const cwd = instance.absoluteCwdPath();
    const overwrite = ctx.query.overwrite !== "false";

    const fileManager = new FileManager(cwd);
    const filePath = await FileWriter.getPath(cwd, uploadDir, filename, overwrite);

    // Check if target file is locked (only when overwriting, and only for non-admin users)
    const isAdminUser = mission.parameter.isAdmin === true;
    if (overwrite && !isAdminUser) {
      const targetRelativePath = path.normalize(path.join(uploadDir, filename));
      const targetAbsolutePath = fileManager.toAbsolutePath(targetRelativePath);
      if (fs.existsSync(targetAbsolutePath) && isPathLocked(instance, targetRelativePath)) {
        // Clean up any existing upload task for this file path
        const existingTask = uploadManager.getByPath(filePath);
        if (existingTask) {
          await existingTask.writer.stop();
          uploadManager.delete(existingTask.id);
        }
        throw new Error($t("TXT_CODE_file_locked_upload_error"));
      }
    }

    let fr = uploadManager.getByPath(filePath);
    if (fr && size != fr.writer.size) {
      uploadManager.delete(fr.id);
      await fr.writer.stop();
      fr = undefined;
    }
    if (!fr) {
      const fileWriter = new FileWriter(cwd, filename, size, unzip, zipCode, filePath);
      await fileWriter.init();
      const id = uploadManager.add(fileWriter);
      fr = { id, writer: fileWriter };
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
