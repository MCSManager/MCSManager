<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { t } from "@/lang/i18n";
import { message } from "ant-design-vue";
import { DownOutlined } from "@ant-design/icons-vue";
import { throttle } from "lodash";

import CardPanel from "@/components/CardPanel.vue";
import BetweenMenus from "@/components/BetweenMenus.vue";

import { useScreen } from "../hooks/useScreen";
import { arrayFilter } from "../tools/array";
import { useAppRouters } from "@/hooks/useAppRouters";
import { getUserInfo, deleteUser as deleteUserApi, addUser as addUserApi } from "@/services/apis";

import type { LayoutCard, UserInfo } from "@/types/index";

defineProps<{
  card: LayoutCard;
}>();

interface dataType {
  total: number;
  pageSize: number;
  page: number;
  maxPage: number;
  data: UserInfo[];
}

const { execute } = getUserInfo();

// eslint-disable-next-line no-unused-vars
const { getRouteParamsUrl, toPage } = useAppRouters();
const screen = useScreen();

const operationForm = ref({
  name: "",
  currentPage: 1,
  pageSize: 20
});

const permissionList = {
  "1": t("TXT_CODE_eb880db2"),
  "10": t("TXT_CODE_cd978243"),
  "-1": t("TXT_CODE_7c76dbf")
};

const columns = computed(() => {
  return arrayFilter([
    {
      align: "center",
      title: t("TXT_CODE_eb9fcdad"),
      dataIndex: "userName",
      key: "userName",
      minWidth: "200px"
    },
    {
      align: "center",
      title: t("TXT_CODE_511aea70"),
      dataIndex: "permission",
      key: "permission",
      minWidth: "200px",
      customRender: (e: { text: "1" | "10" | "-1" }) => {
        return permissionList[e.text] || e.text;
      }
    },
    {
      align: "center",
      title: t("TXT_CODE_6372e25c"),
      dataIndex: "loginTime",
      key: "loginTime",
      minWidth: "200px",
      condition: () => !screen.isPhone.value
    },
    {
      align: "center",
      title: t("TXT_CODE_c5c56801"),
      dataIndex: "registerTime",
      key: "registerTime",
      minWidth: "200px",
      condition: () => !screen.isPhone.value
    },
    {
      align: "center",
      title: t("TXT_CODE_fe731dfc"),
      key: "action",
      minWidth: "200px"
    }
  ]);
});

const total = ref(0);
const data = ref<dataType>();
const dataSource = computed(() => data?.value?.data);
const selectedUsers = ref<string[]>([]);

const handleToUserConfig = (user: any) => {
  toPage({
    path: "/users/config",
    query: {
      uuid: user.uuid
    }
  });
};
const fetchData = async () => {
  if (operationForm.value.currentPage < 1) {
    operationForm.value.currentPage = 1;
  }
  const res = await execute({
    params: {
      userName: operationForm.value.name,
      page: operationForm.value.currentPage,
      page_size: operationForm.value.pageSize
    }
  });
  data.value = res.value!;
  total.value = res.value?.total ?? 0;
};

const reload = throttle(() => {
  fetchData();
}, 600);

const deleteUser = async (userList: string[]) => {
  try {
    const { execute } = deleteUserApi();
    await execute({
      data: userList
    });
    message.success(t("TXT_CODE_28190dbc"));
    await fetchData();
  } catch (error: any) {
    message.error(error.message);
  }
};

const handleDeleteUser = async (user: UserInfo) => {
  await deleteUser([user.uuid]);
};

const handleBatchDelete = async () => {
  if (selectedUsers.value.length === 0) {
    return message.warn(t("TXT_CODE_d78ad17a"));
  }
  await deleteUser(selectedUsers.value);
};

const { execute: addUserExecute, isLoading: addUserIsLoading } = addUserApi();

const newUserDialog = ref({
  status: false,
  title: t("TXT_CODE_e83ffa03"),
  permissionList: [
    {
      lable: t("TXT_CODE_a778451f"),
      value: 1
    },
    {
      lable: t("TXT_CODE_b438b517"),
      value: 10
    }
  ],
  data: {
    username: "",
    password: "",
    permission: 1
  },
  show: () => {
    newUserDialog.value.status = true;
  },
  hidden: () => {
    newUserDialog.value.clear();
    newUserDialog.value.status = false;
  },
  clear: () => {
    newUserDialog.value.data = {
      username: "",
      password: "",
      permission: 1
    };
  },
  resolve: async () => {
    if (newUserDialog.value.data.username == "" || newUserDialog.value.data.password == "")
      return message.error(t("TXT_CODE_633415e2"));

    try {
      await addUserExecute({
        data: newUserDialog.value.data
      });
      message.success(t("TXT_CODE_c855fc29"));
      newUserDialog.value.hidden();
    } catch (error: any) {
      message.error(t("TXT_CODE_5246d704") + error.message);
    }
    fetchData();
  }
});

