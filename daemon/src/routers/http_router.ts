import { $t } from "../i18n";
import Router from "@koa/router";
import send from "koa-send";
import fs from "fs-extra";
import path from "path";
import { missionPassport } from "../service/mission_passport";
import InstanceSubsystem from "../service/system_instance";
import FileManager from "../service/system_file";
import formidable from "formidable";
import { clearUploadFiles } from "../tools/filepath";

const router = new Router();

// Define the HTTP home page display route
router.all("/", async (ctx) => {
  ctx.body = "[MCSManager Daemon] Status: OK | reference: https://mcsmanager.com/";
  ctx.status = 200;
});

// file download route
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

    const cwd = instance.config.cwd;
    const fileRelativePath = mission.parameter.fileName;

    // Check for file cross-directory security risks
    const fileManager = new FileManager(cwd);
    if (!fileManager.check(fileRelativePath))
      throw new Error((ctx.body = "Access denied: Invalid destination"));

    // send File
    const fileAbsPath = fileManager.toAbsolutePath(fileRelativePath);
    const fileDir = path.dirname(fileAbsPath);
    const fileName = path.basename(fileAbsPath);
    ctx.set("Content-Type", "application/octet-stream");
    await send(ctx, fileName, { root: fileDir + "/", hidden: true });
  } catch (error) {
    ctx.body = $t("TXT_CODE_http_router.downloadErr", { error: error.message });
    ctx.status = 500;
  } finally {
    missionPassport.deleteMission(key);
  }
});

// File upload route
router.post("/upload/:key", async (ctx) => {
  const key = ctx.params.key;
  const unzip = ctx.query.unzip;
  const zipCode = String(ctx.query.code);
  let tmpFiles: formidable.File | formidable.File[] = null;
  try {
    const mission = missionPassport.getMission(key, "upload");
    if (!mission) throw new Error("Access denied: No task found");
    const instance = InstanceSubsystem.getInstance(mission.parameter.instanceUuid);
    if (!instance) throw new Error("Access denied: No instance found");
    const uploadDir = mission.parameter.uploadDir;
    const cwd = instance.config.cwd;
    const tmpFiles = ctx.request.files.file;
    if (tmpFiles && !(tmpFiles instanceof Array)) {
      const fullFileName = tmpFiles.name;
      const fileSaveRelativePath = path.normalize(path.join(uploadDir, fullFileName));
      if (!FileManager.checkFileName(fullFileName))
        throw new Error("Access denied: Malformed file name");
      const fileManager = new FileManager(cwd);
      if (!fileManager.checkPath(fileSaveRelativePath))
        throw new Error("Access denied: Invalid destination");
      const fileSaveAbsolutePath = fileManager.toAbsolutePath(fileSaveRelativePath);
      await fs.move(tmpFiles.path, fileSaveAbsolutePath);
      if (unzip) {
        const filemanager = new FileManager(instance.config.cwd);
        filemanager.unzip(fullFileName, "", zipCode);
      }
      ctx.body = "OK";
      return;
    }
    ctx.body = "Access denied: No file found";
    ctx.status = 500;
  } catch (error) {
    ctx.body = error.message;
    ctx.status = 500;
  } finally {
    missionPassport.deleteMission(key);
    clearUploadFiles(tmpFiles);
  }
});
export default router;
