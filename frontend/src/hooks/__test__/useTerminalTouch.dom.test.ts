// @vitest-environment jsdom

import type { IBuffer, IMarker, Terminal } from "@xterm/xterm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { attachTerminalTouchControls } from "../useTerminalTouch";

vi.mock("@/lang/i18n", () => ({
  t: (key: string) => key
}));

vi.mock("@/tools/copy", () => ({
  toCopy: vi.fn()
}));

vi.mock("ant-design-vue", () => ({
  message: { error: vi.fn() }
}));

function createTouchEvent(type: string, clientX: number, clientY: number): TouchEvent {
  const event = new Event(type, { bubbles: true, cancelable: true }) as TouchEvent;
  const touch = { clientX, clientY, pageY: clientY };
  Object.defineProperty(event, "touches", {
    value: type === "touchend" ? [] : [touch]
  });
  return event;
}

type MutableMarker = IMarker & { line: number };
type TerminalMock = Terminal & {
  emitWriteParsed: () => void;
  trackedMarkers: MutableMarker[];
};

function createTerminalMock(viewportY = 0, length = 4): TerminalMock {
  let hasSelection = false;
  let writeParsedListener: (() => void) | undefined;
  const trackedMarkers: MutableMarker[] = [];
  const cells = Array.from({ length: 40 }, (_, column) => ({
    getChars: () => (column < 5 ? "hello"[column] : " "),
    getWidth: () => 1
  }));
  const buffer = {
    type: "normal",
    length,
    viewportY,
    baseY: viewportY,
    cursorY: 3,
    getLine: () => ({
      getCell: (column: number) => cells[column]
    })
  } as unknown as IBuffer;
  const disposable = () => ({ dispose: vi.fn() });
  const terminal = {
    buffer: { active: buffer },
    cols: 10,
    rows: 4,
    blur: vi.fn(),
    clearSelection: vi.fn(() => {
      hasSelection = false;
    }),
    focus: vi.fn(),
    getSelection: vi.fn(() => "hello"),
    hasSelection: vi.fn(() => hasSelection),
    onResize: vi.fn(disposable),
    onScroll: vi.fn(disposable),
    onSelectionChange: vi.fn(disposable),
    onWriteParsed: vi.fn((listener: () => void) => {
      writeParsedListener = listener;
      return disposable();
    }),
    paste: vi.fn(),
    registerMarker: vi.fn((cursorYOffset = 0) => {
      const marker = {
        id: trackedMarkers.length + 1,
        line: buffer.baseY + buffer.cursorY + cursorYOffset,
        onDispose: vi.fn(),
        dispose: vi.fn()
      } as unknown as MutableMarker;
      marker.dispose = vi.fn(() => {
        marker.line = -1;
      });
      trackedMarkers.push(marker);
      return marker;
    }),
    scrollToLine: vi.fn(),
    select: vi.fn(() => {
      hasSelection = true;
    })
  } as unknown as TerminalMock;
  terminal.trackedMarkers = trackedMarkers;
  terminal.emitWriteParsed = () => writeParsedListener?.();
  return terminal;
}

function createHost() {
  const host = document.createElement("div");
  const viewport = document.createElement("div");
  viewport.className = "xterm-viewport";
  const screen = document.createElement("div");
  screen.className = "xterm-screen";
  host.append(viewport, screen);
  document.body.appendChild(host);

  Object.defineProperty(host, "clientWidth", { value: 100 });
  Object.defineProperty(host, "clientHeight", { value: 80 });
  host.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 80 }) as DOMRect;
  screen.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 80 }) as DOMRect;
  return host;
}

