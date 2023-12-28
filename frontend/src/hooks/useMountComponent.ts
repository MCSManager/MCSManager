/* eslint-disable vue/one-component-per-file */

import { createApp, type Component } from "vue";
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

  return {
    mount
  };
}

// export function useFcComponent<T>(component: Component, data: Record<string, any> = {}): T {
//   const div = document.createElement("div");
//   document.body.appendChild(div);
//   const app = createApp(component, {
//     ...data,
//     async destroyComponent(delay = 1000) {
//       await sleep(delay);
//       app.unmount();
//       div.remove();
//     }
//   });
//   console.debug("XZXZ:", component);
//   app.mount(div);

//   return app._instance?.exposed as T;
// }
