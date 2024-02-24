import RightMenuVue from "@/components/fc/RightMenu.vue";
import { useMountComponent } from "./useMountComponent";
import { nextTick } from "vue";
import type { App } from "vue";

export interface RightClickMenuItem {
  label: string;
  value: string;
  width?: number;
  onClick: (value: string) => void;
}

export function useRightClickMenu() {
  let loadedMenu: {
    app: App;
    destroyFc: () => void;
  };

  const openRightClickMenu = async (
    mouseX: number,
    mouseY: number,
    options: RightClickMenuItem[]
  ) => {
    if (loadedMenu) {
      loadedMenu.destroyFc();
    }

    const fcHook = await useMountComponent({
      options,
      mouseX: mouseX,
      mouseY: mouseY
    });
    const { component, app, destroyFc } = await fcHook.loadApp<InstanceType<typeof RightMenuVue>>(
      RightMenuVue
    );

    loadedMenu = {
      app,
      destroyFc
    };

    await component.openMenu();

    nextTick(() => {
      const destroyMenu = (e: Event) => {
        e.preventDefault();
        document.body.removeEventListener("click", destroyMenu);
        document.body.removeEventListener("contextmenu", destroyMenu);
        document.body.removeEventListener("scroll", destroyMenu);
        destroyFc();
      };

      document.body.addEventListener("click", destroyMenu);
      document.body.addEventListener("contextmenu", destroyMenu);
      document.body.addEventListener("scroll", destroyMenu);
    });
  };

  return {
    openRightClickMenu: openRightClickMenu
  };
}
