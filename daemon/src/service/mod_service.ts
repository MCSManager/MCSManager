import fs from "fs-extra";
import path from "path";
import StreamZip from "node-stream-zip";
import { getFileManager } from "./file_router_service";
import yaml from "yaml";
import toml from "@iarna/toml";
import crypto from "crypto";
import downloadManager from "./download_manager";
import InstanceSubsystem from "./system_instance";
import { checkSafeUrl } from "../utils/url";

export interface ModInfo {
  name: string;
  version: string;
  id: string;
  description: string;
  type: "mod" | "plugin" | "unknown";
  file: string;
  enabled: boolean;
  hash?: string;
  folder?: string;
}

export interface ModListResult {
  mods: ModInfo[];
  folders: string[];
}

export interface ModConfigFile {
  name: string;
  path: string;
}

export interface DeferredTask {
  id?: string;
  type: "toggle" | "delete" | "download";
  fileName?: string;
  url?: string;
  targetPath?: string;
  fallbackUrl?: string;
  extraInfo?: Record<string, any>;
}

export class ModService {
  private readonly MAX_CACHE_SIZE = 2000;
  private cache: Map<string, { mtime: number; size: number; info: Partial<ModInfo>; hash: string }> =
    new Map();

  private deferredTasks: Map<string, DeferredTask[]> = new Map();
  private autoExecuteInstances: Set<string> = new Set();

  constructor() {
    // Wait for next tick to ensure InstanceSubsystem is fully initialized if needed
    process.nextTick(() => {
      InstanceSubsystem.on("exit", (data) => {
        const { instanceUuid } = data;
        if (this.autoExecuteInstances.has(instanceUuid)) {
          this.executeDeferredTasks(instanceUuid).catch((err) => {
            console.error(`[ModService] Failed to execute deferred tasks for ${instanceUuid}:`, err);
          });
        }
      });
    });
  }

  private async executeDeferredTasks(instanceUuid: string) {
    // Immediately retrieve and remove from Map to prevent the frontend from seeing it during execution
    const tasks = this.deferredTasks.get(instanceUuid);
    this.deferredTasks.delete(instanceUuid);

    if (!tasks || tasks.length === 0) return;

    for (const task of tasks) {
      try {
        if (task.type === "toggle" && task.fileName) {
          await this.toggleMod(instanceUuid, task.fileName as string);
        } else if (task.type === "delete" && task.fileName) {
          await this.deleteMod(instanceUuid, task.fileName as string);
        } else if (task.type === "download" && task.url && task.targetPath) {
          await downloadManager.downloadFromUrl(task.url as string, task.targetPath as string, task.fallbackUrl as string);
        }
      } catch (err) {
        console.error(`[ModService] Task failed:`, task, err);
      }
    }
  }

  public addDeferredTask(instanceUuid: string, task: DeferredTask) {
    // Security check for user inputs
    const fileManager = getFileManager(instanceUuid);
    if (task.fileName && !fileManager.checkPath(task.fileName)) throw new Error("Invalid file name");
    if (task.url && !checkSafeUrl(task.url)) throw new Error("Invalid URL");
    if (task.targetPath && !fileManager.checkPath(task.targetPath)) {
      throw new Error("Access denied: Target path is outside of instance directory");
    }

    if (!this.deferredTasks.has(instanceUuid)) {
      this.deferredTasks.set(instanceUuid, []);
    }
    // Check if the same task already exists to avoid duplicates
    const tasks = this.deferredTasks.get(instanceUuid);
    const isDuplicate = tasks?.some((t) => {
      if (t.type !== task.type) return false;
      if (t.type === "download") return t.url === task.url;
      // Normalize file names to prevent duplicate detection failure due to .disabled suffix
      const name1 = t.fileName?.replace(".disabled", "");
      const name2 = task.fileName?.replace(".disabled", "");
      return name1 === name2;
    });

    if (!isDuplicate) {
      // Generate a unique ID for the task to facilitate frontend synchronization
      task.id = Math.random().toString(36).substring(2);
      tasks?.push(task);
    }
  }

