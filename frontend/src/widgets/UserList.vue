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
import { useScreen } from "../hooks/useScreen";
import { arrayFilter } from "../tools/array";
import { useAppRouters } from "@/hooks/useAppRouters";

export interface UserInfo {
  key?: string | number;
  name: string;
  level: number;
  time: number;
  registerTime: number;
}

const props = defineProps<{
  card: LayoutCard;
}>();

const { getRouteParamsUrl, toPage } = useAppRouters();
const screen = useScreen();

const operationForm = ref({
  name: "",
});

const handleToUserConfig = (user: UserInfo) => {
  console.log(user);
  toPage({
    path: "/users/config",
    query: {
      uuid: "XXXZZZ123",
    },
  });
};

const handleDeleteUser = (user: UserInfo) => {};

const dataSource: UserInfo[] = [
  {
    key: "1",
    name: "Admin",
    level: 10,
    time: new Date().getTime(),
    registerTime: new Date().getTime(),
  },
  {
    key: "2",
    name: "Admin",
    level: 10,
    time: new Date().getTime(),
    registerTime: new Date().getTime(),
  },
  {
    key: "3",
    name: "Admin",
    level: 10,
    time: new Date().getTime(),
    registerTime: new Date().getTime(),
  },
  {
    key: "4",
    name: "Admin",
    level: 10,
    time: new Date().getTime(),
    registerTime: new Date().getTime(),
  },
];

const columns = computed(() => {
  return arrayFilter([
    {
      align: "center",
      title: "用户名",
      dataIndex: "name",
      key: "name",
      minWidth: "200px",
    },
    {
      align: "center",
      title: "角色",
      dataIndex: "level",
      key: "level",
      minWidth: "200px",
    },
    {
      align: "center",
      title: "最后上线时间",
      dataIndex: "time",
      key: "time",
      minWidth: "200px",
      condition: () => !screen.isPhone.value,
    },
    {
      align: "center",
      title: "注册时间",
      dataIndex: "registerTime",
      key: "registerTime",
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

const rowSelection = () => {};
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24">
        <BetweenMenus>
          <template #left>
            <a-typography-title class="mb-0" :level="5">
              {{ card.title }}
            </a-typography-title>
          </template>
          <template #right>
            <a-dropdown>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="1">新增用户</a-menu-item>
                  <a-menu-item key="2">删除用户</a-menu-item>
                  <a-menu-item key="3">封禁用户</a-menu-item>
                </a-menu>
              </template>
              <a-button type="primary">
                用户操作
                <DownOutlined />
              </a-button>
            </a-dropdown>
          </template>
          <template #center>
            <div class="search-input">
              <a-input
                v-model:value="operationForm.name"
                :placeholder="t('根据用户名搜索')"
              >
                <template #prefix>
                  <search-outlined />
                </template>
              </a-input>
            </div>
          </template>
        </BetweenMenus>
      </a-col>

      <a-col :span="24">
        <CardPanel style="height: 100%">
          <template #body>
            <a-table
              size="middle"
              :row-selection="rowSelection"
              :dataSource="dataSource"
              :columns="columns"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-dropdown>
                    <template #overlay>
                      <a-menu>
                        <a-menu-item
                          key="1"
                          @click="handleToUserConfig(record)"
                        >
                          {{ t("用户配置") }}
                        </a-menu-item>
                        <a-menu-item key="2" @click="handleDeleteUser(record)">
                          {{ t("删除用户") }}
                        </a-menu-item>
                      </a-menu>
                    </template>
                    <a-button>
                      {{ t("操作") }}
                      <DownOutlined />
                    </a-button>
                  </a-dropdown>
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
