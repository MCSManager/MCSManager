import { ref } from "vue";

export function useMouseEnter() {
  const targetId = ref<string>();
  const handleMouseEnter = (id: string) => {
    console.log("进入:", id);
    targetId.value = id;
  };
  const handleMouseLeave = (id: string) => {
    console.log("出去:", id);
    if (targetId.value === id) targetId.value = undefined;
  };

  return {
    targetId,
    handleMouseEnter,
    handleMouseLeave
  };
}
