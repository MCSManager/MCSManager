import { computed } from "vue";
import { useRoute } from "vue-router";

export function useRouterParams() {
  const route = useRoute();
  if (!route) {
    throw new Error(
      "Failed to get Vue-Router! Please check if the Hook call source is in the Vue component."
    );
  }
  const currentRoutePath = computed(() => route.path);
  return {
    currentRoutePath
  };
}
