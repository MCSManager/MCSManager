import { useDefineApi } from "@/stores/useApiCache";

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
  url: "https://jsonplaceholder.typicode.com/todos/1",
});
