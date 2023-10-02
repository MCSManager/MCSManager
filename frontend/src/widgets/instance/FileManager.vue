<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";
import { ref, computed, reactive, onMounted, watch, h } from "vue";
import { t } from "@/lang/i18n";
import type { TableProps } from "ant-design-vue";
import { convertFileSize } from "@/tools/fileSize";
import dayjs from "dayjs";
import {
  DownOutlined,
  SearchOutlined,
  FileOutlined,
  FolderOutlined,
  LoadingOutlined
} from "@ant-design/icons-vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useScreen } from "@/hooks/useScreen";
import { arrayFilter } from "@/tools/array";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { getFileList as getFileListApi, getFileStatus as getFileStatusApi } from "@/services/apis";
import { throttle } from "lodash";
import { message } from "ant-design-vue";

const props = defineProps<{
  card: LayoutCard;
}>();

interface DataType {
  name: string;
  type: number;
  size: number;
  time: string;
  mode: number;
}

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");

const screen = useScreen();

const spinning = ref(false);

const indicator = h(LoadingOutlined, {
  style: {
    fontSize: "24px"
  }
});

const operationForm = ref({
  name: "",
  current: 1,
  pageSize: 10,
  total: 0
});

const fileStatus = ref<{
  instanceFileTask: number;
  globalFileTask: number;
  platform: string;
  isGlobalInstance: boolean;
  dist: string[];
}>();

const dataSource = ref<DataType[]>();

const columns = computed(() => {
  return arrayFilter([
    {
      align: "center",
      title: t("文件名"),
      dataIndex: "name",
      key: "name",
      minWidth: "200px"
    },
    {
      align: "center",
      title: t("文件类型"),
      dataIndex: "type",
      key: "type",
      customRender: (e: { text: number }) => {
        return e.text == 1 ? t("文件") : t("目录");
      },
      minWidth: "200px"
    },
    {
      align: "center",
      title: t("大小"),
      dataIndex: "size",
      key: "size",
      customRender: (e: { text: number }) =>
        e.text == 0 ? "--" : convertFileSize(e.text.toString()),
      minWidth: "200px",
      condition: () => !screen.isPhone.value
    },
    {
      align: "center",
      title: t("修改时间"),
      dataIndex: "time",
      key: "time",
      customRender: (e: { text: string }) => {
        return dayjs(e.text).format("YYYY-MM-DD HH:mm:ss");
      },
      minWidth: "200px",
      condition: () => !screen.isPhone.value
    },
    // {
    //   align: "center",
    //   title: t("创建时间"),
    //   dataIndex: "createTime",
    //   key: "createTime",
    //   minWidth: "200px",
    //   condition: () => !screen.isPhone.value
    // },
    {
      align: "center",
      title: t("权限"),
      dataIndex: "mode",
      key: "mode",
      minWidth: "200px",
      condition: () => !screen.isPhone.value && fileStatus.value?.platform !== "win32"
    },
    {
      align: "center",
      title: t("操作"),
      dataIndex: "action",
      key: "action",
      minWidth: "200px"
    }
  ]);
});

const getFileList = async () => {
  const { execute } = getFileListApi();
  const res = await execute({
    params: {
      remote_uuid: daemonId || "",
      uuid: instanceId || "",
      page: operationForm.value.current - 1,
      page_size: operationForm.value.pageSize,
      file_name: operationForm.value.name,
      target: encodeURI(breadcrumbs[breadcrumbs.length - 1].path)
    }
  });
  dataSource.value = res.value?.items || [];
  operationForm.value.total = res.value?.total || 0;
};

const rowSelection: TableProps["rowSelection"] = {
  onChange: (selectedRowKeys: any, selectedRows: any) => {
    console.log(`selectedRowKeys: ${selectedRowKeys}`, "selectedRows: ", selectedRows);
  },
  getCheckboxProps: (record: DataType) => ({
    disabled: record.name === "Disabled User", // Column configuration not to be checked
    name: record.name
  })
};

const rwoClickTable = async (item: string, type: number) => {
  // files

  // .....

  if (type === 1) return;

  // dirs
  spinning.value = true;
  breadcrumbs.push({
    path: `${breadcrumbs[breadcrumbs.length - 1].path}${item}/`,
    name: item,
    disabled: false
  });
  await getFileList();
  spinning.value = false;
};

