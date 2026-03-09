import { router } from "@/config/router";
import { useRoute, type RouteLocationPathRaw } from "vue-router";

export function useAppRouters() {
  const route = useRoute();

  const getRouteParamsUrl = () => {
    return route.fullPath.split("?")[1] || "";
  };

  const toPage = (params: RouteLocationPathRaw) => {
    const tmp = {
      ...params
    };
    tmp.query = {
      ...(route.query || {}),
      ...(params.query || {})
    };

    return router.push(tmp);
  };

  return {
    getRouteParamsUrl,
    toPage
  };
}
