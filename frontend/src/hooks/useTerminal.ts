import { setUpTerminalStreamChannel } from "@/services/apis/instance";
import { parseForwardAddress } from "@/tools/protocol";
import { onUnmounted, ref, unref } from "vue";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { t } from "@/lang/i18n";
import EventEmitter from "eventemitter3";
import type { DefaultEventsMap } from "@socket.io/component-emitter";
import type { InstanceDetail } from "@/types";

export interface UseTerminalParams {
  instanceId: string;
  daemonId: string;
}

export function useTerminal() {
  const events = new EventEmitter();
  let socket: Socket<DefaultEventsMap, DefaultEventsMap>;
  const state = ref<InstanceDetail>();
  const isReady = ref<boolean>(false);

  const execute = async (config: UseTerminalParams) => {
    isReady.value = false;
    const res = await setUpTerminalStreamChannel().execute({
      params: {
        remote_uuid: config.daemonId,
        uuid: config.instanceId
      }
    });
    const remoteInfo = unref(res.value);
    if (!remoteInfo) throw new Error(t("无法获取远程节点信息"));

    const addr = parseForwardAddress(remoteInfo?.addr, "ws");
    const password = remoteInfo.password;

    socket = io(addr, {});
    socket.on("connect", () => {
      socket.emit("stream/auth", {
        data: { password }
      });
    });

    socket.on("stream/auth", (packet) => {
      const data = packet.data;
      if (data === true) {
        socket.emit("stream/detail", {});
        events.emit("connect");
        isReady.value = true;
      } else {
        events.emit("error", new Error("Stream/auth error!"));
      }
    });

    socket.on("reconnect", () => {
      socket.emit("stream/auth", {
        data: { password }
      });
    });

    socket.on("disconnect", () => {
      events.emit("disconnect");
      socket.close();
    });

    socket.on("instance/stdout", (packet) => events.emit("stdout", packet?.data));
    socket.on("stream/detail", (packet) => {
      const v = packet?.data as InstanceDetail | undefined;
      state.value = v;
      events.emit("detail", v);
    });

    socket.connect();

    return socket;
  };

  onUnmounted(() => {
    events.removeAllListeners();
    socket.close();
  });

  return {
    execute,
    events,
    state
  };
}
