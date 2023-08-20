<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";
import { ref, computed } from "vue";
import { t } from "@/lang/i18n";
import {
  DownOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons-vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useScreen } from "@/hooks/useScreen";
import { arrayFilter } from "@/tools/array";
import { useAppRouters } from "@/hooks/useAppRouters";

interface InstanceBaseInfo {
  key?: number | string;
  uuid: string;
  name: string;
  daemon: string;
  limitTime: string;
  status: number;
}

const props = defineProps<{
  card: LayoutCard;
}>();

const { getRouteParamsUrl, toPage } = useAppRouters();
const screen = useScreen();

const handleDelete = (user: InstanceBaseInfo) => {};

const dataSource: InstanceBaseInfo[] = [
  {
    key: "1",
    name: "实例名称1",
    daemon: "守护进程1",
    limitTime: "限制时间1",
    status: 1,
    uuid: "1",
  },
];

const columns = computed(() => {
  return arrayFilter([
    {
      align: "center",
      title: "所属节点",
      dataIndex: "daemon",
      key: "daemon",
      minWidth: "200px",
    },
    {
      align: "center",
      title: "实例名称",
      dataIndex: "name",
      key: "name",
      minWidth: "200px",
    },
    {
      align: "center",
      title: "到期时间",
      dataIndex: "limitTime",
      key: "limitTime",
      minWidth: "200px",
      condition: () => !screen.isPhone.value,
    },
    {
      align: "center",
      title: "实例状态",
      dataIndex: "status",
      key: "status",
      minWidth: "200px",
      condition: () => !screen.isPhone.value,
    },
    {
      align: "center",
      title: "操作",
      key: "action",
      minWidth: "200px",
    },
  ]);
});
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24">
        <BetweenMenus>
          <template #left>
            <a-typography-title class="mb-0" :level="5">
              {{ t("应用访问权限") }}
            </a-typography-title>
          </template>
          <template #right>
            <a-button type="primary">{{ t("分配应用") }}</a-button>
          </template>
        </BetweenMenus>
      </a-col>

      <a-col :span="24">
        <CardPanel style="height: 100%">
          <template #body>
            <a-table size="middle" :dataSource="dataSource" :columns="columns">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-button danger>
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

<style lang="scss" scoped>
.search-input {
  transition: all 0.4s;
  text-align: center;
  width: 50%;
}

@media (max-width: 992px) {
  .search-input {
    transition: all 0.4s;
    text-align: center;
    width: 100% !important;
  }
}

.search-input:hover {
  width: 100%;
}
</style>
