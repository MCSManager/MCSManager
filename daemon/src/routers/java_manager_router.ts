import fs from "fs-extra";
import path from "path";
import { extract } from "tar";
import { URL } from "url";
import { commandStringToArray } from "../entity/commands/base/command_parser";
import { JavaInfo } from "../entity/commands/java/java_manager";
import { $t } from "../i18n";
import downloadManager from "../service/download_manager";
import javaManager from "../service/java_manager";
import * as protocol from "../service/protocol";
import { routerApp } from "../service/router";
import FileManager from "../service/system_file";
import instanceManager from "../service/system_instance";

routerApp.on("java_manager/list", async (ctx) => {
  protocol.response(ctx, javaManager.list());
});

routerApp.on("java_manager/download", async (ctx, data) => {
  const info = new JavaInfo(data.name, data.version, Date.now());
  info.downloading = true;

  let downloadUrl: string;
  try {
    if (javaManager.exists(info.fullname)) throw new Error($t("TXT_CODE_79cf0302"));

    downloadUrl = await javaManager.getJavaDownloadUrl(info);
    if (!downloadUrl) throw new Error($t("TXT_CODE_4b0f31b4"));

    protocol.response(ctx, true);
  } catch (error: any) {
    protocol.responseError(ctx, error);
    return;
  }

  (async () => {
    try {
      const javaPath = path.join(javaManager.getJavaDataDir(), info.fullname);
      fs.mkdirsSync(javaPath);

      const fileName = path.basename(new URL(downloadUrl).pathname);
      const filePath = path.join(javaPath, fileName);
      javaManager.addJava(info);

      await downloadManager.downloadFromUrl(downloadUrl, filePath);
      const java = javaManager.getJava(info.fullname);
      if (!java) return;

      if (fileName.endsWith(".zip")) {
        const fileManager = new FileManager(javaPath, "UTF-8");
        await fileManager.unzip(fileName, ".", "UTF-8");

        const extractDir = path.join(javaPath, path.basename(fileName, ".zip"));
        if (fs.existsSync(extractDir) && fs.statSync(extractDir).isDirectory()) {
          const files = fs.readdirSync(extractDir);
          for (const file of files) {
            await fs.move(path.join(extractDir, file), path.join(javaPath, file));
          }
          await fs.remove(extractDir);
        }
      } else if (fileName.endsWith(".tar.gz")) {
        await extract({
          file: filePath,
          cwd: javaPath,
          strip: 1
        });
      }
      await fs.remove(filePath);

      info.downloading = false;
      javaManager.updateJavaInfo(info);
    } catch (error: any) {
      info.downloading = false;
      javaManager.updateJavaInfo(info);

      await javaManager.removeJava(info.fullname);
      protocol.responseError(ctx, error);
    }
  })();
});

routerApp.on("java_manager/using", async (ctx, data) => {
  try {
    const instance = instanceManager.getInstance(data.instanceId);
    if (!instance) throw new Error($t("TXT_CODE_ef6b54fb"));

    const startCommandList = commandStringToArray(instance.config.startCommand);
    startCommandList[0] = "{mcsm_java}";
    instance.parameters({
      java: {
        id: data.id
      },
      startCommand: startCommandList.join(" ")
    });

    protocol.response(ctx, true);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

routerApp.on("java_manager/delete", async (ctx, data) => {
  try {
    await javaManager.removeJava(data.id);
    protocol.response(ctx, true);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});
