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

export const bind2FA = useDefineApi<any, string>({
  url: "/api/auth/bind2fa",
  method: "POST"
});

export const confirm2FA = useDefineApi<
  {
    data: {
      enable: boolean;
      TOTPCode: string;
    };
  },
  undefined
>({
  url: "/api/auth/confirm2fa",
  method: "POST"
});

export const queryUsername = useDefineApi<
  {
    params: {
      username: string;
    };
  },
  {
    uuid?: string;
    userName?: string;
  }
>({
  url: "/api/auth/query_username",
  method: "GET"
});
