/* eslint-disable vue/one-component-per-file */

import { createApp, type Component, type App } from "vue";
import { sleep } from "@/tools/common";

export function useMountComponent(data: Record<string, any> = {}) {
  let isOpen = false;
  const mount = <T>(component: Component) => {
    if (isOpen) return;
    isOpen = true;
    return new Promise<T>((resolve, reject) => {
      const div = document.createElement("div");
      document.body.appendChild(div);
      const app = createApp(component, {
        ...data,
        async destroyComponent(delay = 1000) {
          await sleep(delay);
          app.unmount();
          div.remove();
          isOpen = false;
        },
        emitResult(data: T) {
          isOpen = false;
          resolve(data);
        }
      });
      app.mount(div);
    });
  };

  const load = <T extends Component>(component: Component): T => {
    const { component: mountedComponent } = loadApp<T>(component);
    return mountedComponent;
  };

  const loadApp = <T extends Component>(
    component: Component
  ): { component: T; app: App; div: HTMLDivElement; destroyFc: () => void } => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const app = createApp(component, {
      ...data,
      async destroyComponent(delay = 1000) {
        await sleep(delay);
        app.unmount();
        div.remove();
      }
    });
    const mountedComponent = app.mount(div);
    return {
      component: mountedComponent as any,
      app: app,
      div,
      destroyFc: () => {
        app.unmount();
        div.remove();
      }
    };
  };

  return {
    mount,
    load,
    loadApp
  };
}
