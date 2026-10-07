import fs from "fs-extra";
import path from "path";
import { v4 } from "uuid";
import StorageSubsystem from "../common/system_storage";
import logger from "../service/log";

function builderPassword() {
  const a = `${v4().replace(/\-/gim, "")}`;
  const b = a.slice(0, a.length / 2 - 1);
  const c = `${v4().replace(/\-/gim, "")}`;
  return b + c;
}

// @Entity
class Config {
  public version = 2;
  public ip = "";
  public port = 24444;
  public prefix = "";
  public key = builderPassword();
  public maxFileTask = 2;
  public maxZipFileSize = 200;
  public language = "en_us";
  public defaultInstancePath = "";
  public defaultJavaDataPath = "";
  public allocatablePortRange = [10010, 65500];
  public currentAllocatablePort = 10010;
  public portAssignInterval = 5;

  // default: Unlimited, if set 40 => (40 packets * 64KB)/s => 2.5MB/s
  public uploadSpeedRate = 0;
  // default: Unlimited, if set 32 => (32 packets * 64KB)/s => 2MB/s
  public downloadSpeedRate = 0;
  // default: 1, if set 0 => Unlimited
  public maxDownloadFromUrlFileCount = 1;

  // Output buffer size (number of chunks) for instance terminal output.
  // Each chunk is up to 256 characters, flushed every 50ms.
  // Increasing this value allows more output per flush cycle,
  // but may increase memory usage under high output load.
  // default: 256 (~64KB per flush), range: 16-4096
  public outputBufferSize = 256;

  // Daemon shutdown behavior
  public enableSoftShutdown = true;
  public softShutdownSkipDocker = true;
  public softShutdownWaitSeconds = 30;

  public whiteListPanelIp = false;
  public whiteListPanelIps = ["127.0.0.1", "::1"];

  ssl = false;
  sslPemPath = "";
  sslKeyPath = "";

  // ---- Update source (manifest URL for manual self-update) ----
  // Full URL to a manifest.json describing available updates, e.g.
  // "https://mcsmanager.com/upgrade/manifest.json". Empty => update info unavailable.
  public updateSourceUrl = "https://mcsmanager.com/upgrade/manifest.json";
}

// daemon configuration class
class GlobalConfiguration {
  public config = new Config();
  private static readonly ID = "global";

  // The config file contains the access key (secret). Keep it owner-only
  // (0700) so other local users cannot read it. StorageSubsystem.store()
  // writes via tmp+rename, so permissions must be re-applied after every
  // write as well (see store()/load()).
  private restrictConfigFilePermission() {
    const filePath = path.normalize(
      path.join(process.cwd(), "data", "Config", `${GlobalConfiguration.ID}.json`)
    );
    try {
      fs.chmodSync(filePath, 0o700);
    } catch (error) {
      // e.g. Windows (limited chmod support) or a foreign file owner —
      // never let permission hardening break the startup/store flow.
      logger.warn("Failed to restrict permissions of the config file:", error);
    }
  }

  load() {
    let config: Config = StorageSubsystem.load("Config", Config, GlobalConfiguration.ID);
    if (config == null) {
      config = new Config();
      StorageSubsystem.store("Config", GlobalConfiguration.ID, config);
    }
    this.config = config;
    this.restrictConfigFilePermission();
  }

  store() {
    StorageSubsystem.store("Config", GlobalConfiguration.ID, this.config);
    this.restrictConfigFilePermission();
  }
}

class GlobalEnv {
  public fileTaskCount = 0;
}

const globalConfiguration = new GlobalConfiguration();
const globalEnv = new GlobalEnv();

export { Config, globalConfiguration, globalEnv };
