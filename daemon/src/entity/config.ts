import { v4 } from "uuid";
import StorageSubsystem from "../common/system_storage";

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

  public whiteListPanelIp = false;
  public whiteListPanelIps = ["127.0.0.1", "::1"];

  ssl = false;
  sslPemPath = "";
  sslKeyPath = "";
}

// daemon configuration class
class GlobalConfiguration {
  public config = new Config();
  private static readonly ID = "global";

  load() {
    let config: Config = StorageSubsystem.load("Config", Config, GlobalConfiguration.ID);
    if (config == null) {
      config = new Config();
      StorageSubsystem.store("Config", GlobalConfiguration.ID, config);
    }
    this.config = config;
  }

  store() {
    StorageSubsystem.store("Config", GlobalConfiguration.ID, this.config);
  }
}

class GlobalEnv {
  public fileTaskCount = 0;
}

const globalConfiguration = new GlobalConfiguration();
const globalEnv = new GlobalEnv();

export { Config, globalConfiguration, globalEnv };
