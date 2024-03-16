import { useAppConfigStore } from "@/stores/useAppConfigStore";
import axios from "axios";
import { reportErrorMsg } from "@/tools/validator";

const { getTheme } = useAppConfigStore();
class SandboxBridge {
  [key: string | symbol | number]: any;

  private _callbacks = new Map<string, Function[]>();

  // API
  public $axios = axios;
  public $realWindow = window;
  public $theme = getTheme();

  public $onMounted(callback: Function) {
    this._addCallback("onMounted", callback);
  }

  public $onUnmounted(callback: Function) {
    this._addCallback("onUnmounted", callback);
  }

  public $emit(event: string, ...args: any[]) {
    const callbacks = this._callbacks.get(event);
    if (callbacks && callbacks.length > 0) {
      callbacks.forEach((callback) => {
        try {
          callback.call(null, ...args);
        } catch (error: any) {
          reportErrorMsg(error);
        }
      });
    }
  }

  public $destroySandbox() {
    this.$emit("onUnmounted");
    // this._callbacks.clear();
  }

  public $mountSandbox() {
    this.$emit("onMounted");
  }

  private _addCallback(event: string, callback: Function) {
    const callbacks = this._callbacks.get(event) || [];
    callbacks.push(callback);
    this._callbacks.set(event, callbacks);
  }
}

export class ProxySandBox {
  public proxyWindow;
  public fakeWindow: SandboxBridge;

  constructor() {
    this.fakeWindow = new SandboxBridge();
    this.proxyWindow = new Proxy(this.fakeWindow, {
      set: (target, prop, value) => {
        target[prop] = value;
        return true;
      },
      get: (target, prop: any) => {
        const attr = prop in target ? target[prop] : window[prop];
        if (typeof attr === "function") {
          return attr.bind(prop in target ? target : window);
        }
        return attr;
      }
    });
  }

  public executeJavascript(code: string) {
    const proxyFunc = Function("window", `"use strict";\n${code}`);
    try {
      proxyFunc?.bind(this.proxyWindow)(this.proxyWindow);
    } catch (err) {
      console.error("Plugin HTML card Error:\n", err);
    }
  }

  public destroy() {
    this.fakeWindow.$destroySandbox();
  }

  public mount() {
    this.fakeWindow.$mountSandbox();
  }
}

export function useProxySandbox(code = "") {
  const sandbox = new ProxySandBox();
  sandbox.executeJavascript(code);
  return sandbox;
}
