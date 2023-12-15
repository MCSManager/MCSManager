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
import { INSTANCE_STATUS_CODE } from "@/types/const";

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
        daemonId: config.daemonId,
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
      // The backend needs to be consistent.
      // See "/daemon/src/entity/instance/Instance_config.ts"
      rows: 40,
      cols: 164
    });
    const fitAddon = new FitAddon();
    // term.loadAddon(fitAddon);
    term.open(element);
    // fitAddon.fit();
    termFitAddon.value = fitAddon;

    term.onData((data) => {
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
    if (state.value?.config?.terminalOption?.haveColor) {
      terminal.value?.write(encodeConsoleColor(v.text));
    } else {
      terminal.value?.write(v.text);
    }
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

  const isStopped = computed(() =>
    [INSTANCE_STATUS_CODE.STOPPED, INSTANCE_STATUS_CODE.UNKNOWN].includes(state?.value?.status ?? 0)
  );
  const isRunning = computed(() => !isStopped.value);

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

export function encodeConsoleColor(text: string) {
  text = text.replace(/(\x1B[^m]*m)/gm, "$1;");
  text = text.replace(/ \[([A-Za-z0-9 _\-\\.]+)]/gim, " [§3$1§r]");
  text = text.replace(/^\[([A-Za-z0-9 _\-\\.]+)]/gim, "[§3$1§r]");
  text = text.replace(/((["'])(.*?)\1)/gm, "§e$1§r");
  text = text.replace(/([0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2})/gim, "§6$1§r");
  text = text.replace(/([0-9]{2,4}[\/\-][0-9]{2,4}[\/\-][0-9]{2,4})/gim, "§6$1§r");
  text = text.replace(/(\x1B[^m]*m);/gm, "$1");
  // ["](.*?)["];
  text = text.replace(/§0/gim, TERM_COLOR.TERM_TEXT_BLACK);
  text = text.replace(/§1/gim, TERM_COLOR.TERM_TEXT_DARK_BLUE);
  text = text.replace(/§2/gim, TERM_COLOR.TERM_TEXT_DARK_GREEN);
  text = text.replace(/§3/gim, TERM_COLOR.TERM_TEXT_DARK_AQUA);
  text = text.replace(/§4/gim, TERM_COLOR.TERM_TEXT_DARK_RED);
  text = text.replace(/§5/gim, TERM_COLOR.TERM_TEXT_DARK_PURPLE);
  text = text.replace(/§6/gim, TERM_COLOR.TERM_TEXT_GOLD);
  text = text.replace(/§7/gim, TERM_COLOR.TERM_TEXT_GRAY);
  text = text.replace(/§8/gim, TERM_COLOR.TERM_TEXT_DARK_GRAY);
  text = text.replace(/§9/gim, TERM_COLOR.TERM_TEXT_BLUE);
  text = text.replace(/§a/gim, TERM_COLOR.TERM_TEXT_GREEN);
  text = text.replace(/§b/gim, TERM_COLOR.TERM_TEXT_AQUA);
  text = text.replace(/§c/gim, TERM_COLOR.TERM_TEXT_RED);
  text = text.replace(/§d/gim, TERM_COLOR.TERM_TEXT_LIGHT_PURPLE);
  text = text.replace(/§e/gim, TERM_COLOR.TERM_TEXT_YELLOW);
  text = text.replace(/§f/gim, TERM_COLOR.TERM_TEXT_WHITE);
  text = text.replace(/§k/gim, TERM_COLOR.TERM_TEXT_OBFUSCATED);
  text = text.replace(/§l/gim, TERM_COLOR.TERM_TEXT_BOLD);
  text = text.replace(/§m/gim, TERM_COLOR.TERM_TEXT_STRIKETHROUGH);
  text = text.replace(/§n/gim, TERM_COLOR.TERM_TEXT_UNDERLINE);
  text = text.replace(/§o/gim, TERM_COLOR.TERM_TEXT_ITALIC);
  text = text.replace(/§r/gim, TERM_COLOR.TERM_RESET);

  text = text.replace(/&0/gim, TERM_COLOR.TERM_TEXT_BLACK);
  text = text.replace(/&1/gim, TERM_COLOR.TERM_TEXT_DARK_BLUE);
  text = text.replace(/&2/gim, TERM_COLOR.TERM_TEXT_DARK_GREEN);
  text = text.replace(/&3/gim, TERM_COLOR.TERM_TEXT_DARK_AQUA);
  text = text.replace(/&4/gim, TERM_COLOR.TERM_TEXT_DARK_RED);
  text = text.replace(/&5/gim, TERM_COLOR.TERM_TEXT_DARK_PURPLE);
  text = text.replace(/&6/gim, TERM_COLOR.TERM_TEXT_GOLD);
  text = text.replace(/&7/gim, TERM_COLOR.TERM_TEXT_GRAY);
  text = text.replace(/&8/gim, TERM_COLOR.TERM_TEXT_DARK_GRAY);
  text = text.replace(/&9/gim, TERM_COLOR.TERM_TEXT_BLUE);
  text = text.replace(/&a/gim, TERM_COLOR.TERM_TEXT_GREEN);
  text = text.replace(/&b/gim, TERM_COLOR.TERM_TEXT_AQUA);
  text = text.replace(/&c/gim, TERM_COLOR.TERM_TEXT_RED);
  text = text.replace(/&d/gim, TERM_COLOR.TERM_TEXT_LIGHT_PURPLE);
  text = text.replace(/&e/gim, TERM_COLOR.TERM_TEXT_YELLOW);
  text = text.replace(/&f/gim, TERM_COLOR.TERM_TEXT_WHITE);
  text = text.replace(/&k/gim, TERM_COLOR.TERM_TEXT_OBFUSCATED);
  text = text.replace(/&l/gim, TERM_COLOR.TERM_TEXT_BOLD);
  text = text.replace(/&m/gim, TERM_COLOR.TERM_TEXT_STRIKETHROUGH);
  text = text.replace(/&n/gim, TERM_COLOR.TERM_TEXT_UNDERLINE);
  text = text.replace(/&o/gim, TERM_COLOR.TERM_TEXT_ITALIC);
  text = text.replace(/&r/gim, TERM_COLOR.TERM_RESET);

  const RegExpStringArr = [
    //blue
    ["\\d{1,3}%", "true", "false"],
    //green
    ["information", "info", "\\(", "\\)", "\\{", "\\}", '\\"', "&lt;", "&gt;", "-->", "->", ">>>"],
    //red
    ["Error", "Caused by", "panic"],
    //yellow
    ["WARNING", "Warn"]
  ];
  for (const k in RegExpStringArr) {
    for (const y in RegExpStringArr[k]) {
      const reg = new RegExp("(" + RegExpStringArr[k][y].replace(/ /gim, "&nbsp;") + ")", "igm");
      if (k === "0")
        //blue
        text = text.replace(reg, TERM_COLOR.TERM_TEXT_BLUE + "$1" + TERM_COLOR.TERM_RESET);
      if (k === "1")
        //green
        text = text.replace(reg, TERM_COLOR.TERM_TEXT_DARK_GREEN + "$1" + TERM_COLOR.TERM_RESET);
      if (k === "2")
        //red
        text = text.replace(reg, TERM_COLOR.TERM_TEXT_RED + "$1" + TERM_COLOR.TERM_RESET);
      if (k === "3")
        //yellow
        text = text.replace(reg, TERM_COLOR.TERM_TEXT_GOLD + "$1" + TERM_COLOR.TERM_RESET);
    }
  }
  // line ending symbol substitution
  text = text.replace(/\r\n/gm, TERM_COLOR.TERM_RESET + "\r\n");
  return text;
}
