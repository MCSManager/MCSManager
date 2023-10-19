<script setup lang="ts">
import { ref, computed, onMounted, h } from "vue";
import { t } from "@/lang/i18n";
import { Modal, message, notification } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";
import CardPanel from "@/components/CardPanel.vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useScreen } from "@/hooks/useScreen";
import { arrayFilter } from "@/tools/array";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { imageList, containerList } from "@/services/apis/envImage";
import type { LayoutCard, ImageInfo, ContainerInfo } from "@/types";
import CopyButton from "@/components/CopyButton.vue";
import { useAppRouters } from "@/hooks/useAppRouters";
const props = defineProps<{
  card: LayoutCard;
}>();

const { toPage } = useAppRouters();
const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const daemonId: string | undefined = getMetaOrRouteValue("daemonId");
const screen = useScreen();

const { execute: execImageList, state: images, isLoading: imageListLoading } = imageList();
const getImageList = async () => {
  try {
    await execImageList({
      params: {
        remote_uuid: daemonId ?? ""
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
      title: t("错误")
    });
  }
};

const imageDataSource = ref<ImageInfo[]>();
const imageColumns = computed(() => {
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

const delImage = async (item: ImageInfo) => {
  try {
    await execImageList({
      params: {
        remote_uuid: daemonId ?? "",
        imageId: item.RepoTags[0]
      },
      method: "DELETE"
    });
    notification["info"]({
      message: t("删除指令已发出"),
      description: t("请耐心等待，使用刷新功能加载列表，稍后此镜像预计将会被删除")
    });
  } catch (err: any) {
    console.error(err);
    return message.error(err.message);
  }
};

const containerDataSource = ref<ContainerInfo[]>();
const containerColumns = computed(() => {
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
      title: t("启动命令"),
      dataIndex: "Command",
      key: "Command"
    },
    {
      align: "center",
      title: t("使用镜像"),
      dataIndex: "Image",
      key: "Image"
    },
    {
      align: "center",
      title: t("状态"),
      dataIndex: "State",
      key: "State"
    },
    {
      align: "center",
      title: t("情况"),
      dataIndex: "Status",
      key: "Status"
    },
    {
      align: "center",
      title: t("TXT_CODE_fe731dfc"),
      key: "action",
      minWidth: "200px"
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
        remote_uuid: daemonId ?? ""
      }
    });
    if (containers.value) containerDataSource.value = containers.value;
  } catch (err: any) {
    console.error(err);
    return message.error(err.message);
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
          <template #left>
            <a-typography-title class="mb-0" :level="4">
              {{ card.title }}
            </a-typography-title>
          </template>
          <template #right>
            <a-button v-show="!screen.isPhone.value" class="mr-8" @click="getImageList">
              {{ t("刷新") }}
            </a-button>
            <a-button type="primary" @click="toNewImagePage">
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
              :data-source="imageDataSource"
              :columns="imageColumns"
              :pagination="{
                pageSize: 10,
                showSizeChanger: true
              }"
              :loading="imageListLoading"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'Id'">
                  {{ record.Id }}
                  <CopyButton :value="record.Id" class="ml-4" type="text" size="small" />
                </template>
                <template v-if="column.key === 'action'">
                  <a-button class="mr-8" size="" @click="showDetail(record)">
                    {{ t("详情") }}
                  </a-button>
                  <a-popconfirm
                    :title="t('此操作将永久删除该镜像, 是否继续?')"
                    @confirm="delImage(record)"
                  >
                    <a-button size="" danger>
                      {{ t("删除") }}
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
            {{ t("远程主机容器列表") }}
          </template>
          <template #body>
            <a-typography-paragraph>
              <a-typography-text>
                {{
                  t(
                    "容器列表代表所有正在独立镜像环境运行的应用实例，此处列表不仅仅包括面板所启动的容器。"
                  )
                }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-table
              :data-source="containerDataSource"
              :columns="containerColumns"
              :pagination="{
                pageSize: 10,
                showSizeChanger: true
              }"
              :loading="containerListLoading"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'Id'">
                  {{ record.Id }}
                  <CopyButton :value="record.Id" class="ml-4" type="text" size="small" />
                </template>
                <template v-if="column.key === 'action'">
                  <a-button class="mr-8" size="" @click="showDetail(record)">
                    {{ t("详情") }}
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
