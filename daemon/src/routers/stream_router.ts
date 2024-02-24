import { $t } from "../i18n";
import * as protocol from "../service/protocol";
import { routerApp } from "../service/router";
import {
  LOGIN_FROM_STREAM,
  missionPassport,
  streamLoginSuccessful
} from "../service/mission_passport";
import InstanceSubsystem from "../service/system_instance";
import logger from "../service/log";
import SendCommand from "../entity/commands/cmd";
import { IGNORE } from "../const";

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
    return protocol.error(ctx, "error", IGNORE);
  }
  return await next();
});

// Publicly accessible dataflow authentication route
routerApp.on("stream/auth", (ctx, data) => {
  try {
    const password = data.password;
    const mission = missionPassport.getMission(password, "stream_channel");
    if (!mission) throw new Error($t("TXT_CODE_stream_router.taskNotExist"));

    // The instance UUID parameter must come from the task parameter and cannot be used directly
    const instance = InstanceSubsystem.getInstance(mission.parameter.instanceUuid);
    if (!instance) throw new Error($t("TXT_CODE_stream_router.instanceNotExist"));

    // Add the data stream authentication ID
    logger.info(
      $t("TXT_CODE_stream_router.authSuccess", {
        id: ctx.socket.id,
        address: ctx.socket.handshake.address
      })
    );

    streamLoginSuccessful(ctx, instance.instanceUuid);

    // Start forwarding output stream data to this Socket
    InstanceSubsystem.forward(instance.instanceUuid, ctx.socket);
    logger.info(
      $t("TXT_CODE_stream_router.establishConnection", {
        id: ctx.socket.id,
        address: ctx.socket.handshake.address,
        uuid: instance.instanceUuid
      })
    );

    // Cancel forwarding events when registration is disconnected
    ctx.socket.on("disconnect", () => {
      InstanceSubsystem.stopForward(instance.instanceUuid, ctx.socket);
      logger.info(
        $t("TXT_CODE_stream_router.disconnect", {
          id: ctx.socket.id,
          address: ctx.socket.handshake.address,
          uuid: instance.instanceUuid
        })
      );
    });
    protocol.response(ctx, true);
  } catch (error) {
    protocol.responseError(ctx, error, {
      notPrintErr: true
    });
  }
});

// Get instance details
routerApp.on("stream/detail", async (ctx) => {
  try {
    const instanceUuid = ctx.session?.stream?.instanceUuid;
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    protocol.response(ctx, {
      instanceUuid: instance.instanceUuid,
      started: instance.startCount,
      status: instance.status(),
      config: instance.config,
      info: instance.info
      // processInfo
    });
  } catch (error) {
    protocol.responseError(ctx, error);
  }
});

// Execute commands, line-based interactive input and output streams for ordinary processes
routerApp.on("stream/input", async (ctx, data) => {
  try {
    const command = data.command;
    const instanceUuid = ctx.session?.stream?.instanceUuid;
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    await instance.exec(new SendCommand(command));
  } catch (error) {
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
    if (instance.process) instance.process.write(buf);
  } catch (error) {
    // Ignore potential high frequency exceptions here
    // protocol.responseError(ctx, error);
  }
});

// handle terminal resize
routerApp.on("stream/resize", async (ctx, data) => {
  try {
    const instanceUuid = ctx.session?.stream?.instanceUuid;
    const instance = InstanceSubsystem.getInstance(instanceUuid);
    if (instance.config.processType === "docker") await instance.execPreset("resize", data);
  } catch (error) {
    // protocol.responseError(ctx, error);
  }
});
