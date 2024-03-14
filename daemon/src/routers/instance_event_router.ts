import path from "path";

import RouterContext from "../entity/ctx";
import * as protocol from "../service/protocol";
import InstanceSubsystem from "../service/system_instance";
import fs from "fs-extra";
const MAX_LOG_SIZE = 512;

// buffer
const buffer = new Map<string, string>();
setInterval(() => {
  buffer.forEach((buf, instanceUuid) => {
    if (!buf || !instanceUuid) return;
    const logFilePath = path.join(InstanceSubsystem.LOG_DIR, `${instanceUuid}.log`);
    if (!fs.existsSync(InstanceSubsystem.LOG_DIR)) fs.mkdirsSync(InstanceSubsystem.LOG_DIR);
    try {
      const fileInfo = fs.statSync(logFilePath);
      if (fileInfo && fileInfo.size > 1024 * MAX_LOG_SIZE) fs.removeSync(logFilePath);
    } catch (err: any) {}
    fs.writeFile(logFilePath, buf, { encoding: "utf-8", flag: "a" }, () => {
      buffer.set(instanceUuid, "");
    });
  });
}, 500);

// output stream record to buffer
async function outputLog(instanceUuid: string, text: string) {
  const buf = (buffer.get(instanceUuid) ?? "") + text;
  if (buf.length > 1024 * 1024) buffer.set(instanceUuid, "");
  buffer.set(instanceUuid, buf ?? null);
}

// instance output stream event
// By default, it is added to the data cache to control the sending rate to ensure its stability
InstanceSubsystem.on("data", (instanceUuid: string, text: string) => {
  InstanceSubsystem.forEachForward(instanceUuid, (socket) => {
    protocol.msg(new RouterContext(null, socket), "instance/stdout", {
      instanceUuid: instanceUuid,
      text: text
    });
  });
  // Append the output to the log file
  outputLog(instanceUuid, text)
    .then(() => {})
    .catch(() => {});
});

// instance exit event
InstanceSubsystem.on("exit", (obj: any) => {
  InstanceSubsystem.forEachForward(obj.instanceUuid, (socket) => {
    protocol.msg(new RouterContext(null, socket), "instance/stopped", {
      instanceUuid: obj.instanceUuid,
      instanceName: obj.instanceName
    });
  });
});

// instance start event
InstanceSubsystem.on("open", (obj: any) => {
  InstanceSubsystem.forEachForward(obj.instanceUuid, (socket) => {
    protocol.msg(new RouterContext(null, socket), "instance/opened", {
      instanceUuid: obj.instanceUuid,
      instanceName: obj.instanceName
    });
  });
});

// Instance failure event (usually used for startup failure, or other operation failures)
InstanceSubsystem.on("failure", (obj: any) => {
  InstanceSubsystem.forEachForward(obj.instanceUuid, (socket) => {
    protocol.msg(new RouterContext(null, socket), "instance/failure", {
      instanceUuid: obj.instanceUuid,
      instanceName: obj.instanceName
    });
  });
});
