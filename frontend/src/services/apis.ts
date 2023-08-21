import { useDefineApi } from "@/stores/useApiCache";

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
