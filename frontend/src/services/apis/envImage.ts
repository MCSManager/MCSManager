import { useDefineApi } from "@/stores/useDefineApi";
import type { ImageInfo, DockerNetworkModes, ContainerInfo } from "@/types";

// 镜像相关
export const imageList = useDefineApi<
  {
    params: {
      remote_uuid: string;
      imageId?: string;
    };
    data?: {
      dockerFile: string;
      name: string;
      tag: string;
    };
    method: string;
  },
  ImageInfo[]
>({
  url: "/api/environment/image"
});

// 获取网络模式
export const getNetworkModeList = useDefineApi<
  {
    params: {
      remote_uuid: string;
    };
  },
  DockerNetworkModes[]
>({
  url: "/api/environment/networkModes",
  method: "GET"
});

// 获取容器列表
export const containerList = useDefineApi<
  {
    params: {
      remote_uuid: string;
      imageId?: string;
    };
  },
  ContainerInfo[]
>({
  url: "/api/environment/containers",
  method: "GET"
});

// 查看构建进度
export const buildProgress = useDefineApi<
  {
    params: {
      remote_uuid: string;
    };
  },
  {
    [propsName: string]: number;
  }
>({
  url: "/api/environment/progress",
  method: "GET"
});
