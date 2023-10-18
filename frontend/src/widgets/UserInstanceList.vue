<script setup lang="ts">
import { t } from "@/lang/i18n";
import { onMounted } from "vue";
import type { LayoutCard } from "@/types";
import { userInfoApi } from "@/services/apis/index";
import { useRouter } from "vue-router";
import { INSTANCE_STATUS } from "@/types/const";

defineProps<{
  card: LayoutCard;
}>();

const router = useRouter();

const { execute, state } = userInfoApi();

const columns = [
  {
    title: t("实例名称"),
    dataIndex: "nickname",
    key: "nickname"
  },
  {
    title: t("运行状态"),
    dataIndex: "status",
    key: "status",
    customRender: (e: { text: "-1" | "1" | "2" | "3" }) => {
      return INSTANCE_STATUS[e.text] || e.text;
    }
  },
  {
    title: t("字节流编码"),
    dataIndex: "ie",
    customRender: (e: { text: string; record: { oe: string; ie: string } }) => {
      return `${e.text}/${e.record?.oe}`;
    }
  },
  {
    title: t("最后启动"),
    dataIndex: "lastDatetime",
    key: "lastDatetime"
  },
  {
    title: t("到期时间"),
    dataIndex: "endTime",
    key: "endTime",
    customRender: (e: { text: string }) => {
      return e.text || t("无期限");
    }
  },
  {
    title: t("操作"),
    key: "operate"
  }
];

const getInstanceList = async () => {
  await execute({
    params: {
      advanced: true
    }
  });
};

const operate = (serviceUuid: string, instanceUuid: string) => {
  router.push({
    path: "/instances/terminal",
    query: {
      serviceUuid,
      instanceUuid
    }
  });
};

onMounted(() => {
  getInstanceList();
});
</script>

<template>
  <CardPanel>
    <template #title>{{ card.title }}</template>
    <template #body>
      <a-table
        :data-source="state?.instances"
        :columns="columns"
        :pagination="false"
        :scroll="{ x: 'max-content' }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'operate'">
            <a-button @click="operate(record.serviceUuid, record.uuid)">{{ t("管理") }}</a-button>
          </template>
        </template>
      </a-table>
    </template>
  </CardPanel>
</template>
