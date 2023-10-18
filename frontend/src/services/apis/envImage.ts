import { useDefineApi } from "@/stores/useDefineApi";
import type { ImageInfo, DockerNetworkModes } from "@/types";

// 获取镜像列表
export const ImageList = useDefineApi<
  {
    params: {
      remote_uuid: string;
      imageId?: string;
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
