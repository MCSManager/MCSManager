export default {
  common: {
    title: "Title"
  },
  // module name or file name
  // src\app.ts
  app: {
    developInfo:
      "Unable to start, this project is used by MCSManager developers and cannot be run directly by ordinary users.\nPlease go to https://mcsmanager.com/ for the latest installation method.\nIf you want to run in development mode, please create a public , src/public directory and place the front-end static files and re-run.",
    panelStarted: "Control Panel has been started",
    reference: "Project Reference: https://github.com/mcsmanager",
    host: "Access address: http://localhost:{{port}}",
    portTip: "Open port {{port}} and daemon port for software public network access",
    exitTip: "To close this program please use Ctrl+C shortcut"
  },
  // src\app\middleware\permission.ts
  permission: {
    forbidden: "Insufficient permissions",
    forbiddenTokenError: "Token verification failed, access denied",
    xmlhttprequestError: "Cannot find request header x-requested-with: xmlhttprequest",
    apiError: "Incorrect key",
    forbiddenInstance:
      "[Forbidden] [Middleware] Incorrect parameters or illegal access to the instance",
    tooFast: "Too fast"
  },
  // src\app\service\system_remote_service.ts
  systemRemoteService: {
    nodeCount: "Number of remote nodes: {{n}}",
    loadDaemonTitle: "Attempting to read local daemon {{localKeyFilePath}}",
    autoCheckDaemon: "Detected local daemon, getting key and port automatically...",
    error:
      "The local daemon configuration file cannot be obtained automatically, please go to the panel to manually connect the daemon, go to https://docs.mcsmanager.com/ to learn more."
  },
  systemUser: {
    userCount: "Number of local users: {{n}}"
  },
  router: {
    user: {
      invalidUserName: "Invalid username format",
      invalidPassword: "Invalid password format",
      existsUserName: "Username has been occupied",
      deleteFailure: "Failed to complete user data deletion",
      passwordCheck:
        "The password is not standardized, it must have uppercase and lowercase letters, numbers, and the length is between 9 and 36"
    },
    instance: {
      createError: "Failed to create instance"
    },
    file: {
      off: "The administrator has restricted all users from using the file management function"
    },
    schedule: {
      invalidName: "Invalid scheduled task name"
    },
    login: {
      ban: "Too many authentications, your IP address has been locked for 10 minutes",
      nameOrPassError: "Incorrect account or password",
      init: "[Install Panel] Initializing panel admin account: {{userName}}",
      installed:
        "Panel is already installed and cannot be reinstalled, please backup and delete the data folder for a fresh install"
    }
  },
  daemonInfo: {
    setLanguage: "set remote node language",
    connect: "The remote node {{v}} is connected",
    disconnect: "The remote node {{v}} has been disconnected",
    connectError: "Error connecting to remote node: {{v}}",
    authSuccess: "Authentication of the remote node {{v}} succeeded",
    authFailure: "Authentication failed on remote node {{v}}",
    authError: "Authentication error on remote node {{v}}",
    closed: "Actively disconnect the remote node {{v}}",
    resetConnect:
      "The user initiates a reconnection to a remote node that is already available, and is resetting the connection channel",
    replaceConnect:
      "The user initiates a repeated connection request, now to reset the connection configuration",
    tryConnect: "Attempting to connect to remote node"
  }
};
// import { $t } from "../../i18n";
// $t("permission.forbiddenInstance");]
// $t("router.login.ban")
