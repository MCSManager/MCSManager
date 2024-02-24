import Router from "@koa/router";
import permission from "../middleware/permission";
import validator from "../middleware/validator";
import RemoteServiceSubsystem from "../service/remote_service";
import RemoteRequest from "../service/remote_command";
import { ROLE } from "../entity/user";

const router = new Router({ prefix: "/environment" });

// [Top-level Permission]
// Get the specified remote service mirror list
router.get(
  "/image",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { daemonId: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("environment/images", {});
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// create image
router.post(
  "/image",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { daemonId: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const config = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request(
        "environment/new_image",
        config
      );
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// delete the specified image
router.delete(
  "/image",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { daemonId: String, imageId: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const imageId = String(ctx.query.imageId);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("environment/del_image", {
        imageId
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// Get the list of existing containers of the specified remote service
router.get(
  "/containers",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { daemonId: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("environment/containers", {});
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// Get the list of existing networks for the specified remote service
router.get(
  "/networkModes",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { daemonId: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("environment/networkModes", {});
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// Get the image creation progress of the specified remote service
router.get(
  "/progress",
  permission({ level: ROLE.ADMIN }),
  validator({ query: { daemonId: String } }),
  async (ctx) => {
    try {
      const daemonId = String(ctx.query.daemonId);
      const remoteService = RemoteServiceSubsystem.getInstance(daemonId);
      const result = await new RemoteRequest(remoteService).request("environment/progress", {});
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

export default router;
