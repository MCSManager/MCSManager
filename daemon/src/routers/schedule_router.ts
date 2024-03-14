import { routerApp } from "../service/router";
import * as protocol from "../service/protocol";
import InstanceControlSubsystem from "../service/system_instance_control";

// create a scheduled task
routerApp.on("schedule/register", (ctx, data) => {
  try {
    InstanceControlSubsystem.registerScheduleJob(data);
    protocol.response(ctx, true);
  } catch (error: any) {
    protocol.responseError(ctx, error);
  }
});

// get the task list
routerApp.on("schedule/list", (ctx, data) => {
  protocol.response(ctx, InstanceControlSubsystem.listScheduleJob(data.instanceUuid));
});

// delete the task plan
routerApp.on("schedule/delete", (ctx, data) => {
  InstanceControlSubsystem.deleteScheduleTask(data.instanceUuid, data.name);
  protocol.response(ctx, true);
});
