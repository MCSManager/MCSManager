<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";
import { ref, computed, reactive } from "vue";
import { t } from "@/lang/i18n";
import {
  DownOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons-vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useScreen } from "@/hooks/useScreen";
import { arrayFilter } from "@/tools/array";

const props = defineProps<{
  card: LayoutCard;
}>();

const screen = useScreen();

const operationForm = ref({
  name: "",
});

const dataSource = [
  {
    key: "1",
    name: "测试文件名1",
    size: "1824 MB",
    permission: 777,
    modifyTime: new Date().getTime(),
    createTime: new Date().getTime(),
  },
  {
    key: "1",
    name: "测试文件名2",
    size: "1824 MB",
    permission: 777,
    modifyTime: new Date().getTime(),
    createTime: new Date().getTime(),
  },
  {
    key: "1",
    name: "测试文件名3",
    size: "1824 MB",
    permission: 777,
    modifyTime: new Date().getTime(),
    createTime: new Date().getTime(),
  },
  {
    key: "1",
    name: "测试文件名4",
    size: "1824 MB",
    permission: 777,
    modifyTime: new Date().getTime(),
    createTime: new Date().getTime(),
  },
];

const columns = computed(() => {
  return arrayFilter([
    {
      align: "center",
      title: "文件名",
      dataIndex: "name",
      key: "name",
      minWidth: "200px",
    },
    {
      align: "center",
      title: "大小",
      dataIndex: "size",
      key: "size",
      minWidth: "200px",
      condition: () => !screen.isPhone.value,
    },
    {
      align: "center",
      title: "修改时间",
      dataIndex: "modifyTime",
      key: "modifyTime",
      minWidth: "200px",
      condition: () => !screen.isPhone.value,
    },
    {
      align: "center",
      title: "创建时间",
      dataIndex: "createTime",
      key: "createTime",
      minWidth: "200px",
      condition: () => !screen.isPhone.value,
    },
    {
      align: "center",
      title: "权限",
      dataIndex: "permission",
      key: "permission",
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

const handleChangeDir = (dir: string) => {
  console.log("前往：", dir);
};

const breadcrumbs = reactive<
  {
    path: string;
    name: string;
    disabled: boolean;
  }[]
>([]);

breadcrumbs.push({
  path: "/",
  name: "/",
  disabled: false,
});
breadcrumbs.push({
  path: "/workspace",
  name: "workspace",
  disabled: false,
});
breadcrumbs.push({
  path: "/workspace/test files",
  name: "test files",
  disabled: false,
});
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
            <a-button type="dashed" danger class="mr-8">粘贴文件</a-button>
            <a-dropdown>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="1">上传文件</a-menu-item>
                  <a-menu-item key="4">新建目录</a-menu-item>
                  <a-menu-item key="4">新建文件</a-menu-item>
                  <a-menu-item key="3">压缩</a-menu-item>
                  <a-menu-item key="4">解压</a-menu-item>
                  <a-menu-item key="2">批量删除</a-menu-item>
                </a-menu>
              </template>
              <a-button type="primary">
                文件操作
                <DownOutlined />
              </a-button>
            </a-dropdown>
          </template>
          <template #center>
            <div class="search-input">
              <a-input
                v-model:value="operationForm.name"
                :placeholder="t('根据文件名搜索')"
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
            <div class="file-breadcrumbs mb-20">
              <a-breadcrumb separator=">">
                <a-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
                  <div
                    class="file-breadcrumbs-item"
                    @click="handleChangeDir(item.path)"
                  >
                    {{ item.name }}
                  </div>
                </a-breadcrumb-item>
              </a-breadcrumb>
            </div>
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
                        <a-menu-item key="3">{{ t("更改权限") }}</a-menu-item>
                        <a-menu-item key="1">{{ t("重命名") }}</a-menu-item>
                        <a-menu-item key="3">{{ t("解压") }}</a-menu-item>
                        <a-menu-item key="2">{{ t("复制") }}</a-menu-item>
                        <a-menu-item key="3">{{ t("剪贴") }}</a-menu-item>
                        <a-menu-item key="4">{{ t("删除") }}</a-menu-item>
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

.file-breadcrumbs {
  border: 1px solid var(--color-gray-5);
  border-radius: 4px;

  .file-breadcrumbs-item {
    padding: 6px;
    cursor: pointer;
    display: inline-block;
    transition: all 0.4s;
    min-width: 32px;
    text-align: center;
  }

  .file-breadcrumbs-item:hover {
    background-color: var(--color-gray-4);
  }
}
</style>
