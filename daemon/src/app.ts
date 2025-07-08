import http from "http";

import fs from "fs-extra";

import versionAdapter from "./service/version_adapter";

import { checkDependencies } from "./service/dependencies";

import { $t, i18next } from "./i18n";

import { getVersion, initVersionManager } from "./service/version";

import { globalConfiguration } from "./entity/config";

import { Server, Socket } from "socket.io";

import { LOCAL_PRESET_LANG_PATH } from "./const";

import logger from "./service/log";

import { GOLANG_ZIP_PATH, PTY_PATH } from "./const";

import * as router from "./service/router";

import * as koa from "./service/http";

import * as protocol from "./service/protocol";

import InstanceSubsystem from "./service/system_instance";

import "./service/async_task_service";

import "./service/async_task_service/quick_install";

import "./service/system_visual_data";

import { removeTrail } from "mcsmanager-common";


initVersionManager();

const VERSION = getVersion();


console.log(`

______ _______________________ ___ 

___ |/ /_ ____/_ ___/__ |/ /_____ _____________ _______ ___________________

__ /|_/ /_ / _____ \\__ /|_/ /_ __ \`/_ __ \\ __ \`/_ __ \`/ _ \\_ ___/

_ / / / / /___ ____/ /_ / / / / /_/ /_ / / / /_/ /_ /_/ // __/ / / /

/_/ /_/ \\____/ /____/ /_/ /_/ \\__,_/ /_/ /_/\\__,_/ _\\__, / \\___//_/ 

/____/ 

________ 

___ __ \\_____ ____________ ________________ 

__ / / / __ \`/ _ \\_ __ \`__ \\ __ \\_ __ \\ 

_ /_/ // /_/ // __/ / / / / / /_/ / / / / / 

/_____/ \\__,_/ \\___//_/ /_/ /_/\\____//_/ /_/ 


+ Copyright ${new Date().getFullYear()} MCSManager Dev <https://github.com/MCSManager>

+ Version ${VERSION}

`);


// Initialize the global configuration service

globalConfiguration.load();

const config = globalConfiguration.config;


// Detect whether the configuration file is from an older version and update it if so.

versionAdapter.detectConfig();


checkDependencies();


// Set language

if (fs.existsSync(LOCAL_PRESET_LANG_PATH)) {


