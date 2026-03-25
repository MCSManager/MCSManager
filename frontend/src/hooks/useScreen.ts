import { onMounted, onUnmounted, ref } from "vue";

export function useScreen() {
  const isPhone = ref(false);

  const mediaQuery = window.matchMedia("(max-width: 992px)");

  const fn = (e: MediaQueryListEvent) => (isPhone.value = e.matches);

  onMounted(() => {
    isPhone.value = mediaQuery.matches;
    mediaQuery.addEventListener("change", fn);
  });

  onUnmounted(() => {
    mediaQuery.removeEventListener("change", fn);
  });

  return { isPhone };
}
