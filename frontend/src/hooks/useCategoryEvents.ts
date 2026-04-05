import { createGlobalState } from "@vueuse/core";
import EventEmitter from "eventemitter3";

export const useCategoryEvents = createGlobalState(() => {
  const events = new EventEmitter();
  const on = (id: string, event: string, callback: (...args: any[]) => void) => {
    events.on(id + event, callback);
  };
  const emit = (id: string, event: string, ...args: any[]) => {
    events.emit(id + event, ...args);
  };

  const off = (id: string, event: string) => {
    events.removeAllListeners(id + event);
  };
  return { on, emit, off };
});
