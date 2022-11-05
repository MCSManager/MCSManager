// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

import Router from "@koa/router";
import permission from "../../middleware/permission";
import validator from "../../middleware/validator";
import RemoteServiceSubsystem from "../../service/system_remote_service";
import RemoteRequest from "../../service/remote_command";
import { multiOperationForwarding } from "../../service/instance_service";
import { timeUuid } from "../../service/password";
import { $t } from "../../i18n";
import axios from "axios";
import { systemConfig } from "../../setting";

const router = new Router({ prefix: "/instance" });

// [Top-level Permission]
// Get the details of an instance
router.get(
  "/",
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/detail", {
        instanceUuid
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// create instance
router.post(
  "/",
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const config = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/new", config);
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// upload the file when creating the instance
router.post(
  "/upload",
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String, upload_dir: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      // const uploadDir = String(ctx.query.upload_dir);
      const config = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/new", config);
      const newInstanceUuid = result.instanceUuid;
      if (!newInstanceUuid) throw new Error($t("router.instance.createError"));
      // Send a cross-end file upload task to the daemon
      const addr = `${remoteService.config.ip}:${remoteService.config.port}`;
      const password = timeUuid();
      await new RemoteRequest(remoteService).request("passport/register", {
        name: "upload",
        password: password,
        parameter: {
          uploadDir: ".",
          instanceUuid: newInstanceUuid
        }
      });
      ctx.body = {
        instanceUuid: newInstanceUuid,
        password,
        addr
      };
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// Update instance information (manage users)
router.put(
  "/",
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String, uuid: String } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuid = String(ctx.query.uuid);
      const config = ctx.request.body;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/update", {
        instanceUuid,
        config
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// delete instance
router.delete(
  "/",
  permission({ level: 10 }),
  validator({ query: { remote_uuid: String }, body: { uuids: Object, deleteFile: Boolean } }),
  async (ctx) => {
    try {
      const serviceUuid = String(ctx.query.remote_uuid);
      const instanceUuids = ctx.request.body.uuids;
      const deleteFile = ctx.request.body.deleteFile;
      const remoteService = RemoteServiceSubsystem.getInstance(serviceUuid);
      const result = await new RemoteRequest(remoteService).request("instance/delete", {
        instanceUuids,
        deleteFile
      });
      ctx.body = result;
    } catch (err) {
      ctx.body = err;
    }
  }
);

// [Top-level Permission]
// Open instance routing in batches
router.post("/multi_open", permission({ level: 10 }), async (ctx) => {
  try {
    const instances = ctx.request.body;
    multiOperationForwarding(instances, async (remoteUuid: string, instanceUuids: string[]) => {
      const remoteService = RemoteServiceSubsystem.getInstance(remoteUuid);
      new RemoteRequest(remoteService)
        .request("instance/open", {
          instanceUuids
        })
        .catch(() => {});
    });
    ctx.body = true;
  } catch (err) {
    ctx.body = err;
  }
});

// [Top-level Permission]
//Close instance routing in batches
router.post("/multi_stop", permission({ level: 10 }), async (ctx) => {
  try {
    const instances = ctx.request.body;
    multiOperationForwarding(instances, async (remoteUuid: string, instanceUuids: string[]) => {
      const remoteService = RemoteServiceSubsystem.getInstance(remoteUuid);
      new RemoteRequest(remoteService)
        .request("instance/stop", {
          instanceUuids
        })
        .catch(() => {});
    });
    ctx.body = true;
  } catch (err) {
    ctx.body = err;
  }
});

// [Top-level Permission]
// batch terminate instance routing
router.post("/multi_kill", permission({ level: 10 }), async (ctx) => {
  try {
    const instances = ctx.request.body;
    multiOperationForwarding(instances, async (remoteUuid: string, instanceUuids: string[]) => {
      const remoteService = RemoteServiceSubsystem.getInstance(remoteUuid);
      new RemoteRequest(remoteService)
        .request("instance/kill", { instanceUuids })
        .catch((err) => {});
    });
    ctx.body = true;
  } catch (err) {
    ctx.body = err;
  }
});

// [Top-level Permission]
// Get quick install list
router.get("/quick_install_list", permission({ level: 10 }), async (ctx) => {
  const ADDR = systemConfig.quickInstallAddr;
  try {
    const response = await axios.request({
      method: "GET",
      url: ADDR
    });
    if (response.status !== 200) throw new Error("Response code != 200");
    ctx.body = response.data;
  } catch (err) {
    ctx.body = [];
  }
});

// [Top-level Permission]
// forward request
router.all(
  "/forward",
  permission({ level: 10 }),
  validator({ query: { target: String } }),
  async (ctx) => {
    const ADDR = String(ctx.query.target);
    try {
      const response = await axios.request({
        method: ctx.request.method,
        url: ADDR,
        data: ctx.request.body
      });
      if (response.status !== 200) throw new Error("Response code != 200");
      ctx.body = response.data;
    } catch (err) {
      ctx.body = [];
    }
  }
);

export default router;
