import { setUpTerminalStreamChannel } from "@/services/apis/instance";
import { parseForwardAddress } from "@/tools/protocol";
import { computed, onMounted, onUnmounted, ref, unref } from "vue";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { t } from "@/lang/i18n";
import EventEmitter from "eventemitter3";
import type { DefaultEventsMap } from "@socket.io/component-emitter";
import type { InstanceDetail } from "@/types";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { useScreen } from "./useScreen";

export const TERM_COLOR = {
  TERM_RESET: "\x1B[0m",
  TERM_TEXT_BLACK: "\x1B[0;30m", // Black §0
  TERM_TEXT_DARK_BLUE: "\x1B[0;34m", // Dark Blue §1
  TERM_TEXT_DARK_GREEN: "\x1B[0;32m", // Dark Green §2
  TERM_TEXT_DARK_AQUA: "\x1B[0;36m", // Dark Aqua §3
  TERM_TEXT_DARK_RED: "\x1B[0;31m", // Dark Red §4
  TERM_TEXT_DARK_PURPLE: "\x1B[0;35m", // Dark Purple §5
  TERM_TEXT_GOLD: "\x1B[0;33m", // Gold §6
  TERM_TEXT_GRAY: "\x1B[0;37m", // Gray §7
  TERM_TEXT_DARK_GRAY: "\x1B[0;30;1m", // Dark Gray §8
  TERM_TEXT_BLUE: "\x1B[0;34;1m", // Blue §9
  TERM_TEXT_GREEN: "\x1B[0;32;1m", // Green §a
  TERM_TEXT_AQUA: "\x1B[0;36;1m", // Aqua §b
  TERM_TEXT_RED: "\x1B[0;31;1m", // Red §c
  TERM_TEXT_LIGHT_PURPLE: "\x1B[0;35;1m", // Light Purple §d
  TERM_TEXT_YELLOW: "\x1B[0;33;1m", // Yellow §e
  TERM_TEXT_WHITE: "\x1B[0;37;1m", // White §f
  TERM_TEXT_OBFUSCATED: "\x1B[5m", // Obfuscated §k
  TERM_TEXT_BOLD: "\x1B[21m", // Bold §l
  TERM_TEXT_STRIKETHROUGH: "\x1B[9m", // Strikethrough §m
  TERM_TEXT_UNDERLINE: "\x1B[4m", // Underline §n
  TERM_TEXT_ITALIC: "\x1B[3m", // Italic §o
  TERM_TEXT_B: "\x1B[1m"
};
export interface UseTerminalParams {
  instanceId: string;
  daemonId: string;
}

export interface StdoutData {
  instanceUuid: string;
  text: string;
}

export function useTerminal() {
  const events = new EventEmitter();
  let socket: Socket<DefaultEventsMap, DefaultEventsMap> | undefined;
  const state = ref<InstanceDetail>();
  const isReady = ref<boolean>(false);
  const terminal = ref<Terminal>();
  const termFitAddon = ref<FitAddon>();
  const isConnect = ref<boolean>(false);
  const socketAddress = ref("");

  const execute = async (config: UseTerminalParams) => {
    isReady.value = false;
    const res = await setUpTerminalStreamChannel().execute({
      params: {
        remote_uuid: config.daemonId,
        uuid: config.instanceId
      }
    });
    const remoteInfo = unref(res.value);
    if (!remoteInfo) throw new Error(t("TXT_CODE_181f2f08"));

    const addr = parseForwardAddress(remoteInfo?.addr, "ws");
    socketAddress.value = addr;
    const password = remoteInfo.password;

    socket = io(addr, {});

    socket.on("connect", () => {
      socket?.emit("stream/auth", {
        data: { password }
      });
      isConnect.value = true;
    });

    socket.on("connect_error", (error) => {
      isConnect.value = false;
      events.emit("error", error);
    });

    socket.on("instance/stopped", () => {
      events.emit("stopped");
    });

    socket.on("instance/opened", () => {
      events.emit("opened");
    });

    socket.on("stream/auth", (packet) => {
      const data = packet.data;
      if (data === true) {
        socket?.emit("stream/detail", {});
        events.emit("connect");
        isReady.value = true;
      } else {
        events.emit("error", new Error("Stream/auth error!"));
      }
    });

    socket.on("reconnect", () => {
      isConnect.value = true;
      socket?.emit("stream/auth", {
        data: { password }
      });
    });

    socket.on("disconnect", () => {
      isConnect.value = false;
      events.emit("disconnect");
      socket?.close();
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

  const initTerminalWindow = (element: HTMLElement) => {
    const term = new Terminal({
      convertEol: true,
      disableStdin: false,
      cursorStyle: "underline",
      cursorBlink: true,
      fontSize: 14,
      theme: {
        background: "#1e1e1e"
      },
      allowProposedApi: true,
      rendererType: "canvas",
      rows: 40,
      cols: 160
    });
    const fitAddon = new FitAddon();
    // term.loadAddon(fitAddon);
    term.open(element);
    // fitAddon.fit();
    termFitAddon.value = fitAddon;

    term.onData((data) => {
      console.debug("Termin OnData:", data);
      socket?.emit("stream/stdin", { data });
    });
    term.writeln(
      `${TERM_COLOR.TERM_TEXT_GREEN}[MCSManager] ${TERM_COLOR.TERM_TEXT_GRAY}Instance app terminal.${TERM_COLOR.TERM_RESET}`
    );
    term.writeln(
      `${TERM_COLOR.TERM_TEXT_GREEN}[MCSManager] ${TERM_COLOR.TERM_TEXT_GRAY}Terminal is ready.${TERM_COLOR.TERM_RESET}\r\n`
    );

    terminal.value = term;
    return term;
  };

  events.on("stdout", (v: StdoutData) => {
    terminal.value?.write(v.text);
  });

  const sendCommand = (command: string) => {
    if (!socket?.connected) throw new Error(t("TXT_CODE_74443c8f"));
    socket.emit("stream/input", {
      data: {
        command
      }
    });
  };

  let statusQueryTask: NodeJS.Timeout;
  onMounted(() => {
    statusQueryTask = setInterval(() => {
      socket?.emit("stream/detail", {});
    }, 1000);
  });

  onUnmounted(() => {
    clearInterval(statusQueryTask);
    events.removeAllListeners();

    socket?.close();
  });

  const isRunning = computed(() => state?.value?.status === 3);
  const isStopped = computed(() => state?.value?.status === 0);

  return {
    events,
    state,
    isRunning,
    isStopped,
    terminal,
    socketAddress,
    isConnect,
    execute,
    initTerminalWindow,
    sendCommand
  };
}
