import { useDefineApi } from "@/stores/useDefineApi";
import type { ImageInfo } from "@/types";

// 获取镜像列表
export const getImageList = useDefineApi<
  {
    params: {
      remote_uuid: string;
    };
  },
  ImageInfo[]
>({
  url: "/api/environment/image",
  method: "GET"
});
