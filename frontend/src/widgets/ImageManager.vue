<script setup lang="ts">
import { ref, computed, onMounted, h } from "vue";
import { t } from "@/lang/i18n";
import { Modal, message } from "ant-design-vue";
import { DownOutlined, PlusOutlined } from "@ant-design/icons-vue";
import CardPanel from "@/components/CardPanel.vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useScreen } from "../hooks/useScreen";
import { arrayFilter } from "../tools/array";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { ImageList } from "@/services/apis/envImage";
import type { LayoutCard, ImageInfo } from "@/types";
const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const daemonId: string | undefined = getMetaOrRouteValue("daemonId");
const screen = useScreen();

const { execute: getImageListApi, state: images, isLoading: ImageListLoading } = ImageList();
const getImageList = async () => {
  try {
    await getImageListApi({
      params: {
        remote_uuid: daemonId ?? ""
      }
    });
    if (images.value) dataSource.value = images.value;
  } catch (err: any) {
    console.error(err);
    return message.error(err.message);
  }
};

const dataSource = ref<ImageInfo[]>();
const columns = computed(() => {
  return arrayFilter([
    {
      align: "center",
      title: "ID",
      dataIndex: "Id",
      key: "Id",
      minWidth: "200px"
    },
    {
      align: "center",
      title: t("名称"),
      dataIndex: "RepoTags",
      key: "RepoTags",
      customRender: (e: { text: string[] }) => e.text[0]
    },
    {
      align: "center",
      title: t("占用空间"),
      dataIndex: "Size",
      key: "Size",
      customRender: (e: { text: number }) => `${parseInt((e.text / 1024 / 1024).toString())} MB`
    },
    {
      align: "center",
      title: t("TXT_CODE_fe731dfc"),
      key: "action",
      minWidth: "200px"
    }
  ]);
});

const showDetail = (info: ImageInfo) => {
  Modal.info({
    centered: true,
    closable: true,
    content: [
      h("b", t("关于详情信息")),
      h(
        "p",
        t("Docker 镜像与容器等详细信息建议由技术人员阅读，此处提供完整的 JSON 格式信息内容。")
      ),
      h("pre", {
        innerHTML: JSON.stringify(info, null, 4),
        style: {
          maxHeight: "460px",
          overflowY: "auto"
        }
      })
    ],
    title: t("信息详情"),
    width: 666
  });
};

onMounted(async () => {
  await getImageList();
});
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
            <a-button v-show="!screen.isPhone.value" class="mr-8" @click="getImageList">
              {{ t("刷新") }}
            </a-button>
            <a-button type="primary">
              {{ t("新增镜像") }}
              <PlusOutlined />
            </a-button>
          </template>
        </BetweenMenus>
      </a-col>

      <a-col :span="24">
        <CardPanel style="height: 100%">
          <template #title>
            {{ t("远程主机镜像列表") }}
          </template>
          <template #body>
            <a-typography-paragraph>
              <a-typography-text>
                {{
                  t("镜像构建与容器运行依赖于 Docker 软件，物理主机上所有远程节点将共享所有镜像。")
                }}
              </a-typography-text>
            </a-typography-paragraph>

            <a-table
              :data-source="dataSource"
              :columns="columns"
              :pagination="{
                pageSize: 10,
                showSizeChanger: true
              }"
              :loading="ImageListLoading"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-button class="mr-8" size="" @click="showDetail(record)">
                    {{ t("详情") }}
                  </a-button>
                  <a-button size="" danger>
                    {{ t("删除") }}
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
