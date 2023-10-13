<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";
import { ref, computed, reactive, onMounted, watch, h, createVNode } from "vue";
import { t } from "@/lang/i18n";
import type { TableProps, UploadProps } from "ant-design-vue";
import { convertFileSize } from "@/tools/fileSize";
import dayjs from "dayjs";
import {
  DownOutlined,
  SearchOutlined,
  FileOutlined,
  FolderOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  UploadOutlined
} from "@ant-design/icons-vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useScreen } from "@/hooks/useScreen";
import { arrayFilter } from "@/tools/array";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import {
  getFileList as getFileListApi,
  getFileStatus as getFileStatusApi,
  addFolder as addFolderApi,
  deleteFile as deleteFileApi,
  touchFile as touchFileApi,
  copyFile as copyFileApi,
  moveFile as moveFileApi,
  compressFile as compressFileApi,
  uploadAddress,
  uploadFile as uploadFileApi,
  downloadAddress
} from "@/services/apis/fileManager";
import { throttle } from "lodash";
import { message, Modal } from "ant-design-vue";
import { parseForwardAddress } from "@/tools/protocol";
import { getExtName, getFileIcon } from "@/tools/fileManager";

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

const selectionData = ref<DataType[]>();

const dataSource = ref<DataType[]>();

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
  try {
    const res = await execute({
      params: {
        remote_uuid: daemonId || "",
        uuid: instanceId || "",
        page: operationForm.value.current - 1,
        page_size: operationForm.value.pageSize,
        file_name: operationForm.value.name,
        target: breadcrumbs[breadcrumbs.length - 1].path
      }
    });
    dataSource.value = res.value?.items || [];
    operationForm.value.total = res.value?.total || 0;
  } catch (error: any) {
    return message.error(error.message);
  }
};

const reloadList = async () => {
  await getFileList();
  return message.success(t("刷新文件列表成功"));
};

const dialog = ref({
  show: false,
  title: "Dialog",
  loading: false,
  value: "",
  info: "",
  mode: "",
  unzipmode: "0",
  code: "utf-8",
  ref: ref<HTMLInputElement | null>(null),
  ok: () => {},
  cancel: () => {
    dialog.value.value = "";
  }
});

const openDialog = (
  title: string,
  info: string,
  defaultvalue?: string,
  mode?: string
): Promise<string> => {
  if (defaultvalue) {
    dialog.value.value = defaultvalue;
  }
  if (mode == "zip") {
    dialog.value.mode = "zip";
  }
  if (mode == "unzip") {
    dialog.value.mode = "unzip";
  }

  dialog.value.title = title;
  dialog.value.info = info;
  dialog.value.show = true;

  // TODO: focus is bad
  dialog.value?.ref?.focus();

  return new Promise((resolve) => {
    dialog.value.ok = () => {
      if (dialog.value.value == "" && dialog.value.mode != "unzip") {
        return message.error(t("请输入内容"));
      }
      resolve(dialog.value.value);
      dialog.value.show = false;
      dialog.value.value = "";
      dialog.value.info = "";
      dialog.value.mode = "";
      dialog.value.ok = () => {};
    };
  });
};

const touchFile = async (dir?: boolean) => {
  const dirname = dir
    ? await openDialog(t("新建目录"), t("请输入目录名称"))
    : await openDialog(t("新建文件"), t("请输入文件名"));
  const execute = dir ? addFolderApi().execute : touchFileApi().execute;

  try {
    await execute({
      params: {
        uuid: instanceId || "",
        remote_uuid: daemonId || ""
      },
      data: {
        target: breadcrumbs[breadcrumbs.length - 1].path + dirname
      }
    });
    await getFileList();
    message.success(t("创建成功"));
  } catch (error: any) {
    return message.error(error.message);
  }
};

const clipboard = ref<{
  type: "copy" | "move";
  value: string[];
}>();

const setClipBoard = (type: "copy" | "move", file?: string) => {
  if (file) {
    clipboard.value = {
      type,
      value: [breadcrumbs[breadcrumbs.length - 1].path + file]
    };
  } else {
    if (!selectionData.value || selectionData.value.length === 0)
      return message.error(t("请先选择文件"));
    clipboard.value = {
      type,
      value: selectionData.value?.map((e) => breadcrumbs[breadcrumbs.length - 1].path + e.name)
    };
  }
  message.success(t("已保存至剪切板"));
};

const paste = async () => {
  if (!clipboard?.value?.type || !clipboard.value.value) return message.error(t("请先选择文件"));
  const execute = clipboard.value.type == "copy" ? copyFileApi().execute : moveFileApi().execute;
  try {
    await execute({
      params: {
        uuid: instanceId || "",
        remote_uuid: daemonId || ""
      },
      data: {
        targets: clipboard.value.value.map((e) => [
          e,
          breadcrumbs[breadcrumbs.length - 1].path + e.split("/")[e.split("/").length - 1]
        ])
      }
    });
    await getFileList();
    message.success(t("文件操作任务开始，如果文件数量过多，则需要一定时间"));
    clipboard.value.value = [];
  } catch (error: any) {
    message.error(error.message);
  }
};

const resetName = async (file: string) => {
  const newname = await openDialog(t("重命名"), t("请输入新名称"), file);
  try {
    const { execute } = moveFileApi();
    await execute({
      params: {
        uuid: instanceId || "",
        remote_uuid: daemonId || ""
      },
      data: {
        targets: [
          [
            breadcrumbs[breadcrumbs.length - 1].path + file,
            breadcrumbs[breadcrumbs.length - 1].path + newname
          ]
        ]
      }
    });
    message.success(t("重命名成功"));
    await getFileList();
  } catch (error: any) {
    return error.message;
  }
};

