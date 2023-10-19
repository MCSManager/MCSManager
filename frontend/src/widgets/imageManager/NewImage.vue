<script setup lang="ts">
import { ref, onMounted } from "vue";
import { t } from "@/lang/i18n";
import { message } from "ant-design-vue";
import CardPanel from "@/components/CardPanel.vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useScreen } from "@/hooks/useScreen";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { useAppRouters } from "@/hooks/useAppRouters";
import type { LayoutCard } from "@/types";
import {
  defaultDockerFile,
  openjdk16,
  openjdk16CN,
  openjdk17,
  openjdk17CN,
  openjdk8,
  openjdk8CN,
  ubuntu22,
  ubuntu22CN
} from "@/types/const";
import { getCurrentLang } from "@/lang/i18n";
import DockerFileForm from "./DockerFileForm.vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const { toPage } = useAppRouters();
const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const daemonId: string | undefined = getMetaOrRouteValue("daemonId");
const screen = useScreen();
const dockerFileDrawer = ref(false);
const imageList = [
  {
    title: t("创建 OpenJDK 8 环境镜像"),
    description: t("内置 Java 16 运行时环境，适用于 Minecraft 1.7 ~ 1.16 版本的服务端"),
    type: 1
  },
  {
    title: t("创建 OpenJDK 16 环境镜像"),
    description: t("内置 Java 16 运行时环境，适用于 Minecraft 1.17 版本的服务端"),
    type: 2
  },
  {
    title: t("创建 OpenJDK 17 环境镜像"),
    description: t("内置 Java 17 运行时环境，适用于 Minecraft 1.18 以上版本的服务端"),
    type: 3
  },
  {
    title: t("创建 Ubuntu 22.04 环境镜像"),
    description: t("适用于 MC 基岩版服务端运行环境或者其他 Linux 程序"),
    type: 4
  },
  {
    title: t("使用 DockerFile 自定义创建"),
    description: t("使用 DockerFile 自定义创建任何环境镜像，建议技术人员进行此操作"),
    type: 5
  }
];

const dockerFile = ref("");
const name = ref("");
const version = ref("");
const isZH = getCurrentLang() === "zh_CN" ? true : false;
const selectType = (type: number) => {
  switch (type) {
    case 1:
      dockerFile.value = isZH ? openjdk8CN : openjdk8;
      name.value = "mcsm-openjdk";
      version.value = "8";
      break;
    case 2:
      dockerFile.value = isZH ? openjdk16CN : openjdk16;
      name.value = "mcsm-openjdk";
      version.value = "16";
      break;
    case 3:
      dockerFile.value = isZH ? openjdk17CN : openjdk17;
      name.value = "mcsm-openjdk";
      version.value = "17";
      break;
    case 4:
      dockerFile.value = isZH ? ubuntu22CN : ubuntu22;
      name.value = "mcsm-ubuntu";
      version.value = "22.04";
      break;
    case 5:
      dockerFile.value = defaultDockerFile;
      name.value = "mcsm-custom";
      version.value = "lasted";
      break;
    default:
      return message.error(t("未知的环境类型"));
  }
  dockerFileDrawer.value = true;
};

const toImageListPage = () => {
  toPage({
    path: "/node/image",
    query: {
      daemonId
    }
  });
};

onMounted(async () => {});
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24">
        <BetweenMenus>
          <template #left>
            <a-typography-title class="mb-0" :level="4">
              {{ card.title }}
            </a-typography-title>
          </template>
          <template #right>
            <a-button v-show="!screen.isPhone.value" class="mr-8" @click="toImageListPage">
              {{ t("回到镜像列表") }}
            </a-button>
            <a-button type="primary">
              {{ t("查看构建进度") }}
            </a-button>
          </template>
        </BetweenMenus>
      </a-col>

      <a-col :span="24">
        <CardPanel style="height: 100%">
          <template #body>
            <a-typography>
              <a-typography-paragraph>
                <a-typography-title :level="5">{{ t("什么是环境镜像？") }}</a-typography-title>
                <a-typography-text>
                  {{
                    t(
                      "由于 Minecraft 或其他程序需要特定的运行环境，比如 Java/Python/.NET 等等，不同版本在同一台机器上安装管理十分复杂，使用不同的环境镜像可以很方便的管理不同版本不同类型的服务环境。"
                    )
                  }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-typography-paragraph>
                <a-typography-title :level="5">
                  {{ t("什么是 Docker？为什么需要它？") }}
                </a-typography-title>
                <a-typography-text>
                  {{
                    t(
                      "Docker 是一款轻量级虚拟化软件，能够利用环境镜像来创建容器（就像一个盒子）包裹你的实际应用程序，让你的应用程序在一个虚拟的沙箱环境中运行，不论应用程序做任何恶意操作，都不会影响到宿主机的任何文件。"
                    )
                  }}
                </a-typography-text>
              </a-typography-paragraph>
            </a-typography>
          </template>
        </CardPanel>
      </a-col>

      <a-col v-for="i in imageList" :key="i" :span="24" :lg="6" :md="8" :sm="12">
        <CardPanel class="images-card" @click="selectType(i.type)">
          <template #title>{{ i.title }}</template>
          <template #body>
            <a-typography-text>
              {{ i.description }}
            </a-typography-text>
          </template>
        </CardPanel>
      </a-col>
    </a-row>
  </div>

  <a-drawer
    v-model:open="dockerFileDrawer"
    :width="screen.isPhone.value ? 'auto' : '768px'"
    title="DockerFile"
    placement="right"
    destroy-on-close
  >
    <DockerFileForm
      :docker-file="dockerFile"
      :name="name"
      :version="version"
      :daemon-id="daemonId ?? ''"
      @close="dockerFileDrawer = false"
    />
  </a-drawer>
</template>

<style lang="scss" scoped>
.images-card {
  cursor: pointer;

  &:hover {
    border: 1px solid var(--color-gray-8);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16);
  }
}

.drawer {
  width: 500px;
}
</style>