onMounted(async () => {
  fetchData();
});
</script>

<template>
  <div class="new">
    <a-modal
      v-model:open="newUserDialog.status"
      destroy-on-close="true"
      :title="newUserDialog.title"
      :confirm-loading="addUserIsLoading"
      @ok="newUserDialog.resolve()"
    >
      <div class="mb-20">
        <a-typography-title :level="5">{{ t("TXT_CODE_eb9fcdad") }}</a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_1987587b") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="newUserDialog.data.username" :placeholder="t('TXT_CODE_4ea93630')" />
      </div>

      <div class="mb-20">
        <a-typography-title :level="5">{{ t("TXT_CODE_5c605130") }}</a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_1f2062c7") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-input v-model:value="newUserDialog.data.password" :placeholder="t('TXT_CODE_4ea93630')" />
      </div>

      <div class="mb-20">
        <a-typography-title :level="5">{{ t("TXT_CODE_511aea70") }}</a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{ t("TXT_CODE_21b8b71a") }}
          </a-typography-text>
        </a-typography-paragraph>
        <a-select v-model:value="newUserDialog.data.permission" style="max-width: 320px">
          <a-select-option
            v-for="item in newUserDialog.permissionList"
            :key="item"
            :value="item.value"
          >
            {{ item.lable }}
          </a-select-option>
        </a-select>
      </div>

      <div class="mb-20">
        <a-typography-title :level="5">{{ t("TXT_CODE_ef0ce2e") }}</a-typography-title>
        <a-typography-paragraph>
          <a-typography-text type="secondary">
            {{
              t(
                "TXT_CODE_9e9d3767"
              )
            }}
            <br />
            <a href="https://docs.mcsmanager.com/" target="_blank">
              {{ t("TXT_CODE_b01f8383") }}
            </a>
          </a-typography-text>
        </a-typography-paragraph>
      </div>
    </a-modal>
  </div>

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
                  <a-menu-item key="1" @click="newUserDialog.show()">
                    {{ t("TXT_CODE_e83ffa03") }}
                  </a-menu-item>
                  <a-menu-item key="2" @click="handleBatchDelete()">
                    {{ t("TXT_CODE_760f00f5") }}
                  </a-menu-item>
                  <!-- <a-menu-item key="3">{{ t("TXT_CODE_4d934e3a") }}</a-menu-item> -->
                </a-menu>
              </template>
              <a-button type="primary">
                {{ t("TXT_CODE_f7084f84") }}
                <DownOutlined />
              </a-button>
            </a-dropdown>
          </template>
          <template #center>
            <div class="search-input">
              <a-input
                v-model:value="operationForm.name"
                :placeholder="t('TXT_CODE_2471b9c')"
                @change="reload()"
                @press-enter="fetchData()"
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
              :row-selection="{
                selectedRowKeys: selectedUsers,
                onChange: (selectedRowKeys: string[], selectedRows: UserInfo[]) => {
                  selectedUsers = selectedRowKeys;
                }
              }"
              :data-source="dataSource"
              :columns="columns"
              :pagination="false"
              :preserve-selected-row-keys="true"
              :row-key="(record: UserInfo) => record.uuid"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-dropdown>
                    <template #overlay>
                      <a-menu>
                        <a-menu-item key="1" @click="handleToUserConfig(record)">
                          {{ t("TXT_CODE_236f70aa") }}
                        </a-menu-item>
                        <a-menu-item key="2" @click="handleDeleteUser(record)">
                          {{ t("TXT_CODE_760f00f5") }}
                        </a-menu-item>
                        <!-- <a-menu-item key="3">
                          {{ t("TXT_CODE_4d934e3a") }}
                        </a-menu-item> -->
                      </a-menu>
                    </template>
                    <a-button>
                      {{ t("TXT_CODE_fe731dfc") }}
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

  &:hover {
    width: 100%;
  }

  @media (max-width: 992px) {
    width: 100% !important;
  }
}
</style>
