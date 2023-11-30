import { useDefineApi } from "@/stores/useDefineApi";

export const setLayoutConfig = useDefineApi<
  {
    data: string;
  },
  any
>({
  url: "/api/overview/layout",
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  }
});

export const getLayoutConfig = useDefineApi<any, string>({
  url: "/api/overview/layout",
  method: "GET"
});

export const resetLayoutConfig = useDefineApi<any, void>({
  url: "/api/overview/layout",
  method: "DELETE"
});

export const uploadFile = useDefineApi<
  {
    data: FormData;
  },
  string
>({
  method: "POST",
  headers: { "Content-Type": "multipart/form-data" },
  url: "/api/overview/upload_assets"
});
