<script setup lang="ts">
import { t } from "@/lang/i18n";
import { onMounted } from "vue";
import type { LayoutCard } from "@/types";
import { userInfoApi } from "@/services/apis/index";
import { useRouter } from "vue-router";
import { INSTANCE_STATUS, INSTANCE_STATUS_CODE } from "@/types/const";
import { parseTimestamp } from "../tools/time";

defineProps<{
  card: LayoutCard;
}>();

const router = useRouter();

const { execute, state } = userInfoApi();

const columns = [
  {
    title: t("TXT_CODE_f70badb9"),
    dataIndex: "nickname",
    key: "nickname"
  },
  {
    title: t("TXT_CODE_5476e012"),
    dataIndex: "status",
    key: "status",
    customRender: (e: { text: INSTANCE_STATUS_CODE }) => {
      return INSTANCE_STATUS[e.text] || e.text;
    }
  },
  {
    title: t("TXT_CODE_662ad338"),
    dataIndex: "ie",
    customRender: (e: { text: string; record: { oe: string; ie: string } }) => {
      if (!e.record.oe && !e.record.ie) {
        return "--";
      }
      return `${t("TXT_CODE_bb888626")}:${e.record.oe} ${t("TXT_CODE_4b6e951")}:${e.record.ie}`;
    }
  },
  {
    title: t("TXT_CODE_5ab2062d"),
    dataIndex: "lastDatetime",
    key: "lastDatetime",
    customRender: (e: { text: number }) => {
      return parseTimestamp(e.text);
    }
  },
  {
    title: t("TXT_CODE_fa920c0"),
    dataIndex: "endTime",
    key: "endTime",
    customRender: (e: { text: number }) => {
      return parseTimestamp(e.text) || t("TXT_CODE_abc080d");
    }
  },
  {
    title: t("TXT_CODE_fe731dfc"),
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

const operate = (daemonId: string, instanceId: string) => {
  router.push({
    path: "/instances/terminal",
    query: {
      daemonId,
      instanceId
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
            <a-button
              :disabled="record.status === INSTANCE_STATUS_CODE.BUSY"
              @click="operate(record.daemonId, record.instanceUuid)"
            >
              {{ t("TXT_CODE_5974bf24") }}
            </a-button>
          </template>
        </template>
      </a-table>
    </template>
  </CardPanel>
</template>
