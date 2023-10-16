<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";
import { ref, computed, reactive, onMounted, watch } from "vue";
import { t } from "@/lang/i18n";
import { convertFileSize } from "@/tools/fileSize";
import dayjs from "dayjs";
import { DownOutlined, SearchOutlined, UploadOutlined } from "@ant-design/icons-vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useScreen } from "@/hooks/useScreen";
import { arrayFilter } from "@/tools/array";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { throttle } from "lodash";
import { getExtName, getFileIcon } from "@/tools/fileManager";

import { useFileManager } from "@/hooks/usefileManager";
import FileEditor from "./dialogs/FileEditor.vue";

import type { DataType, OperationForm, Breadcrumb } from "@/types/fileManager";

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");

const screen = useScreen();

const operationForm = ref<OperationForm>({
  name: "",
  current: 1,
  pageSize: 10,
  total: 0
});

const selectionData = ref<DataType[]>();

const dataSource = ref<DataType[]>();

const breadcrumbs = reactive<Breadcrumb[]>([]);

breadcrumbs.push({
  path: "/",
  name: "/",
  disabled: false
});

const columns = computed(() => {
  return arrayFilter([
    {
      align: "left",
      title: t("文件名"),
      dataIndex: "name",
      key: "name",
      minWidth: "200px"
    },
    {
      align: "center",
      title: t("类型"),
      dataIndex: "type",
      key: "type",
      customRender: (e: { text: number; record: { name: string } }) => {
        return e.text == 1 ? getExtName(e.record.name) : t("文件夹");
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

const clipboard = ref<{
  type: "copy" | "move";
  value: string[];
}>();

const {
  indicator,
  dialog,
  percentComplete,
  rowSelection,
  spinning,
  fileStatus,
  permission,
  getFileList,
  touchFile,
  reloadList,
  setClipBoard,
  paste,
  resetName,
  deleteFile,
  zipFile,
  unzipFile,
  beforeUpload,
  downloadFile,
  handleChangeDir,
  rowClickTable,
  handleTableChange,
  getFileStatus,
  changePermission
} = useFileManager(
  operationForm,
  breadcrumbs,
  dataSource,
  clipboard,
  selectionData,
  instanceId,
  daemonId
);

watch(
  () => operationForm.value.name,
  throttle(() => {
    operationForm.value.current = 1;
    getFileList();
  }, 1000)
);

setInterval(async () => {
  await getFileStatus();
}, 3000);

const FileEditorDialog = ref<InstanceType<typeof FileEditor>>();

const editFile = (fileName: string) => {
  const path = breadcrumbs[breadcrumbs.length - 1].path + fileName;
  FileEditorDialog.value?.openDialog(path, fileName);
};

onMounted(() => {
  getFileStatus();
  dialog.value.loading = true;
  getFileList();
  dialog.value.loading = false;
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
            <a-upload
              v-if="!screen.isPhone.value"
              :before-upload="beforeUpload"
              :max-count="1"
              :disabled="percentComplete > 0"
              :show-upload-list="false"
            >
              <a-button class="mr-8" type="dashed" :loading="percentComplete > 0">
                <upload-outlined v-if="percentComplete === 0" />
                {{
                  percentComplete > 0
                    ? t("正在上传：") + percentComplete + "%"
                    : t("TXT_CODE_e00c858c")
                }}
              </a-button>
            </a-upload>
            <a-button
              v-if="clipboard?.value && clipboard.value.length > 0"
              type="dashed"
              danger
              class="mr-8"
              @click="paste()"
            >
              {{ t("TXT_CODE_f0260e51") }}
            </a-button>
            <a-button v-else class="mr-8" type="default" @click="reloadList()">
              {{ t("刷新列表") }}
            </a-button>

            <a-dropdown>
              <template #overlay>
                <a-menu>
                  <a-upload
                    v-if="screen.isPhone.value"
                    :before-upload="beforeUpload"
                    :max-count="1"
                    :disabled="percentComplete > 0"
                    :show-upload-list="false"
                  >
                    <a-menu-item key="1" :disabled="percentComplete > 0">
                      {{ percentComplete > 0 ? t("上传中...") : t("TXT_CODE_e00c858c") }}
                    </a-menu-item>
                    <template #itemRender=""></template>
                  </a-upload>

                  <a-menu-item key="2" @click="touchFile(true)">
                    {{ t("TXT_CODE_6215388a") }}
                  </a-menu-item>
                  <a-menu-item key="3" @click="touchFile()">
                    {{ t("TXT_CODE_791c73e9") }}
                  </a-menu-item>
                  <a-menu-item key="4" @click="zipFile()">{{ t("TXT_CODE_88122886") }}</a-menu-item>
                  <a-menu-item key="5" @click="setClipBoard('copy')">
                    {{ t("TXT_CODE_13ae6a93") }}
                  </a-menu-item>
                  <a-menu-item key="6" @click="setClipBoard('move')">
                    {{ t("剪切") }}
                  </a-menu-item>
                  <a-menu-item key="7" @click="deleteFile()">
                    {{ t("TXT_CODE_ecbd7449") }}
                  </a-menu-item>
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
            <a-progress
              v-if="percentComplete > 0"
              :stroke-color="{
                '0%': '#49b3ff',
                '100%': '#25f5b9'
              }"
              :percent="percentComplete"
              class="mb-20"
            />
            <div class="file-breadcrumbs mb-20">
              <a-breadcrumb separator=">">
                <a-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
                  <div class="file-breadcrumbs-item" @click="handleChangeDir(item.path)">
                    {{ item.name }}
                  </div>
                </a-breadcrumb-item>
              </a-breadcrumb>
            </div>
            <p
              v-if="fileStatus?.instanceFileTask && fileStatus.instanceFileTask > 0"
              style="color: #1677ff"
            >
              <a-spin :indicator="indicator" size="small" />
              {{
                t("当前有 ") + fileStatus?.instanceFileTask + t(" 个压缩 / 解压任务正在运行中...")
              }}
            </p>
            <a-spin :spinning="spinning" :indicator="indicator">
              <a-table
                :row-selection="rowSelection"
                :row-key="(record: DataType) => record.name"
                :data-source="dataSource"
                :columns="columns"
                :scroll="{
                  x: 'max-content'
                }"
                size="small"
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
                      @click="rowClickTable(record.name, record.type)"
                    >
                      <span class="mr-4">
                        <component
                          :is="getFileIcon(record.name, record.type)"
                          style="font-size: 16px"
                        />
                      </span>
                      {{ record.name }}
                    </a-button>
                  </template>
                  <template v-if="column.key === 'action'">
                    <a-dropdown>
                      <template #overlay>
                        <a-menu>
                          <a-menu-item
                            v-if="fileStatus?.platform != 'win32'"
                            key="1"
                            @click="changePermission(record.name, record.mode)"
                          >
                            {{ t("TXT_CODE_16853efe") }}
                          </a-menu-item>
                          <a-menu-item
                            v-if="record.type === 1"
                            key="2"
                            @click="editFile(record.name)"
                          >
                            {{ t("TXT_CODE_ad207008") }}
                          </a-menu-item>
                          <a-menu-item key="3" @click="setClipBoard('copy', record.name)">
                            {{ t("TXT_CODE_13ae6a93") }}
                          </a-menu-item>
                          <a-menu-item key="4" @click="setClipBoard('move', record.name)">
                            {{ t("剪切") }}
                          </a-menu-item>
                          <a-menu-item key="5" @click="resetName(record.name)">
                            {{ t("TXT_CODE_c83551f5") }}
                          </a-menu-item>
                          <a-menu-item key="6" @click="deleteFile(record.name)">
                            {{ t("TXT_CODE_ecbd7449") }}
                          </a-menu-item>
                          <a-menu-item key="7" @click="unzipFile(record.name)">
                            {{ t("TXT_CODE_a64f3007") }}
                          </a-menu-item>
                          <a-menu-item key="8" @click="downloadFile(record.name)">
                            {{ t("下载") }}
                          </a-menu-item>
                        </a-menu>
                      </template>
                      <a-button size="">
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

  <a-modal
    v-model:open="dialog.show"
    :title="dialog.title"
    :confirm-loading="dialog.loading"
    :style="dialog.style"
    @ok="dialog.ok()"
    @cancel="dialog.cancel()"
  >
    <p>{{ dialog.info }}</p>

    <a-input
      v-if="dialog.mode == ''"
      :ref="dialog.ref"
      v-model:value="dialog.value"
      :placeholder="t('请输入内容')"
    />

    <a-space v-if="dialog.mode == 'unzip'" direction="vertical" class="w-100">
      <a-typography-title :level="5">{{ t("请选择解压模式") }}</a-typography-title>
      <a-radio-group v-model:value="dialog.unzipmode">
        <a-radio-button value="0">{{ t("解压到当前目录") }}</a-radio-button>
        <a-radio-button value="1">{{ t("解压到新文件夹") }}</a-radio-button>
      </a-radio-group>

      <a-input
        v-if="dialog.unzipmode == '1'"
        v-model:value="dialog.value"
        :placeholder="t('请输入文件夹名')"
      />
    </a-space>

    <a-space v-if="dialog.mode == 'zip'" direction="vertical" class="w-100">
      <a-input
        :ref="dialog.ref"
        v-model:value="dialog.value"
        :placeholder="t('请输入压缩后的文件名')"
        addon-after=". zip"
      />
    </a-space>

    <a-space
      v-if="dialog.mode == 'zip' || dialog.mode == 'unzip'"
      direction="vertical"
      class="w-100 mt-16"
    >
      <a-typography-title :level="5">{{ t("请选择压缩文件的格式") }}</a-typography-title>
      <a-typography-text type="secondary">
        {{ t("在解压/压缩文件时发现文件名存在乱码现象时，可以修改此选项解决。") }}
        <br />
        {{ t("如果压缩包来源是中国大陆，一般可选 GBK;") }}
        <br />
        {{ t("如果是来自台湾，香港地区，可以选择BIG5，如果来自其他地区可以选择 UTF-8。") }}
      </a-typography-text>
      <a-radio-group v-model:value="dialog.code">
        <a-radio-button value="utf-8">utf-8</a-radio-button>
        <a-radio-button value="gbk">gbk</a-radio-button>
        <a-radio-button value="big5">big5</a-radio-button>
      </a-radio-group>
    </a-space>

    <a-space v-if="dialog.mode == 'permission'" direction="vertical" class="w-100">
      <a-spin :spinning="permission.loading" :indicator="indicator" size="small">
        <div class="flex-between permission">
          <a-checkbox-group
            v-for="item in permission.item"
            :key="item.key"
            v-model:value="permission.data[item.role]"
          >
            <a-row class="direction-column son">
              <h3 class="m-0">{{ item.key }}</h3>
              <a-col class="m-5 options">
                <a-checkbox value="4">{{ t("读取") }}</a-checkbox>
              </a-col>
              <a-col class="m-5 options">
                <a-checkbox value="2">{{ t("写入") }}</a-checkbox>
              </a-col>
              <a-col class="m-5 options">
                <a-checkbox value="1">{{ t("执行") }}</a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
        </div>

        <a-checkbox v-model:checked="permission.deep" class="mt-15">
          {{ t("应用到子目录") }}
        </a-checkbox>
      </a-spin>
    </a-space>
  </a-modal>

  <FileEditor ref="FileEditorDialog" />
</template>

<style lang="scss" scoped>
.search-input {
  transition: all 0.4s;
  text-align: center;
  width: 50%;
}

.file-name {
  color: inherit;
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

.permission {
  .son {
    border: 1px solid #dcdfe6;
    border-radius: 10px;
    padding: 10px 20px;
    box-shadow: inset 0 0 0 1px #00000010;
  }
}

@media (max-width: 350px) {
  .permission {
    flex-direction: column;
    .son {
      width: 100%;
    }
  }
}
</style>
