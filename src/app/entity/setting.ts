// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

// @Entity
export default class SystemConfig {
  // HTTP service port and IP
  httpPort: number = 23333;
  httpIp: string = null;

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
  maxDonwload: number = 10;
  // Decompression implementation form
  zipType: number = 1;
  // Login times IP limit
  loginCheckIp: boolean = true;
  // login interface copy
  loginInfo: string = "";
  // Whether to open the file management function for ordinary users
  canFileManager = true;

  // i18n
  language = "en_us";

  // Quick installation address for the Chinese market
  quickInstallAddr = "https://mcsmanager.oss-cn-guangzhou.aliyuncs.com/quick_install.json";
  redisUrl = "";
}
