import { createApp, type Component } from "vue";
import { sleep } from "@/tools/commom";

export function useMountComponent() {
  let isOpen = false;
  const mount = <T>(component: Component) => {
    if (isOpen) return;
    isOpen = true;
    return new Promise<T>((resolve, reject) => {
      const div = document.createElement("div");
      document.body.appendChild(div);

      const app = createApp(component, {
        async destroyComponent(delay = 0) {
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
