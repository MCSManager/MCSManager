import { ref } from "vue";

export function useMouseEnter() {
  const targetId = ref<string>();
  const handleMouseEnter = (id: string) => {
    targetId.value = id;
  };
  const handleMouseLeave = (id: string) => {
    if (targetId.value === id) targetId.value = undefined;
  };

  return {
    targetId,
    handleMouseEnter,
    handleMouseLeave
  };
}
