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

export const userInfoApi = useDefineApi<
  {
    // Query
    params: {
      uid: string;
    };
    // Post
    data?: {
      newName: string;
    };
  },
  // Response
  {
    id: number;
  }
>({
  url: "https://jsonplaceholder.typicode.com/todos/1"
});
