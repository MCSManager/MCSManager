import Router from "@koa/router";
import { ROLE } from "../entity/user";
import permission from "../middleware/permission";
import RemoteRequest from "../service/remote_command";
import RemoteServiceSubsystem from "../service/remote_service";

const router = new Router({ prefix: "/java_manager" });

import validator from "../middleware/validator";

router.get(
  "/list",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { daemonId: String } }),
  async (ctx) => {
    const daemonId = String(ctx.query.daemonId);
    const remoteService = RemoteServiceSubsystem.getInstance(daemonId);

    const response = await new RemoteRequest(remoteService).request("java_manager/list");
    ctx.body = response;
  }
);

router.post(
  "/download",
  permission({ level: ROLE.ADMIN }),
  validator({
    query: {
      daemonId: String
    },
    body: {
      name: String,
      version: String
    }
  }),
  async (ctx) => {
    const daemonId = String(ctx.query.daemonId);
    const remoteService = RemoteServiceSubsystem.getInstance(daemonId);

    const response = await new RemoteRequest(remoteService).request("java_manager/download", {
      name: ctx.request.body.name,
      version: ctx.request.body.version
    });
    ctx.body = response;
  }
);

router.post(
  "/using",
  permission({ level: ROLE.ADMIN }),
  validator({
    query: {
      daemonId: String,
      instanceId: String
    },
    body: {
      id: String
    }
  }),
  async (ctx) => {
    const daemonId = String(ctx.query.daemonId);
    const remoteService = RemoteServiceSubsystem.getInstance(daemonId);

    const response = await new RemoteRequest(remoteService).request("java_manager/using", {
      instanceId: ctx.query.instanceId,
      id: ctx.request.body.id
    });
    ctx.body = response;
  }
);

router.delete(
  "/delete",
  permission({ level: ROLE.ADMIN }),
  validator({
    query: {
      daemonId: String
    },
    body: {
      id: String
    }
  }),
  async (ctx) => {
    const daemonId = String(ctx.query.daemonId);
    const remoteService = RemoteServiceSubsystem.getInstance(daemonId);

    const response = await new RemoteRequest(remoteService).request("java_manager/delete", {
      id: ctx.request.body.id
    });
    ctx.body = response;
  }
);

export default router;
