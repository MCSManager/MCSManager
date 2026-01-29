import axios from "axios";
import fs from "fs-extra";
import os from "os";
import path from "path";
import StorageSubsystem from "../common/system_storage";
import { JavaInfo } from "../entity/commands/java/java_manager";
import { globalConfiguration } from "../entity/config";
import { $t } from "../i18n";
import InstanceSubsystem from "./system_instance";

class JavaManager {
  private javaDataDir = "";
  public readonly javaList = new Map<string, IJavaRuntime>();

  constructor() {
    let javaDataDir = path.join(process.cwd(), "data/JavaData");
    if (globalConfiguration.config.defaultJavaDataPath) {
      javaDataDir = path.normalize(globalConfiguration.config.defaultJavaDataPath);
    }
    if (!fs.existsSync(javaDataDir)) fs.mkdirsSync(javaDataDir);
    this.javaDataDir = path.normalize(javaDataDir);

    this.loadJavaList();
  }

  public getJavaDataDir() {
    return this.javaDataDir;
  }

  async loadJavaList() {
    for (const file of await fs.readdir(this.javaDataDir)) {
      const javaPath = path.join(this.javaDataDir, file);
      const dir = await fs.stat(javaPath);
      if (!dir.isDirectory()) continue;

      const infoPath = path.join(javaPath, "java_info.json");
      if (!fs.existsSync(infoPath)) continue;

      const config = await fs.readJson(infoPath);
      // Delete java not yet fully downloaded
      if (config.downloading) {
        await fs.remove(javaPath);
        continue;
      }

      const info = new JavaInfo(config.name, config.installTime ?? Date.now(), config.version);
      info.path = config.path;
      this.javaList.set(info.fullname, {
        info: info,
        path: javaPath,
        usingInstances: []
      });
    }
  }

  list() {
    return Array.from(this.javaList.values());
  }

  getJava(id: string) {
    return this.javaList.get(id);
  }

  exists(id: string) {
    return this.javaList.has(id);
  }

  async getJavaDownloadUrl(info: JavaInfo) {
    switch (info.name) {
      case "zulu": {
        let platform: string = os.platform();

        // In some cases, using win32 will download macosx package
        // Therefore, change platform to windows
        switch (platform) {
          case "win32": {
            platform = "windows";
            break;
          }
        }

        const url =
          "https://api.azul.com/metadata/v1/zulu/packages/?java_package_type=jdk&javafx_bundled=true&release_status=ga&availability_types=CA&certifications=tck&page=1&page_size=2" +
          `&java_version=${info.version}&os=${platform}&arch=${os.arch()}`;
        const response = await axios.get(url, {
          timeout: 1000 * 3
        });

        const data = response.data;
        if (!data) return;

        const javaPackage = data.find(
          (p: any) => p.name.endsWith(".zip") || p.name.endsWith(".tar.gz")
        );
        if (!javaPackage) return;

        const downloadUrl = javaPackage.download_url;
        if (!downloadUrl) return;

        return downloadUrl;
      }
    }
  }

  addJava(info: JavaInfo) {
    const javaPath = path.join(this.javaDataDir, info.fullname);
    if (!fs.existsSync(javaPath)) fs.mkdirsSync(javaPath);

    StorageSubsystem.store(`JavaData/${info.fullname}`, "java_info", {
      name: info.name,
      path: info.path,
      version: info.version,
      installTime: info.installTime,
      downloading: false
    });

    this.javaList.set(info.fullname, {
      info: info,
      path: javaPath,
      usingInstances: []
    });
  }

  updateJavaInfo(info: JavaInfo) {
    const javaPath = path.join(this.javaDataDir, info.fullname);
    if (!fs.existsSync(javaPath)) return;

    StorageSubsystem.store(`JavaData/${info.fullname}`, "java_info", {
      name: info.name,
      path: info.path,
      version: info.version,
      installTime: info.installTime,
      downloading: false
    });
  }

  async getJavaRuntimeCommand(id: string) {
    const java = this.getJava(id);
    if (!java) throw new Error($t("TXT_CODE_77ce8542"));
    if (java.info.downloading) throw new Error($t("TXT_CODE_45d02bb7"));

    let javaPath = java.info.path ?? java.path;
    if (!javaPath) throw new Error($t("TXT_CODE_82c8bca3"));

    // For macOS, if Java is within a .jdk bundle, use the Contents/Home/bin/java path
    if (os.platform() === "darwin") {
      // Scan first-level subdirectories under javaPath to find Contents directory
      try {
        const entries = await fs.readdir(javaPath);
        for (const entry of entries) {
          const entryPath = path.join(javaPath, entry);
          const stat = await fs.stat(entryPath);
          if (stat.isDirectory()) {
            const contentsPath = path.join(entryPath, "Contents");
            if (await fs.pathExists(contentsPath)) {
              // Found Contents directory, construct new javaPath
              javaPath = path.join(entryPath, "Contents", "Home");
              break;
            }
          }
        }
      } catch (error) {
        // If scan fails, use original javaPath
      }
    }

    const javaRuntimePath = path.join(
      javaPath,
      "bin",
      os.platform() == "win32" ? "java.exe" : "java"
    );

    return `"${javaRuntimePath}"`;
  }

  async removeJava(id: string) {
    const java = this.getJava(id);
    if (!java) throw new Error($t("TXT_CODE_77ce8542"));

    // if (java.info.downloading) throw new Error($t("TXT_CODE_887fee99"));
    if (java.usingInstances.length) throw new Error($t("TXT_CODE_ea8ea5d1"));

    let javaPath = java.path;
    if (!javaPath) throw new Error($t("TXT_CODE_82c8bca3"));

    await fs.remove(javaPath);
    this.javaList.delete(id);

    return true;
  }
}

const javaManager = new JavaManager();

InstanceSubsystem.on("open", (obj: { instanceUuid: string }) => {
  const instanceUuid = obj.instanceUuid;
  const config = InstanceSubsystem.getInstance(instanceUuid)?.config;
  if (!config) return;

  const javaId = config.java.id;
  if (!javaId) return;

  const java = javaManager.getJava(javaId);
  if (java && !java.usingInstances.includes(instanceUuid)) java.usingInstances.push(instanceUuid);
});

const handleStopInstance = (obj: { instanceUuid: string }) => {
  const instanceUuid = obj.instanceUuid;
  const config = InstanceSubsystem.getInstance(instanceUuid)?.config;
  if (!config) return;

  const javaId = config.java.id;
  if (!javaId) return;

  const java = javaManager.getJava(javaId);
  if (java && !java.usingInstances.includes(instanceUuid))
    java.usingInstances.filter((uuid) => uuid !== instanceUuid);
};

InstanceSubsystem.on("exit", handleStopInstance);
InstanceSubsystem.on("failure", handleStopInstance);

export default javaManager;
