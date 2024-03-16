<script setup lang="ts">
import { ref, onMounted } from "vue";
import { t } from "@/lang/i18n";
import { reportErrorMsg } from "@/tools/validator";
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
import BuildProgress from "./BuildProgress.vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const { toPage } = useAppRouters();
const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const daemonId: string | undefined = getMetaOrRouteValue("daemonId");
const { isPhone } = useScreen();
const buildProgressDialog = ref<InstanceType<typeof BuildProgress>>();
const dockerFileDrawer = ref(false);
const imageList = [
  {
    title: t("TXT_CODE_b09eff8f"),
    description: t("TXT_CODE_d7c5823e"),
    type: 1
  },
  {
    title: t("TXT_CODE_694952a"),
    description: t("TXT_CODE_4fdbb351"),
    type: 2
  },
  {
    title: t("TXT_CODE_9b9b745c"),
    description: t("TXT_CODE_7d1a9487"),
    type: 3
  },
  {
    title: t("TXT_CODE_495027e1"),
    description: t("TXT_CODE_41d79430"),
    type: 4
  },
  {
    title: t("TXT_CODE_123bcd09"),
    description: t("TXT_CODE_3d14442a"),
    type: 5
  }
];

const dockerFile = ref("");
const name = ref("");
const version = ref("");
const isZH = getCurrentLang() === "zh_cn" ? true : false;
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
      version.value = "latest";
      break;
    default:
      return reportErrorMsg(t("TXT_CODE_fb1ff943"));
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
          <template v-if="!isPhone" #left>
            <a-typography-title class="mb-0" :level="4">
              {{ card.title }}
            </a-typography-title>
          </template>
          <template #right>
            <a-button @click="toImageListPage">
              {{ t("TXT_CODE_3a818e91") }}
            </a-button>
            <a-button type="primary" @click="buildProgressDialog?.openDialog()">
              {{ t("TXT_CODE_5544ec22") }}
            </a-button>
          </template>
        </BetweenMenus>
      </a-col>

      <a-col :span="24">
        <CardPanel style="height: 100%">
          <template #body>
            <a-typography>
              <a-typography-paragraph>
                <a-typography-title :level="5">{{ t("TXT_CODE_d76ccb4f") }}</a-typography-title>
                <a-typography-text>
                  {{ t("TXT_CODE_528753e7") }}
                </a-typography-text>
              </a-typography-paragraph>
              <a-typography-paragraph>
                <a-typography-title :level="5">
                  {{ t("TXT_CODE_2ea7af21") }}
                </a-typography-title>
                <a-typography-text>
                  {{ t("TXT_CODE_ba1eb3b5") }}
                </a-typography-text>
              </a-typography-paragraph>
            </a-typography>
          </template>
        </CardPanel>
      </a-col>

      <a-col
        v-for="i in imageList"
        :key="i.title + i.description + i.type"
        :span="24"
        :lg="6"
        :md="8"
        :sm="12"
      >
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
    :width="isPhone ? 'auto' : '768px'"
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

  <BuildProgress ref="buildProgressDialog" :daemon-id="daemonId ?? ''" />
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