const deleteFile = async (file?: string) => {
  const { execute } = deleteFileApi();
  const useDeleteFileApi = async (files: string[]) => {
    try {
      await execute({
        params: {
          uuid: instanceId || "",
          remote_uuid: daemonId || ""
        },
        data: {
          targets: files
        }
      });
      await getFileList();
      message.success(t("文件删除任务开始，如果文件数量过多，则需要一定时间"));
      if (dataSource?.value?.length === 0 && operationForm.value.current > 1) {
        operationForm.value.current -= 1;
        await getFileList();
      }
    } catch (error: any) {
      message.error(error.message);
    }
  };

  Modal.confirm({
    title: t("你确定要删除吗?"),
    icon: createVNode(ExclamationCircleOutlined),
    content: createVNode("div", { style: "color:red;" }, t("删除后将无法恢复！")),
    async onOk() {
      if (file) {
        // one file
        await useDeleteFileApi([breadcrumbs[breadcrumbs.length - 1].path + file]);
      } else {
        // more file
        if (!selectionData.value) return message.error(t("请选择要删除的内容"));
        await useDeleteFileApi(
          selectionData.value.map((e) => breadcrumbs[breadcrumbs.length - 1].path + e.name)
        );
      }
    },
    okType: "danger",
    okText: t("确定"),
    class: "test"
  });
  return;
};

const zipFile = async () => {
  if (!selectionData.value || selectionData.value.length === 0)
    return message.error(t("请先选择文件"));
  const filename = await openDialog(t("压缩文件"), 't("请输入压缩后的文件名")', "", "zip");
  const { execute } = compressFileApi();
  try {
    await execute({
      params: {
        uuid: instanceId || "",
        remote_uuid: daemonId || ""
      },
      data: {
        type: 1,
        code: "utf-8",
        source: breadcrumbs[breadcrumbs.length - 1].path + filename + ".zip",
        targets: selectionData.value.map((e) => breadcrumbs[breadcrumbs.length - 1].path + e.name)
      }
    });
    message.success(t("文件压缩任务开始，如果文件数量过多，则需要一定时间"));
    await getFileList();
  } catch (error: any) {
    message.error(error.message);
  }
};

const unzipFile = async (name: string) => {
  const dirname = await openDialog(t("解压文件"), "", "", "unzip");
  const { execute } = compressFileApi();

  try {
    await execute({
      params: {
        uuid: instanceId || "",
        remote_uuid: daemonId || ""
      },
      data: {
        type: 2,
        code: dialog.value.code,
        source: breadcrumbs[breadcrumbs.length - 1].path + name,
        targets:
          dialog.value.unzipmode == "0"
            ? breadcrumbs[breadcrumbs.length - 1].path
            : breadcrumbs[breadcrumbs.length - 1].path + dirname
      }
    });
    message.success(t("文件解压任务开始，如果文件数量过多，则需要一定时间"));
    await getFileList();
  } catch (error: any) {
    message.error(error.message);
  }
};

const beforeUpload: UploadProps["beforeUpload"] = async (file) => {
  await selectedFile(file);
  return false;
};

const { state: uploadCfg, execute: getUploadCfg } = uploadAddress();
const { execute: uploadFile } = uploadFileApi();
const percentComplete = ref(0);
const selectedFile = async (file: File) => {
  try {
    await getUploadCfg({
      params: {
        upload_dir: breadcrumbs[breadcrumbs.length - 1].path,
        remote_uuid: daemonId!,
        uuid: instanceId!
      }
    });
    if (!uploadCfg.value) throw new Error(t("获取上传地址失败"));

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    await uploadFile({
      data: uploadFormData,
      url: `${parseForwardAddress(uploadCfg.value.addr, "http")}/upload/${
        uploadCfg.value.password
      }`,
      onUploadProgress: (progressEvent: any) => {
        percentComplete.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      }
    });
    await getFileList();
    percentComplete.value = 0;
    return message.success(t("上传成功"));
  } catch (err: any) {
    console.error(err);
    return message.error(err.message);
  }
};

const rowSelection: TableProps["rowSelection"] = {
  onChange: (selectedRowKeys: any, selectedRows: DataType[]) => {
    selectionData.value = selectedRows;
  }
};

const rowClickTable = async (item: string, type: number) => {
  if (type === 1) return;

  spinning.value = true;
  breadcrumbs.push({
    path: `${breadcrumbs[breadcrumbs.length - 1].path}${item}/`,
    name: item,
    disabled: false
  });
  await getFileList();
  spinning.value = false;
};

const { state: downloadCfg, execute: getDownloadCfg } = downloadAddress();
const downloadFile = async (fileName: string) => {
  try {
    await getDownloadCfg({
      params: {
        file_name: fileName,
        remote_uuid: daemonId!,
        uuid: instanceId!
      }
    });
    if (!downloadCfg.value) throw new Error(t("获取下载地址失败"));
    window.open(
      `${parseForwardAddress(downloadCfg.value.addr, "http")}/download/${
        downloadCfg.value.password
      }/${fileName}`
    );
  } catch (err: any) {
    console.error(err);
    return message.error(err.message);
  }
};

const handleChangeDir = async (dir: string) => {
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

import FileEditor from "./dialogs/FileEditor.vue";
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
                          <a-menu-item v-if="fileStatus?.platform != 'win32'" key="1">
                            {{ t("TXT_CODE_16853efe") }}
                          </a-menu-item>
                          <a-menu-item key="2" @click="editFile(record.name)">
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
  color: initial;
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
