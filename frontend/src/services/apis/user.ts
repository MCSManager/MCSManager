import { useDefineApi } from "@/stores/useDefineApi";

export const setUserApiKey = useDefineApi<
  {
    data: {
      enable: boolean;
    };
  },
  string
>({
  url: "/api/auth/api",
  method: "PUT"
});

export const updatePassword = useDefineApi<
  {
    data: {
      passWord: string;
    };
  },
  boolean
>({
  url: "/api/auth/update",
  method: "PUT"
});