const handleChangeDir = async (dir: string) => {
  console.log(breadcrumbs);
  if (breadcrumbs.findIndex((e) => e.path === dir) === -1) return message.error(t("找不到路径"));
  spinning.value = true;
  breadcrumbs.splice(breadcrumbs.findIndex((e) => e.path === dir) + 1);
  await getFileList();
  spinning.value = false;
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
  disabled: false
});

watch(
  () => operationForm.value.name,
  throttle(() => {
    operationForm.value.current = 1;
    getFileList();
  }, 1000)
);

const handleTableChange = (e: { current: number; pageSize: number }) => {
  operationForm.value.current = e.current;
  operationForm.value.pageSize = e.pageSize;
  getFileList();
};

const { execute } = getFileStatusApi();

setInterval(async () => {
  await getFileStatus();
}, 3000);

const getFileStatus = async () => {
  const res = await execute({
    params: {
      remote_uuid: daemonId || "",
      uuid: instanceId || ""
    }
  });
  fileStatus.value = res.value;
};

onMounted(() => {
  getFileList();
  getFileStatus();
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
            <a-button type="dashed" danger class="mr-8">{{ t("TXT_CODE_f0260e51") }}</a-button>
            <a-dropdown>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="1">{{ t("TXT_CODE_e00c858c") }}</a-menu-item>
                  <a-menu-item key="2">{{ t("TXT_CODE_6215388a") }}</a-menu-item>
                  <a-menu-item key="3">{{ t("TXT_CODE_791c73e9") }}</a-menu-item>
                  <a-menu-item key="4">{{ t("TXT_CODE_88122886") }}</a-menu-item>
                  <a-menu-item key="5">{{ t("TXT_CODE_13ae6a93") }}</a-menu-item>
                  <a-menu-item key="6">{{ t("TXT_CODE_ecbd7449") }}</a-menu-item>
                </a-menu>
              </template>
              <a-button type="primary">
                {{ t("TXT_CODE_95495db") }}
                <DownOutlined />
              </a-button>
            </a-dropdown>
          </template>
          <template #center>
            <div class="search-input">
              <a-input v-model:value="operationForm.name" :placeholder="t('TXT_CODE_7cad42a5')">
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
                  <div class="file-breadcrumbs-item" @click="handleChangeDir(item.path)">
                    {{ item.name }}
                  </div>
                </a-breadcrumb-item>
              </a-breadcrumb>
            </div>
            <a-spin :spinning="spinning" :indicator="indicator">
              <a-table
                :row-selection="rowSelection"
                :row-key="(record: DataType) => record.name"
                :data-source="dataSource"
                :columns="columns"
                :scroll="{
                  x: 'max-content'
                }"
                :pagination="{
                  current: operationForm.current,
                  pageSize: operationForm.pageSize,
                  total: operationForm.total,
                  hideOnSinglePage: false,
                  showSizeChanger: true
                }"
                @change="handleTableChange($event)"
              >
                <!-- eslint-disable-next-line vue/no-unused-vars -->
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'name'">
                    <a-button
                      type="link"
                      class="file-name"
                      @click="rwoClickTable(record.name, record.type)"
                    >
                      <span>
                        <file-outlined v-if="record.type === 1" />
                        <folder-outlined v-else />
                        <!-- &nbsp; -->
                      </span>
                      {{ record.name }}
                    </a-button>
                  </template>
                  <template v-if="column.key === 'action'">
                    <a-dropdown>
                      <template #overlay>
                        <a-menu>
                          <a-menu-item key="1">
                            {{ t("TXT_CODE_16853efe") }}
                          </a-menu-item>
                          <a-menu-item key="2">
                            {{ t("TXT_CODE_c83551f5") }}
                          </a-menu-item>
                          <a-menu-item key="3">
                            {{ t("TXT_CODE_a64f3007") }}
                          </a-menu-item>
                          <a-menu-item key="4">
                            {{ t("TXT_CODE_13ae6a93") }}
                          </a-menu-item>
                          <a-menu-item key="5">
                            {{ t("TXT_CODE_823f9d21") }}
                          </a-menu-item>
                          <a-menu-item key="6">
                            {{ t("TXT_CODE_ecbd7449") }}
                          </a-menu-item>
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
            </a-spin>
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

.file-name {
  color: initial;
  &::v-deep span {
    text-decoration: underline;
  }
  &:hover {
    color: #1677ff;
  }
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
  border-radius: 6px;

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
