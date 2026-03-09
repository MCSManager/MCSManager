import { useDefineApi } from "@/stores/useDefineApi";
import type { ContainerInfo, DockerNetworkModes, ImageInfo } from "@/types";

export const imageList = useDefineApi<
  {
    params: {
      daemonId: string;
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

export const getNetworkModeList = useDefineApi<
  {
    params: {
      daemonId: string;
    };
  },
  DockerNetworkModes[]
>({
  url: "/api/environment/networkModes",
  method: "GET"
});

export const containerList = useDefineApi<
  {
    params: {
      daemonId: string;
      imageId?: string;
    };
  },
  ContainerInfo[]
>({
  url: "/api/environment/containers",
  method: "GET"
});

export const buildProgress = useDefineApi<
  {
    params: {
      daemonId: string;
    };
  },
  {
    [propsName: string]: number;
  }
>({
  url: "/api/environment/progress",
  method: "GET"
});

export const getImagePlatforms = useDefineApi<
  {
    params: {
      daemonId: string;
    };
    data: {
      imageName: string;
    };
  },
  string[]
>({
  url: "/api/environment/image_platforms",
  method: "POST"
});

export const getDockerHubImagePlatforms = useDefineApi<
  {
    data: {
      imageName: string;
    };
  },
  string[]
>({
  url: "/api/environment/dockerhub_image_platforms",
  method: "POST"
});
