import { router } from "@/config/router";
import type { JsonData } from "@/types";
import {
  useRoute,
  type RouteLocationRaw,
  type RouteLocationPathRaw,
} from "vue-router";

export function useAppRouters() {
  const route = useRoute();

  const getRouteParamsUrl = () => {
    return route.fullPath.split("?")[1] || "";
  };

  const toPage = (params: RouteLocationPathRaw) => {
    const tmp = {
      ...params,
    };
    tmp.query = {
      ...(route.query || {}),
      ...(params.query || {}),
    };
    router.push(tmp);
  };

  return {
    getRouteParamsUrl,
    toPage,
  };
}
