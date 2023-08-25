import { useDefineApi } from "@/stores/useDefineApi";
import type { BaseUserInfo } from "@/types/user";

export const loginUser = useDefineApi<
  {
    // Post
    data: {
      username: string;
      password: string;
    };
  },
  // Response
  {
    id: number;
  }
>({
  url: "/api/auth/login",
  method: "POST"
});

export const userInfoApi = useDefineApi<any, BaseUserInfo>({
  url: "/api/auth/"
});
