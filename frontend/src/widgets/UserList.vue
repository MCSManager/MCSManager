<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard, UserInfo } from "@/types/index";
import { ref, computed, onMounted } from "vue";
import { t } from "@/lang/i18n";
import { DownOutlined, SearchOutlined } from "@ant-design/icons-vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useScreen } from "../hooks/useScreen";
import { arrayFilter } from "../tools/array";
import { useAppRouters } from "@/hooks/useAppRouters";
import { getUserInfo } from "@/services/apis";

defineProps<{
  card: LayoutCard;
}>();

const { execute } = getUserInfo();

// eslint-disable-next-line no-unused-vars
const { getRouteParamsUrl, toPage } = useAppRouters();
const screen = useScreen();

const operationForm = ref({
  name: "",
  currentPage: 1,
  pageSize: 20
});

const handleToUserConfig = (user: any) => {
  console.log(user);
  toPage({
    path: "/users/config",
    query: {
      uuid: user.uuid
    }
  });
};

// eslint-disable-next-line no-unused-vars
const handleDeleteUser = (user: UserInfo) => {};

const dataSource = ref<UserInfo>({} as UserInfo);
const total = ref(0);

const columns = computed(() => {
  return arrayFilter([
    {
      align: "center",
      title: "用户名",
      dataIndex: "userName",
      key: "userName",
      minWidth: "200px"
    },
    {
      align: "center",
      title: "角色",
      dataIndex: "permission",
      key: "permission",
      minWidth: "200px"
    },
    {
      align: "center",
      title: "最后上线时间",
      dataIndex: "loginTime",
      key: "loginTime",
      minWidth: "200px",
      condition: () => !screen.isPhone.value
    },
    {
      align: "center",
      title: "注册时间",
      dataIndex: "registerTime",
      key: "registerTime",
      minWidth: "200px",
      condition: () => !screen.isPhone.value
    },
    {
      align: "center",
      title: "操作",
      key: "action",
      minWidth: "200px"
    }
  ]);
});

const rowSelection = () => {};

const fetchData = async () => {
  const res = await execute({
    params: {
      userName: operationForm.value.name,
      page: operationForm.value.currentPage,
      page_size: operationForm.value.pageSize
    }
  });
  dataSource.value = res.value!;
  total.value = res.value?.total ?? 0;
};

onMounted(async () => {
  fetchData();
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
              <a-input v-model:value="operationForm.name" :placeholder="t('根据用户名搜索')">
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
              :row-selection="rowSelection"
              :data-source="dataSource.data"
              :columns="columns"
              :pagination="false"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-dropdown>
                    <template #overlay>
                      <a-menu>
                        <a-menu-item key="1" @click="handleToUserConfig(record)">
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
            <div class="flex justify-end mt-24">
              <a-pagination
                v-model:current="operationForm.currentPage"
                v-model:pageSize="operationForm.pageSize"
                :total="total"
                show-size-changer
                @change="fetchData"
              />
            </div>
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
