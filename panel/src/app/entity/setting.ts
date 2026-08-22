// @Entity
export default class SystemConfig {
  // HTTP service port, IP and path prefix
  httpPort: number = 23333;
  httpIp: string = "";
  prefix: string = "";

  // reverse proxy mode
  reverseProxyMode: boolean = false;
  // reverse proxy header
  reverseProxyHeader: string = "X-Real-IP";

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
  presetPackAddr = "https://script.mcsmanager.com/market-v2.json";

  // Redis address (Experimental Features)
  redisUrl = "";

  // Whether to allow users to edit the start & update command of Docker instances
  allowChangeCmd = false;

  // This option determines whether the entire panel can use an API key.
  // If set to fail, even if the user has already generated an API key,
  // they will no longer be able to use it.
  enableApiKey: boolean | "ONLY_ADMIN" = false;

  // Operation audit log settings
  // Whether to record user operations (audit log)
  operationLogEnabled = true;
  // Rotate to a new JSONL file after this many records (a new file also starts each day)
  operationLogMaxLinesPerFile = 200;
  // Delete log files older than N days (0 = keep forever)
  operationLogKeepDays = 30;
  // Delete the oldest log files when the total record count exceeds N (0 = unlimited)
  operationLogMaxTotalLines = 20000;
  // Per-category recording switches
  operationLogRecordLogin = true;
  operationLogRecordInstance = true;
  operationLogRecordFile = true;
  operationLogRecordUser = true;
  operationLogRecordSystem = true;

  // -----
  // After it is enabled, you can connect to the redeem.mcsmanager.com platform
  // to sell instances based on redeem
  // (this feature may not be available in some countries)
  businessMode = false;
  businessId = "";
  panelId = "";
  registerCode = "";
  // -----

  // SSO / OpenID Connect / OAuth 2.0
  ssoEnabled = false;
  ssoType: "oidc" | "oauth2" = "oidc";
  ssoOnlyMode = false;
  ssoAutoRedirect = false;
  ssoProviderName = "";
  ssoIconUrl = "";
  // OIDC-specific
  ssoIssuer = "";
  // OAuth 2.0-specific
  ssoAuthorizeUrl = "";
  ssoTokenUrl = "";
  ssoUserinfoUrl = "";
  ssoUserIdField = "id";
  ssoScopes = "";
  // Shared
  ssoClientId = "";
  ssoClientSecret = "";
  ssoTokenAuthMethod: "auto" | "client_secret_basic" | "client_secret_post" = "auto";
  ssoCallbackUrl = "";

  // Whether to enable SSL/TLS (HTTPS)
  ssl = false;
  // SSL certificate file path (.pem)
  sslPemPath = "";
  // SSL private key file path (.key)
  sslKeyPath = "";
}