describe("terminal touch controls", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("creates a cell-based word selection and shows both handles after a long press", () => {
    const terminal = createTerminalMock();
    const host = createHost();
    const dispose = attachTerminalTouchControls({
      element: host,
      terminal,
      canPaste: () => false
    });

    host.dispatchEvent(createTouchEvent("touchstart", 25, 10));
    vi.advanceTimersByTime(500);

    expect(terminal.select).toHaveBeenCalledWith(0, 0, 5);
    expect(host.querySelector<HTMLElement>(".xterm-touch-selection-ui")?.hidden).toBe(false);
    expect(host.querySelectorAll(".xterm-touch-selection-handle")).toHaveLength(2);
    expect(
      host.querySelectorAll<HTMLButtonElement>(".xterm-touch-selection-toolbar button")[1].hidden
    ).toBe(true);

    dispose();
  });

  it("clears an active selection when the terminal is touched again", () => {
    const terminal = createTerminalMock();
    const host = createHost();
    const dispose = attachTerminalTouchControls({
      element: host,
      terminal,
      canPaste: () => true
    });

    host.dispatchEvent(createTouchEvent("touchstart", 25, 10));
    vi.advanceTimersByTime(500);
    host.dispatchEvent(createTouchEvent("touchstart", 80, 60));

    expect(terminal.clearSelection).toHaveBeenCalled();
    expect(host.querySelector<HTMLElement>(".xterm-touch-selection-ui")?.hidden).toBe(true);

    dispose();
  });

  it("does not focus the terminal for input when PTY input is unavailable", () => {
    const terminal = createTerminalMock();
    const host = createHost();
    const dispose = attachTerminalTouchControls({
      element: host,
      terminal,
      canPaste: () => false
    });

    host.dispatchEvent(createTouchEvent("touchstart", 25, 10));
    host.dispatchEvent(createTouchEvent("touchend", 25, 10));

    expect(terminal.focus).not.toHaveBeenCalled();

    dispose();
  });

  it("keeps mouse context menus while suppressing touch-generated context menus", () => {
    const terminal = createTerminalMock();
    const host = createHost();
    const dispose = attachTerminalTouchControls({
      element: host,
      terminal,
      canPaste: () => true
    });

    const mouseContextMenu = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    host.dispatchEvent(mouseContextMenu);
    expect(mouseContextMenu.defaultPrevented).toBe(false);

    host.dispatchEvent(createTouchEvent("touchstart", 25, 10));
    const touchContextMenu = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    host.dispatchEvent(touchContextMenu);
    expect(touchContextMenu.defaultPrevented).toBe(true);

    dispose();
  });

  it("swaps handle roles when the start handle is dragged past the end handle", () => {
    const terminal = createTerminalMock();
    const host = createHost();
    const dispose = attachTerminalTouchControls({
      element: host,
      terminal,
      canPaste: () => true
    });

    host.dispatchEvent(createTouchEvent("touchstart", 25, 10));
    vi.advanceTimersByTime(500);

    const startHandle = host.querySelector<HTMLElement>(".xterm-touch-selection-handle.is-start");
    startHandle?.dispatchEvent(createTouchEvent("touchstart", 0, 20));
    startHandle?.dispatchEvent(createTouchEvent("touchmove", 80, 20));

    expect(terminal.select).toHaveBeenLastCalledWith(5, 0, 3);
    expect(startHandle?.classList.contains("is-end")).toBe(true);

    dispose();
  });

  it("keeps the selection anchored when scrollback trimming shifts buffer lines", () => {
    const terminal = createTerminalMock(1, 6);
    const host = createHost();
    const dispose = attachTerminalTouchControls({
      element: host,
      terminal,
      canPaste: () => true
    });

    host.dispatchEvent(createTouchEvent("touchstart", 25, 30));
    vi.advanceTimersByTime(500);
    expect(terminal.select).toHaveBeenLastCalledWith(0, 2, 5);

    terminal.trackedMarkers.forEach((marker) => {
      marker.line -= 1;
    });
    terminal.emitWriteParsed();

    expect(terminal.scrollToLine).toHaveBeenLastCalledWith(0);
    expect(terminal.select).toHaveBeenLastCalledWith(0, 1, 5);

    dispose();
  });
});
