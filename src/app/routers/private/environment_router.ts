// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

import Router from "@koa/router";
import permission from "../../middleware/permission";
import validator from "../../middleware/validator";
import RemoteServiceSubsystem from "../../service/system_remote_service";
import RemoteRequest from "../../service/remote_command";

const router = new Router({ prefix: "/environment" });

// [Top-level Permission]
// Get the specified remote service mirror list
router.get(
  "/image",
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const config = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String, imageId: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const imageId = String(ctx.query.imageId);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
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
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("environment/progress", {});
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

export default router;
