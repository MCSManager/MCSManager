import { computed } from "vue";
import { useRoute } from "vue-router";

export function useRouterParams() {
  const route = useRoute();
  const currentRoutePath = computed(() => route.path);
  return {
    currentRoutePath
  };
}
