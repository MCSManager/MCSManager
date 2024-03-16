<script setup lang="ts">
import { ref, computed, onMounted, h } from "vue";
import { t } from "@/lang/i18n";
import { Modal, notification } from "ant-design-vue";
import CardPanel from "@/components/CardPanel.vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useScreen } from "@/hooks/useScreen";
import { arrayFilter } from "@/tools/array";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { imageList, containerList } from "@/services/apis/envImage";
import type { LayoutCard, ImageInfo, ContainerInfo } from "@/types";
import { useAppRouters } from "@/hooks/useAppRouters";
import type { AntColumnsType, AntTableCell } from "@/types/ant";
import { reportErrorMsg } from "@/tools/validator";

const props = defineProps<{
  card: LayoutCard;
}>();

const { toPage } = useAppRouters();
const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const daemonId: string | undefined = getMetaOrRouteValue("daemonId");
const { isPhone } = useScreen();

const { execute: execImageList, state: images, isLoading: imageListLoading } = imageList();
const getImageList = async () => {
  try {
    await execImageList({
      params: {
        daemonId: daemonId ?? ""
      },
      method: "GET"
    });
    if (images.value) imageDataSource.value = images.value;
  } catch (err: any) {
    console.error(err);
    return Modal.error({
      centered: true,
      closable: true,
      content: err.message,
      title: t("TXT_CODE_ac405b50")
    });
  }
};

const imageDataSource = ref<ImageInfo[]>();
const imageColumns = computed(() => {
  return arrayFilter<AntColumnsType>([
    {
      align: "center",
      title: "ID",
      dataIndex: "Id",
      key: "Id"
    },
    {
      align: "center",
      title: t("TXT_CODE_bff43de3"),
      dataIndex: "RepoTags",
      key: "RepoTags",
      customRender: (e: { text: string[] }) => e.text[0]
    },
    {
      align: "center",
      title: t("TXT_CODE_6f91f3ba"),
      dataIndex: "Size",
      key: "Size",
      customRender: (e: { text: number }) => `${parseInt((e.text / 1024 / 1024).toString())} MB`
    },
    {
      align: "center",
      title: t("TXT_CODE_fe731dfc"),
      key: "action",
      minWidth: 200
    }
  ]);
});

const showDetail = (info: ImageInfo) => {
  Modal.info({
    centered: true,
    closable: true,
    content: [
      h("p", t("TXT_CODE_bbd7d448")),
      h("pre", {
        innerHTML: JSON.stringify(info, null, 4),
        style: {
          maxHeight: "460px",
          overflow: "auto"
        }
      })
    ],
    title: t("TXT_CODE_9d820cb4"),
    width: 500
  });
};

const delImage = async (item: ImageInfo) => {
  try {
    await execImageList({
      params: {
        daemonId: daemonId ?? "",
        imageId: item.RepoTags[0]
      },
      method: "DELETE"
    });
    notification["info"]({
      message: t("TXT_CODE_638bca20"),
      description: t("TXT_CODE_d11bf156")
    });
  } catch (err: any) {
    console.error(err);
    return reportErrorMsg(err.message);
  }
};

const containerDataSource = ref<ContainerInfo[]>();
const containerColumns = computed(() => {
  return arrayFilter<AntColumnsType>([
    {
      align: "center",
      title: "ID",
      dataIndex: "Id",
      key: "Id"
    },
    {
      align: "center",
      title: t("TXT_CODE_d12fa808"),
      dataIndex: "Command",
      key: "Command"
    },
    {
      align: "center",
      title: t("TXT_CODE_47c62dac"),
      dataIndex: "Image",
      key: "Image"
    },
    {
      align: "center",
      title: t("TXT_CODE_759fb403"),
      dataIndex: "State",
      key: "State"
    },
    {
      align: "center",
      title: t("TXT_CODE_24e5bff2"),
      dataIndex: "Status",
      key: "Status"
    },
    {
      align: "center",
      title: t("TXT_CODE_fe731dfc"),
      key: "action",
      minWidth: 200
    }
  ]);
});

const {
  execute: execContainerList,
  state: containers,
  isLoading: containerListLoading
} = containerList();
const getContainerList = async () => {
  try {
    await execContainerList({
      params: {
        daemonId: daemonId ?? ""
      }
    });
    if (containers.value) containerDataSource.value = containers.value;
  } catch (err: any) {
    console.error(err);
    return reportErrorMsg(err.message);
  }
};

const toNewImagePage = () => {
  toPage({
    path: "/node/image/new",
    query: {
      daemonId
    }
  });
};

onMounted(async () => {
  await getImageList();
  await getContainerList();
});
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
            <a-button @click="getImageList">
              {{ t("TXT_CODE_b76d94e0") }}
            </a-button>
            <a-button type="primary" @click="toNewImagePage">
              <span>{{ t("TXT_CODE_59ac0239") }}</span>
            </a-button>
          </template>
        </BetweenMenus>
      </a-col>

      <a-col :span="24">
        <CardPanel style="height: 100%">
          <template #title>
            {{ t("TXT_CODE_8b62abb2") }}
          </template>
          <template #body>
            <a-typography-paragraph>
              <a-typography-text>
                {{ t("TXT_CODE_ba82dddb") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-table
              :scroll="{
                x: 'max-content'
              }"
              :data-source="imageDataSource"
              :columns="imageColumns"
              :pagination="{
                pageSize: 10,
                showSizeChanger: true
              }"
              :loading="imageListLoading"
            >
              <template #bodyCell="{ column, record }: AntTableCell">
                <template v-if="column.key === 'Id'">
                  <a-typography-paragraph
                    class="mb-0"
                    :copyable="{
                      text: record.Id
                    }"
                    :ellipsis="{ rows: 1, expandable: false }"
                  >
                    {{ isPhone ? "" : record.Id }}
                  </a-typography-paragraph>
                </template>
                <template v-if="column.key === 'action'">
                  <a-button class="mr-8" size="large" @click="showDetail(record)">
                    {{ t("TXT_CODE_f1b166e7") }}
                  </a-button>
                  <a-popconfirm :title="t('TXT_CODE_dfa17b2d')" @confirm="delImage(record)">
                    <a-button size="large" danger>
                      {{ t("TXT_CODE_ecbd7449") }}
                    </a-button>
                  </a-popconfirm>
                </template>
              </template>
            </a-table>
          </template>
        </CardPanel>
      </a-col>

      <a-col :span="24">
        <CardPanel style="height: 100%">
          <template #title>
            {{ t("TXT_CODE_cb36c80e") }}
          </template>
          <template #body>
            <a-typography-paragraph>
              <a-typography-text>
                {{ t("TXT_CODE_b34efc1") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-table
              :scroll="{
                x: 'max-content'
              }"
              :data-source="containerDataSource"
              :columns="containerColumns"
              :pagination="{
                pageSize: 10,
                showSizeChanger: true
              }"
              :loading="containerListLoading"
            >
              <template #bodyCell="{ column, record }: AntTableCell">
                <template v-if="column.key === 'Id'">
                  <a-typography-paragraph
                    class="mb-0"
                    :copyable="{
                      text: record.Id
                    }"
                    :ellipsis="{ rows: 1, expandable: false }"
                  >
                    {{ isPhone ? "" : record.Id }}
                  </a-typography-paragraph>
                </template>
                <template v-if="column.key === 'action'">
                  <a-button class="mr-8" size="large" @click="showDetail(record)">
                    {{ t("TXT_CODE_f1b166e7") }}
                  </a-button>
                </template>
              </template>
            </a-table>
          </template>
        </CardPanel>
      </a-col>
    </a-row>
  </div>
</template>
