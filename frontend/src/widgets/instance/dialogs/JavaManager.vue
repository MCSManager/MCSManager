<script setup lang="ts">
import { useDownloadJavaDialog } from "@/components/fc";
import { t } from "@/lang/i18n";
import { updateInstanceConfig } from "@/services/apis/instance";
import { deleteJava, downloadJava, getJavaList, usingJava } from "@/services/apis/javaManager";
import { parseTimestamp } from "@/tools/time";
import type { InstanceDetail } from "@/types";
import type { AntColumnsType } from "@/types/ant";
import type { JavaInfo, JavaRuntime } from "@/types/javaManager";
import {
  CheckOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { h, ref, type Ref } from "vue";

const props = defineProps<{
  instanceInfo?: InstanceDetail;
  daemonId?: string;
  instanceId?: string;
}>();

const columns: AntColumnsType[] = [
  {
    align: "center",
    title: t("Java 名称"),
    dataIndex: ["info", "fullname"],
    key: "fullname"
  },
  {
    align: "center",
    title: t("安装时间"),
    dataIndex: ["info", "installTime"],
    key: "installTime",
    customRender: (e: { text: number }) => t(parseTimestamp(e.text))
  },
  {
    align: "center",
    title: t("Java 状态"),
    key: "status",
    customRender: ({ record }: { record: JavaRuntime }) => {
      if (record.usingInstances.length > 0) return t("运行中");
      else if (record.info.downloading) return t("下载中");
      else return t("未运行");
    }
  },
  {
    align: "center",
    title: t("TXT_CODE_fe731dfc"),
    key: "actions",
    width: 250
  }
];

const open = ref(false);
const javaList: Ref<JavaRuntime[] | undefined> = ref([]);
const openDialog = async () => {
  await refreshJavaList();
  open.value = true;
};

const { isLoading } = updateInstanceConfig();

const close = async () => {
  open.value = false;
};

const refreshJavaList = async (out: boolean = false) => {
  try {
    const list = await getJavaList().execute({
      params: {
        daemonId: props.daemonId ?? ""
      }
    });
    javaList.value = list.value;
    if (out) message.success(t("TXT_CODE_fbde647e"));
  } catch (err: any) {
    message.error(err.message);
  }
};

const handleDownloadJava = async () => {
  const data = await useDownloadJavaDialog();
  if (!data) return;

  try {
    await downloadJava().execute({
      params: {
        daemonId: props.daemonId ?? ""
      },
      data: {
        name: data.name,
        version: data.version
      }
    });
  } catch (err: any) {
    message.error(err.message);
  }
  message.success(t("下载任务已开始，请稍后..."));
  await refreshJavaList();
};

const handleDeleteJava = async (info: JavaInfo) => {
  try {
    await deleteJava().execute({
      params: {
        daemonId: props.daemonId ?? ""
      },
      data: {
        id: info.fullname
      }
    });
  } catch (err: any) {
    message.error(err.message);
  }
  await refreshJavaList();
};

const handleUsingJava = async (info: JavaInfo) => {
  try {
    await usingJava().execute({
      params: {
        daemonId: props.daemonId ?? "",
        instanceId: props.instanceId ?? ""
      },
      data: {
        id: info.fullname
      }
    });

    const instanceInfo = props.instanceInfo;
    if (instanceInfo) instanceInfo.config.java.id = info.fullname;

    message.success(t("TXT_CODE_d3de39b4"));
  } catch (err: any) {
    message.error(err.message);
  }
  await refreshJavaList();
};

defineExpose({
  openDialog
});
</script>

<template>
  <a-modal
    v-model:open="open"
    width="1000px"
    centered
    :title="t('Java 环境管理')"
    :confirm-loading="isLoading"
    @close="close"
  >
    <div>
      <a-typography-paragraph>
        <a-typography-text type="secondary">
          {{ t("在 MCSManager 中选择并安装一个你需要的 Java 版本。") }}
          <br />
          {{ t("完成配置后，将会使用 {mcsm_java} 来替代原本的 java应用命令。") }}
        </a-typography-text>
      </a-typography-paragraph>

      <div class="items-right">
        <a-button
          class="mr-10"
          type="dashed"
          :icon="h(DownloadOutlined)"
          @click="handleDownloadJava()"
        >
          {{ t("下载其他Java") }}
        </a-button>

        <a-button class="mr-10" :icon="h(ReloadOutlined)" @click="refreshJavaList(true)">
          {{ t("刷新") }}
        </a-button>
      </div>

      <a-table
        class="mt-12"
        :data-source="javaList"
        :columns="columns"
        :scroll="{ x: 'max-content' }"
        :pagination="{
          pageSize: 15
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actions'">
            <template v-if="record.info.fullname == instanceInfo?.config.java.id">
              <a-button class="mr-8" type="primary" :disabled="true">
                {{ t("使用中") }}
                <CheckOutlined />
              </a-button>
            </template>
            <a-button
              v-else
              class="mr-8"
              type="primary"
              :disabled="record.info.downloading"
              @click="handleUsingJava(record.info as JavaInfo)"
            >
              {{ t("使用") }}
              <CheckOutlined />
            </a-button>

            <a-popconfirm
              :title="t('你确定要删除这个Java环境吗?')"
              @confirm="handleDeleteJava(record.info as JavaInfo)"
            >
              <a-button danger :disabled="record.info.downloading">
                {{ t("TXT_CODE_ecbd7449") }}
                <DeleteOutlined />
              </a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </div>

    <template #footer>
      <a-button type="primary" @click="close">{{ t("完成") }}</a-button>
    </template>
  </a-modal>
</template>
