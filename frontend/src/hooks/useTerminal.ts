import { GLOBAL_INSTANCE_NAME } from "@/config/const";
import { useCommandHistory } from "@/hooks/useCommandHistory";
import { t } from "@/lang/i18n";
import { setUpTerminalStreamChannel } from "@/services/apis/instance";
import { useAppConfigStore } from "@/stores/useAppConfigStore";
import { mapDaemonAddress, parseForwardAddress } from "@/tools/protocol";
import type { InstanceDetail } from "@/types";
import { INSTANCE_STATUS_CODE } from "@/types/const";
import type { DefaultEventsMap } from "@socket.io/component-emitter";
import { CanvasAddon } from "@xterm/addon-canvas";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { Terminal } from "@xterm/xterm";
import EventEmitter from "eventemitter3";
import type { Socket } from "socket.io-client";
import { computed, onMounted, onUnmounted, ref, unref } from "vue";
import { makeSocketIo } from "./useSocketIo";

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

const { setHistory } = useCommandHistory();

export type UseTerminalHook = ReturnType<typeof useTerminal>;

export function useTerminal() {
  const { hasBgImage } = useAppConfigStore();

  const events = new EventEmitter();
  let socket: Socket<DefaultEventsMap, DefaultEventsMap> | undefined;
  const state = ref<InstanceDetail>();
  const isReady = ref<boolean>(false);
  const terminal = ref<Terminal>();
  const isConnect = ref<boolean>(false);
  const socketAddress = ref("");

  const isGlobalTerminal = computed(() => {
    return state.value?.config.nickname === GLOBAL_INSTANCE_NAME;
  });

  const isDockerMode = computed(() => {
    return state.value?.config.processType === "docker";
  });

  let fitAddonTask: NodeJS.Timer;
  let cachedSize = {
    w: 160,
    h: 40
  };

  const execute = async (config: UseTerminalParams) => {
    isReady.value = false;

    if (socket) {
      return socket;
    }

    const res = await setUpTerminalStreamChannel().execute({
      params: {
        daemonId: config.daemonId,
        uuid: config.instanceId
      }
    });
    const remoteInfo = unref(res.value);
    if (!remoteInfo) throw new Error(t("TXT_CODE_181f2f08"));

    let addr = remoteInfo.addr,
      prefix = remoteInfo.prefix;
    if (remoteInfo.remoteMappings) {
      const mapped = mapDaemonAddress(remoteInfo.remoteMappings);
      if (mapped) {
        addr = mapped.addr;
        prefix = mapped.prefix;
      }
    }
    socketAddress.value = parseForwardAddress(addr, "ws");
    const password = remoteInfo.password;

    socket = makeSocketIo(addr, prefix);

    socket.on("connect", () => {
      console.log("[Socket.io] connect:", addr);
      socket?.emit("stream/auth", {
        data: { password }
      });
      isConnect.value = true;
    });

    socket.on("connect_error", (error) => {
      console.error("[Socket.io] Connect error: ", addr, error);
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
      console.warn("[Socket.io] reconnect:", addr);
      isConnect.value = true;
      socket?.emit("stream/auth", {
        data: { password }
      });
    });

    socket.on("disconnect", () => {
      console.error("[Socket.io] disconnect:", addr);
      isConnect.value = false;
      events.emit("disconnect");
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

  const refreshWindowSize = (w: number, h: number) => {
    cachedSize = {
      w,
      h
    };
    socket?.emit("stream/resize", {
      data: cachedSize
    });
  };

  const touchHandler = (event: TouchEvent) => {
    const touches = event.changedTouches;
    const first = touches[0];

    let type = "";
    switch (event.type) {
      case "touchstart":
        type = "mousedown";
        break;
      case "touchmove":
        type = "mousemove";
        break;
      case "touchend":
        type = "mouseup";
        break;
      default:
        return;
    }

    const mouseEvent = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      screenX: first.screenX,
      screenY: first.screenY,
      clientX: first.clientX,
      clientY: first.clientY,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      button: 0,
      relatedTarget: null
    });

    first.target.dispatchEvent(mouseEvent);
    if (type === "mousedown") {
      event.preventDefault();
    }
  };

  const initTerminalWindow = (element: HTMLElement) => {
    if (terminal.value) {
      throw new Error("Terminal already initialized, Please refresh the page!");
    }

    // init touch handler
    element.addEventListener("touchstart", touchHandler, true);
    element.addEventListener("touchmove", touchHandler, true);
    element.addEventListener("touchend", touchHandler, true);
    element.addEventListener("touchcancel", touchHandler, true);

    const background = hasBgImage.value ? "#00000000" : "#1e1e1e";
    const term = new Terminal({
      convertEol: true,
      disableStdin: false,
      cursorStyle: "underline",
      cursorBlink: true,
      fontSize: 14,
      theme: {
        background
      },
      allowProposedApi: true,
      allowTransparency: true
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    terminal.value = term;

    const gl = document.createElement("canvas").getContext("webgl2");
    if (gl) {
      // If WebGL2 is supported, use the WebGlAddon
      const webglAddon = new WebglAddon();
      webglAddon.onContextLoss((_) => {
        webglAddon.dispose();
      });
      term.loadAddon(webglAddon);
    } else {
      // If WebGL2 is not supported, use the CanvasAddon
      const canvasAddon = new CanvasAddon();
      term.loadAddon(canvasAddon);
    }

    term.open(element);

    // If text is selected, copy it. Otherwise, fallback to default behavior.
    term.attachCustomKeyEventHandler((arg) => {
      if (arg.type === "keydown" && arg.ctrlKey && arg.code === "KeyC") {
        const selection = term.getSelection();
        if (selection) {
          // If not in SecureContext, writeText will fail. Fallback to browser's default copy behavior, but selection won't be cleared.
          if (window.isSecureContext) {
            arg.preventDefault()
          }

          navigator.clipboard?.writeText(selection).then(() => {
             term.clearSelection();
          }).catch(err => {
             console.error("Could not copy text: ", err);
          });

          return false;
        }
      }

      return true;
    });

    // Auto resize pty win size
    fitAddon.fit();
    refreshWindowSize(term.cols - 1, term.rows - 1);
    fitAddonTask = setInterval(() => {
      fitAddon.fit();
      refreshWindowSize(term.cols - 1, term.rows - 1);
    }, 2000);

    let lastCtrlCTime = 0;
    const ctrlCTimeThreshold = 500;

    function sendInput(data: string) {
      socket?.emit("stream/write", {
        data: { input: data }
      });
    }

    term.onData((data) => {
      // If the PTY terminal is disabled, no input is sent.
      if (
        state.value?.config.terminalOption?.pty === false ||
        state.value?.status === INSTANCE_STATUS_CODE.STOPPED
      ) {
        return;
      }

      if (data !== "\x03") {
        lastCtrlCTime = 0;
        return sendInput(data);
      }
      const now = Date.now();
      if (now - lastCtrlCTime < ctrlCTimeThreshold) {
        term.write("\r\n" + t("TXT_CODE_3725b37b") + "\r\n");
        sendInput(data);
        lastCtrlCTime = 0;
      } else {
        lastCtrlCTime = now;
        term.write("\r\n" + t("TXT_CODE_3fd222b0"));
      }
    });

    return term;
  };

  const clearTerminal = () => {
    terminal.value?.clear();
  };

  events.on("stdout", (v: StdoutData) => {
    if (state.value?.config?.terminalOption?.haveColor) {
      terminal.value?.write(encodeConsoleColor(v.text));
    } else {
      terminal.value?.write(v.text);
    }
  });

  const sendCommand = (command: string) => {
    setHistory(command);
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
      if (socket?.connected) socket?.emit("stream/detail", {});
    }, 1000);
  });

  onUnmounted(() => {
    clearInterval(fitAddonTask);
    clearInterval(statusQueryTask);
    events.removeAllListeners();
    socket?.disconnect();
    socket?.removeAllListeners();
  });

  const isStopped = computed(() => state?.value?.status === INSTANCE_STATUS_CODE.STOPPED);
  const isRunning = computed(() => state?.value?.status === INSTANCE_STATUS_CODE.RUNNING);
  const isBuys = computed(() => state?.value?.status === INSTANCE_STATUS_CODE.BUSY);

  return {
    events,
    state,
    isRunning,
    isBuys,
    isStopped,
    terminal,
    socketAddress,
    isConnect,
    isGlobalTerminal,
    isDockerMode,
    execute,
    initTerminalWindow,
    sendCommand,
    clearTerminal
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
