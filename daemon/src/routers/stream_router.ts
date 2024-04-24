import { $t } from "../i18n";
import * as protocol from "../service/protocol";
import { routerApp } from "../service/router";
import {
  LOGIN_FROM_STREAM,
  missionPassport,
  streamLoginSuccessful
} from "../service/mission_passport";
import InstanceSubsystem from "../service/system_instance";
import SendCommand from "../entity/commands/cmd";
import { IGNORE } from "../const";
import logger from "../service/log";

// Authorization authentication middleware
routerApp.use(async (event, ctx, data, next) => {
  // release data flow authentication route
  if (event === "stream/auth") return next();
  // Check other routes for data flow
  if (event.startsWith("stream")) {
    if (
      ctx.session.stream &&
      ctx.session?.stream?.check === true &&
      ctx.session.type === LOGIN_FROM_STREAM
    ) {
      return await next();
    }
    return protocol.error(ctx, "error", IGNORE, {
      disablePrint: true
    });
  }
  return await next();
});

// Publicly accessible dataflow authentication route
routerApp.on("stream/auth", (ctx, data) => {
  try {
    const password = data.password;
    const mission = missionPassport.getMission(password, "stream_channel");
    if (!mission) throw new Error($t("TXT_CODE_stream_router.taskNotExist"));
    const instance = InstanceSubsystem.getInstance(mission.parameter.instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_stream_router.instanceNotExist"));
    // Auth success!
    streamLoginSuccessful(ctx, instance.instanceUuid);
    // Start forwarding output stream data to this Socket
    InstanceSubsystem.forward(instance.instanceUuid, ctx.socket);
    // Cancel forwarding events when registration is disconnected
    ctx.socket.on("disconnect", () => {
      InstanceSubsystem.stopForward(instance.instanceUuid, ctx.socket);
    });
    protocol.response(ctx, true);
  } catch (error: any) {
    protocol.responseError(ctx, error, {
      disablePrint: true
    });
  }
});

// Get instance details
routerApp.on("stream/detail", async (ctx) => {
  try {
    const instanceUuid = ctx.session?.stream?.instanceUuid;
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_3bfb9e04"));
    protocol.response(ctx, {
      instanceUuid: instance.instanceUuid,
      started: instance.startCount,
      status: instance.status(),
      config: instance.config,
      info: instance.info,
      watcher: instance.watchers.size
    });
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// Execute commands, line-based interactive input and output streams for ordinary processes
routerApp.on("stream/input", async (ctx, data) => {
  try {
    const command = data.command;
    const instanceUuid = ctx.session?.stream?.instanceUuid;
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    await instance?.exec(new SendCommand(command));
  } catch (error: any) {
    // Ignore potential high frequency exceptions here
    // protocol.responseError(ctx, error);
  }
});

// Process terminal input, suitable for direct connection input and output streams of simulated terminals.
routerApp.on("stream/write", async (ctx, data) => {
  try {
    const buf = data.input;
    const instanceUuid = ctx.session?.stream?.instanceUuid;
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    // run without command execution
    if (instance?.process) instance.process.write(buf);
  } catch (error: any) {
    // Ignore potential high frequency exceptions here
    // protocol.responseError(ctx, error);
  }
});

// handle terminal resize
// interface IResizeOptions {
//   h: number;
//   w: number;
// }
routerApp.on("stream/resize", async (ctx, data) => {
  try {
    const instanceUuid = ctx.session?.stream?.instanceUuid;
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    instance?.watchers.set(ctx.socket.id, {
      terminalSize: {
        w: Number(data.w) || 0,
        h: Number(data.h) || 0
      }
    });
    if (instance) await instance.execPreset("resize");
  } catch (error: any) {
    // protocol.responseError(ctx, error);
  }
});
