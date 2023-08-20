import { createGlobalState } from "@vueuse/core";
import axios from "axios";
import { userInfoApi } from "./apis";

export const userService = createGlobalState(() => {
  const login = async (username: string, password: string) => {
    const result = await axios({
      url: "https://jsonplaceholder.typicode.com/todos/1",
      data: {
        username,
        password,
      },
    });
    return result.data;
  };

  const getUserInfo = (uid: string) => {
    const state = userInfoApi();
    state.execute({
      params: {
        uid,
      },
      data: {
        newName: "dsad",
      },
    });
    return state;
  };

  return {
    login,
    getUserInfo,
  };
});
