import RightMenuVue from "@/components/fc/RightMenu.vue";
import { useMountComponent } from "./useMountComponent";
import { useMouse } from "@vueuse/core";

export interface RightClickMenuItem {
  label: string;
  value: string;
  callback: (value: string) => void;
}

export function useRightClickMenu(options: RightClickMenuItem[]) {
  const openRightClickMenu = async () => {
    const { x: mouseX, y: mouseY } = useMouse();
    const fcHook = await useMountComponent({
      options,
      mouseX: mouseX.value,
      mouseY: mouseY.value
    });

    const component = await fcHook.load<InstanceType<typeof RightMenuVue>>(RightMenuVue);
    console.debug("openRightClickMenu", component);
    component.openMenu();
  };

  return {
    openRightClickMenu: openRightClickMenu
  };
}
