import { useDefineApi } from "@/stores/useDefineApi";
import type { JavaRuntime } from "@/types/javaManager";

export const getJavaList = useDefineApi<
  {
    params: {
      daemonId: string;
      instanceId: string;
    };
  },
  JavaRuntime[]
>({
  url: "/api/java_manager/list",
  method: "GET"
});

export const downloadJava = useDefineApi<
  {
    params: {
      daemonId: string;
      instanceId: string;
    };
    data: {
      name: string;
      version: string;
    };
  },
  Boolean
>({
  url: "/api/java_manager/download",
  method: "POST"
});

export const usingJava = useDefineApi<
  {
    params: {
      daemonId: string;
      instanceId: string;
    };
    data: {
      id: string;
    };
  },
  Boolean
>({
  url: "/api/java_manager/using",
  method: "POST"
});

export const deleteJava = useDefineApi<
  {
    params: {
      daemonId: string;
      instanceId: string;
    };
    data: {
      id: string;
    };
  },
  Boolean
>({
  url: "/api/java_manager/delete",
  method: "DELETE"
});
