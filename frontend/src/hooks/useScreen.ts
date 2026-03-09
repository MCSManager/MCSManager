import { onMounted, onUnmounted, ref } from "vue";

export function useScreen() {
  const isPhone = ref(window.innerWidth < 992);

  const fn = () => {
    isPhone.value = window.innerWidth < 992;
  };

  onMounted(() => {
    window.addEventListener("resize", fn);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", fn);
  });

  return {
    isPhone,
  };
}
