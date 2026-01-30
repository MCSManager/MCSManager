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
    title: t("TXT_CODE_151d2bb7"),
    dataIndex: ["info", "fullname"],
    key: "fullname"
  },
  {
    align: "center",
    title: t("TXT_CODE_a2e79565"),
    dataIndex: ["info", "installTime"],
    key: "installTime",
    customRender: (e: { text: number }) => t(parseTimestamp(e.text))
  },
  {
    align: "center",
    title: t("TXT_CODE_759fb403"),
    key: "status",
    customRender: ({ record }: { record: JavaRuntime }) => {
      if (record.usingInstances.length > 0) return t("TXT_CODE_bdb620b9");
      else if (record.info.downloading) return t("TXT_CODE_d919f7c7");
      else return t("TXT_CODE_15f2e564");
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
        daemonId: props.daemonId ?? "",
        instanceId: props.instanceId ?? ""
      }
    });
    javaList.value = list.value;
    if (out) message.success(t("TXT_CODE_fbde647e"));
  } catch (err: any) {
    message.error(err.message);
  }
};

const handleDownloadJava = async () => {
  const installedList = javaList.value?.map((item) => item.info.fullname) ?? [];
  const data = await useDownloadJavaDialog(installedList);
  if (!data) return;

  try {
    await downloadJava().execute({
      params: {
        daemonId: props.daemonId ?? "",
        instanceId: props.instanceId ?? ""

      },
      data: {
        name: data.name,
        version: data.version
      }
    });
    message.success(t("TXT_CODE_5e7a4c02"));
    await refreshJavaList();
  } catch (err: any) {
    message.error(err.message);
  }
  await refreshJavaList();
};

const handleDeleteJava = async (info: JavaInfo) => {
  try {
    await deleteJava().execute({
      params: {
        daemonId: props.daemonId ?? "",
        instanceId: props.instanceId ?? ""
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
    :title="t('TXT_CODE_3fee13ed')"
    :confirm-loading="isLoading"
    @close="close"
  >
    <div>
      <a-typography-paragraph>
        <a-typography-text type="secondary">
          {{ t("TXT_CODE_ebf01bcc") }}
          <br />
          {{ t("TXT_CODE_e1c637bb").replace("<mcsm_java>", "{mcsm_java}") }}
        </a-typography-text>
      </a-typography-paragraph>

      <div class="items-right">
        <a-button
         
          type="link"
          :icon="h(DownloadOutlined)"
          @click="handleDownloadJava()"
        >
          {{ t("TXT_CODE_9c48100e") }}
        </a-button>

        <a-button :icon="h(ReloadOutlined)" type="text" @click="refreshJavaList(true)">
          {{ t("TXT_CODE_b76d94e0") }}
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
          <div v-if="column.key === 'actions'" class="flex justify-end">
            <a-button v-if="record.info.fullname == instanceInfo?.config.java.id" class="mr-8" type="link" :disabled="true">
              {{ t("TXT_CODE_979520ef") }}
            </a-button>
            <a-button
              v-else
              class="mr-8"
              type="link"
              :disabled="record.info.downloading"
              @click="handleUsingJava(record.info as JavaInfo)"
            >
              {{ t("TXT_CODE_f0dcc8bf") }}
            </a-button>
            <a-popconfirm
              :title="t('TXT_CODE_f4f86ba8')"
              @confirm="handleDeleteJava(record.info as JavaInfo)"
            >
              <a-button danger type="link" :disabled="record.info.downloading">
                {{ t("TXT_CODE_ecbd7449") }}
                <DeleteOutlined />
              </a-button>
            </a-popconfirm>
          </div>
        </template>
      </a-table>
    </div>

    <template #footer>
      <a-button type="primary" @click="close">{{ t("TXT_CODE_31e92ef3") }}</a-button>
    </template>
  </a-modal>
</template>