  public setAutoExecute(instanceUuid: string, enabled: boolean) {
    if (enabled) {
      this.autoExecuteInstances.add(instanceUuid);
    } else {
      this.autoExecuteInstances.delete(instanceUuid);
    }
  }

  public getDeferredTasks(instanceUuid: string): DeferredTask[] {
    return this.deferredTasks.get(instanceUuid) || [];
  }

  public clearDeferredTasks(instanceUuid: string) {
    this.deferredTasks.delete(instanceUuid);
  }

  private async getFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash("sha1");
      const stream = fs.createReadStream(filePath);
      stream.on("data", (data) => hash.update(data));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", (err) => reject(err));
    });
  }

  private async parseJarMetadata(jarPath: string): Promise<Partial<ModInfo> | null> {
    const zip = new StreamZip.async({ file: jarPath });
    try {
      const entries = await zip.entries();

      // Fabric
      if (entries["fabric.mod.json"]) {
        const data = await zip.entryData("fabric.mod.json");
        const json = JSON.parse(data.toString());
        return {
          id: json.id,
          name: json.name || json.id,
          version: json.version,
          description: json.description,
          type: "mod"
        };
      }

      // Forge (mods.toml)
      if (entries["META-INF/mods.toml"]) {
        const data = await zip.entryData("META-INF/mods.toml");
        const config = toml.parse(data.toString()) as any;
        const mod = config.mods ? config.mods[0] : {};
        return {
          id: mod.modId,
          name: mod.displayName || mod.modId,
          version: mod.version,
          description: mod.description,
          type: "mod"
        };
      }

      // Forge (mcmod.info)
      if (entries["mcmod.info"]) {
        const data = await zip.entryData("mcmod.info");
        try {
          const json = JSON.parse(data.toString());
          const mod = Array.isArray(json) ? json[0] : json.modList ? json.modList[0] : json;
          return {
            id: mod.modid,
            name: mod.name || mod.modid,
            version: mod.version,
            description: mod.description,
            type: "mod"
          };
        } catch (e) {}
      }

      // Quilt
      if (entries["quilt.mod.json"]) {
        const data = await zip.entryData("quilt.mod.json");
        const json = JSON.parse(data.toString());
        const mod = json.quilt_loader?.metadata || json;
        return {
          id: mod.id,
          name: mod.name || mod.id,
          version: mod.version,
          description: mod.description,
          type: "mod"
        };
      }

      // Velocity
      if (entries["velocity-plugin.json"]) {
        const data = await zip.entryData("velocity-plugin.json");
        const json = JSON.parse(data.toString());
        return {
          id: json.id,
          name: json.name || json.id,
          version: json.version,
          description: json.description,
          type: "plugin"
        };
      }

      // Bukkit/Spigot (plugin.yml)
      if (entries["plugin.yml"]) {
        const data = await zip.entryData("plugin.yml");
        const yml = yaml.parse(data.toString());
        return {
          id: yml.name,
          name: yml.name,
          version: yml.version,
          description: yml.description,
          type: "plugin"
        };
      }

      // BungeeCord (bungee.yml)
      if (entries["bungee.yml"]) {
        const data = await zip.entryData("bungee.yml");
        const yml = yaml.parse(data.toString());
        return {
          id: yml.name,
          name: yml.name,
          version: yml.version,
          description: yml.description,
          type: "plugin"
        };
      }
    } catch (e) {
      // Ignore parse errors
    } finally {
      await zip.close();
    }
    return null;
  }

  public async listMods(instanceUuid: string): Promise<ModListResult> {
    const fileManager = getFileManager(instanceUuid);
    const rootDir = fileManager.toAbsolutePath(".");

    const result: ModInfo[] = [];
    const folders: string[] = [];
    const tasks: (() => Promise<void>)[] = [];

    const scanDir = async (dirName: string, defaultType: "mod" | "plugin") => {
      const dir = fileManager.toAbsolutePath(dirName);
      if (await fs.pathExists(dir)) {
        if (!folders.includes(dirName.toLowerCase())) {
          folders.push(dirName.toLowerCase());
        }
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file.endsWith(".jar") || file.endsWith(".jar.disabled")) {
            const fullPath = path.join(dir, file);
            const enabled = !file.endsWith(".disabled");

            tasks.push(async () => {
              try {
                const stat = await fs.stat(fullPath);
                const cacheKey = `${instanceUuid}:${fullPath}`;
                const cached = this.cache.get(cacheKey);

                let metadata: Partial<ModInfo> | null = null;
                let hash = "";

                if (cached && cached.mtime === stat.mtimeMs && cached.size === stat.size) {
                  metadata = cached.info;
                  hash = cached.hash;
                } else {
                  metadata = await this.parseJarMetadata(fullPath);
                  hash = await this.getFileHash(fullPath);
                  if (this.cache.size >= this.MAX_CACHE_SIZE) {
                    const firstKey = this.cache.keys().next().value;
                    if (firstKey) this.cache.delete(firstKey);
                  }
                  this.cache.set(cacheKey, {
                    mtime: stat.mtimeMs,
                    size: stat.size,
                    info: metadata || {},
                    hash
                  });
                }

                result.push({
                  name: metadata?.name || file,
                  version: metadata?.version || "Unknown",
                  id: metadata?.id || file,
                  description: metadata?.description || "",
                  type: metadata?.type || defaultType,
                  file: file,
                  enabled: enabled,
                  hash: hash,
                  folder: dirName.toLowerCase()
                });
              } catch (err) {
                result.push({
                  name: file,
                  version: "Unknown",
                  id: file,
                  description: "",
                  type: defaultType,
                  file: file,
                  enabled: enabled,
                  folder: dirName.toLowerCase()
                });
              }
            });
          }
        }
      }
    };

    await scanDir("mods", "mod");
    await scanDir("plugins", "plugin");
    await scanDir("Mods", "mod");
    await scanDir("Plugins", "plugin");

    // Limit concurrency to 10
    const limit = 10;
    for (let i = 0; i < tasks.length; i += limit) {
      const batch = tasks.slice(i, i + limit);
      await Promise.all(batch.map((task) => task()));
    }

    // Remove duplicates
    const uniqueResult = result.filter(
      (v, i, a) => a.findIndex((t) => t.file === v.file && t.folder === v.folder) === i
    );

    return {
      mods: uniqueResult,
      folders
    };
  }

  public async toggleMod(instanceUuid: string, fileName: string): Promise<void> {
    const fileManager = getFileManager(instanceUuid);
    if (!fileManager.checkPath(fileName)) throw new Error("Invalid file name");
    const rootDir = fileManager.toAbsolutePath(".");

    const possibleDirs = ["mods", "plugins", "Mods", "Plugins"];
    let filePath = "";

    for (const dirName of possibleDirs) {
      const p = path.join(rootDir, dirName, fileName);
      if (await fs.pathExists(p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      throw new Error("File not found");
    }

    let newPath: string;
    if (fileName.endsWith(".disabled")) {
      newPath = filePath.replace(".disabled", "");
    } else {
      newPath = filePath + ".disabled";
    }

    await fs.rename(filePath, newPath);
  }

  public async deleteMod(instanceUuid: string, fileName: string): Promise<void> {
    const fileManager = getFileManager(instanceUuid);
    if (!fileManager.checkPath(fileName)) throw new Error("Invalid file name");
    const rootDir = fileManager.toAbsolutePath(".");

    const possibleDirs = ["mods", "plugins", "Mods", "Plugins"];
    let filePath = "";

    for (const dirName of possibleDirs) {
      const p = path.join(rootDir, dirName, fileName);
      if (await fs.pathExists(p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      throw new Error("File not found");
    }

    await fs.remove(filePath);
  }

  public async installMod(
    instanceUuid: string,
    url: string,
    fileName: string,
    type: "mod" | "plugin",
    options: { fallbackUrl?: string; deferred?: boolean; extraInfo?: any } = {}
  ) {
    const fileManager = getFileManager(instanceUuid);
    const rootDir = fileManager.toAbsolutePath(".");
    
    // Determine the save directory based on what exists (case-sensitive check for Linux)
    let saveDir = type === "plugin" ? "plugins" : "mods";
    const variants = type === "plugin" ? ["plugins", "Plugins"] : ["mods", "Mods"];
    
    for (const v of variants) {
      if (await fs.pathExists(path.join(rootDir, v))) {
        saveDir = v;
        break;
      }
    }

    const relativePath = path.join(saveDir, fileName);
    if (!fileManager.checkPath(relativePath)) throw new Error("Invalid file path");
    const targetPath = fileManager.toAbsolutePath(relativePath);

    if (options.deferred) {
      this.addDeferredTask(instanceUuid, {
        type: "download",
        url,
        targetPath,
        fallbackUrl: options.fallbackUrl,
        extraInfo: options.extraInfo
      });
      return;
    }

    await downloadManager.downloadFromUrl(url, targetPath, options.fallbackUrl);
  }

  public async getModConfig(
    instanceUuid: string,
    modId: string,
    type: "mod" | "plugin",
    fileName?: string
  ): Promise<ModConfigFile[]> {
    const fileManager = getFileManager(instanceUuid);
    if (fileName && !fileManager.checkPath(fileName)) throw new Error("Invalid file name");
    if (modId && !fileManager.checkPath(modId)) throw new Error("Invalid mod ID");
    const rootDir = fileManager.toAbsolutePath(".");
    const configFiles: ModConfigFile[] = [];

    const searchTerms = new Set<string>();
    if (modId) searchTerms.add(modId.toLowerCase());
    if (fileName) {
      let nameOnly = fileName.replace(/\.jar(\.disabled)?$/i, "");
      // Try to remove version info (e.g., -1.18.2 or _1.18.2)
      nameOnly = nameOnly.replace(/[-_]v?\d+\.\d+.*$/i, "");
      searchTerms.add(nameOnly.toLowerCase());
      const parts = nameOnly.split(/[-_]/);
      if (parts[0]) searchTerms.add(parts[0].toLowerCase());
    }

    if (type === "mod") {
      // Mods usually have configs in /config directory
      const configDir = path.join(rootDir, "config");
      if (await fs.pathExists(configDir)) {
        const files = await fs.readdir(configDir);
        for (const file of files) {
          const lowerFile = file.toLowerCase();
          const fullPath = path.join(configDir, file);
          const stat = await fs.stat(fullPath);

          let matched = false;
          for (const term of searchTerms) {
            if (lowerFile.includes(term)) {
              matched = true;
              break;
            }
          }

          if (matched) {
            if (stat.isFile()) {
              configFiles.push({
                name: file,
                path: path.join("config", file)
              });
            } else if (stat.isDirectory()) {
              const subFiles = await fs.readdir(fullPath);
              for (const subFile of subFiles) {
                const subFullPath = path.join(fullPath, subFile);
                if ((await fs.stat(subFullPath)).isFile()) {
                  configFiles.push({
                    name: `${file}/${subFile}`,
                    path: path.join("config", file, subFile)
                  });
                }
              }
            }
          }
        }
      }
    } else {
      // Plugins usually have configs in /plugins/PluginName directory
      // Try direct match first
      let pluginConfigDir = path.join(rootDir, "plugins", modId);
      if (!(await fs.pathExists(pluginConfigDir)) && fileName) {
        // Try matching by search terms in plugins directory
        const pluginsDir = path.join(rootDir, "plugins");
        if (await fs.pathExists(pluginsDir)) {
          const dirs = await fs.readdir(pluginsDir);
          for (const dir of dirs) {
            const lowerDir = dir.toLowerCase();
            for (const term of searchTerms) {
              if (lowerDir === term || lowerDir === term.replace(/\s+/g, "")) {
                pluginConfigDir = path.join(pluginsDir, dir);
                break;
              }
            }
          }
        }
      }

      if (await fs.pathExists(pluginConfigDir) && (await fs.stat(pluginConfigDir)).isDirectory()) {
        const files = await fs.readdir(pluginConfigDir);
        for (const file of files) {
          const fullPath = path.join(pluginConfigDir, file);
          const stat = await fs.stat(fullPath);
          if (stat.isFile()) {
            configFiles.push({
              name: file,
              path: path.join(path.relative(rootDir, pluginConfigDir), file)
            });
          }
        }
      }
    }

    return configFiles;
  }
}

export const modService = new ModService();
