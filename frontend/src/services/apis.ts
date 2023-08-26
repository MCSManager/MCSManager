import { useDefineApi } from "@/stores/useDefineApi";
import type { InstanceDetail, NodeStatus } from "@/types";
import type { BaseUserInfo } from "@/types/user";

// 此处 API 接口可以用中文写注释，后期再统一翻译成英语。

// 用户登录
export const loginUser = useDefineApi<
  | {
      // Post
      data: {
        username: string;
        password: string;
      };
    }
  | undefined,
  // Response
  {
    id: number;
  }
>({
  url: "/api/auth/login",
  method: "POST"
});

// 获取当前登录的用户信息
export const userInfoApi = useDefineApi<any, BaseUserInfo>({
  url: "/api/auth/"
});

// 获取远程服务列表
export const remoteNodeList = useDefineApi<any, NodeStatus[]>({
  url: "/api/service/remote_services_list"
});

// 获取远程实例列表
export const remoteInstances = useDefineApi<
  {
    params: {
      remote_uuid: string;
      page: number;
      page_size: number;
      instance_name?: string;
    };
  },
  {
    maxPage: 1;
    page: 1;
    pageSize: 10;
    data: InstanceDetail[];
  }
>({
  url: "/api/service/remote_service_instances"
});
