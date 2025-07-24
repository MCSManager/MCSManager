// @Entity
export default class SystemConfig {
  // HTTP service port, IP and path prefix
  httpPort: number = 23333;
  httpIp: string = "";
  prefix: string = "";

  // reverse proxy mode
  reverseProxyMode: boolean = false;

  // data transfer port
  dataPort: number = 23334;

  // Distributed forwarding mode
  forwardType: number = 1;

  // Whether to allow cross-domain requests
  crossDomain: boolean = false;

  // Whether to use Gzip compression for HTTP return information
  gzip: boolean = false;

  // Maximum simultaneous compression tasks
  maxCompress: number = 1;

  // Maximum simultaneous download tasks
  maxDownload: number = 10;

  // Decompression implementation form
  zipType: number = 1;

  // TOTP drift tolerance, in steps (30 seconds)
  totpDriftToleranceSteps: number = 0;

  // Login times IP limit
  loginCheckIp: boolean = true;

  // login Copyright Information
  loginInfo: string = "";

  // Whether to open the file management function for ordinary users
  canFileManager = true;

  // Whether to allow template-based instance reset, which may pose a security risk.
  // If you use Docker and need commercial functionality, you can try turning this feature on and testing it.
  allowUsePreset = false;

  // Panel display language
  language = "en_us";

  // Quick installation address
  presetPackAddr = "https://script.mcsmanager.com/templates.json";

  // Redis address (Experimental Features)
  redisUrl = "";

  // After it is enabled, you can connect to the redeem.mcsmanager.com platform
  // to sell instances based on redeem
  // (this feature may not be available in some countries)
  businessMode = false;

  businessId = "";

  // Whether to allow users to edit the start & update command of Docker instances
  allowChangeCmd = false;
}
