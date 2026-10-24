import { DEFAULT_UPDATE_SOURCE_URL, LEGACY_DEFAULT_UPDATE_SOURCE_URL } from "mcsmanager-common";

// Data-plane mode values. String-valued so the persisted JSON and HTTP API
// payload stay `"direct"` / `"proxy"` (backward compatible with existing
// `panel/data/SystemConfig/config.json` files and API clients).
export enum DataPlaneMode {
  Direct = "direct",
  Proxy = "proxy"
}

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

  // Data-plane mode: DataPlaneMode.Direct (browser connects to the daemon directly) or
  // DataPlaneMode.Proxy (browser only reaches the panel, which reverse-proxies file
  // download/upload and terminal IO to the daemon so the daemon port never needs to be
  // public). Hot-reload, no restart.
  //
  // Class-level default is Direct so a config that predates this field (loaded by
  // StorageSubsystem.load, which deep-copies persisted JSON onto a fresh instance)
  // falls back to Direct on upgrade. initSystemConfig overrides to Proxy only on the
  // fresh-install branch (no config file on first boot).
  dataPlane: DataPlaneMode = DataPlaneMode.Direct;

  // Symmetric HMAC secret used to sign browser-facing proxy data-plane tokens (panel self-signs
  // and self-verifies; never shared with the daemon). Generated lazily on first use and persisted.
  gatewaySecret = "";

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
  presetPackAddr = "https://script.mcsmanager.com/market.json";

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
  // Comma-separated allowlist of hosts allowed to appear in a derived
  // redirect_uri. Only consulted when ssoCallbackUrl is empty AND
  // reverseProxyMode is enabled; empty means "trust no request header".
  ssoAllowedRedirectHosts = "";

  // Whether to enable SSL/TLS (HTTPS)
  ssl = false;
  // SSL certificate file path (.pem)
  sslPemPath = "";
  // SSL private key file path (.key)
  sslKeyPath = "";

  // ---- Update source (manifest URL for manual self-update) ----
  // Primary source: full URL to a manifest describing available updates, e.g.
  // the official GitHub Release manifest (DEFAULT_UPDATE_SOURCE_URL).
  updateSourceUrl = DEFAULT_UPDATE_SOURCE_URL;
  // Backup source (LEGACY_DEFAULT_UPDATE_SOURCE_URL by default): tried when the
  // primary source cannot be fetched or parsed. Feature disabled only when
  // BOTH source fields are empty.
  updateSourceUrlFallback = LEGACY_DEFAULT_UPDATE_SOURCE_URL;
}
