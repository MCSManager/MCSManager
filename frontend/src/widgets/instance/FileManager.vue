<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";
import type { LayoutCard } from "@/types/index";
import { ref, computed, onMounted, onUnmounted, h, type CSSProperties } from "vue";
import { getCurrentLang, t } from "@/lang/i18n";
import { convertFileSize } from "@/tools/fileSize";
import dayjs from "dayjs";
import {
  CopyOutlined,
  DeleteOutlined,
  DownOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FileOutlined,
  FileZipOutlined,
  FolderOutlined,
  FormOutlined,
  KeyOutlined,
  PlusOutlined,
  ScissorOutlined,
  SearchOutlined,
  UploadOutlined
} from "@ant-design/icons-vue";
import BetweenMenus from "@/components/BetweenMenus.vue";
import { useScreen } from "@/hooks/useScreen";
import { arrayFilter } from "@/tools/array";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import { filterFileName, getFileExtName, getFileIcon } from "@/tools/fileManager";
import { useFileManager } from "@/hooks/useFileManager";
import FileEditor from "./dialogs/FileEditor.vue";
import type { DataType } from "@/types/fileManager";
import type { AntColumnsType } from "@/types/ant";
import { useRightClickMenu } from "../../hooks/useRightClickMenu";
import { message, type ItemType, Modal } from "ant-design-vue";

const props = defineProps<{
  card: LayoutCard;
}>();

const { getMetaOrRouteValue } = useLayoutCardTools(props.card);
const instanceId = getMetaOrRouteValue("instanceId");
const daemonId = getMetaOrRouteValue("daemonId");

const { isPhone } = useScreen();

const {
  dialog,
  percentComplete,
  spinning,
  fileStatus,
  permission,
  selectedRowKeys,
  operationForm,
  dataSource,
  breadcrumbs,
  clipboard,
  currentDisk,
  isMultiple,
  selectChanged,
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
  selectedFile,
  rowClickTable,
  handleTableChange,
  getFileStatus,
  changePermission,
  toDisk,
  oneSelected
} = useFileManager(instanceId, daemonId);

const { openRightClickMenu } = useRightClickMenu();

const isShowDiskList = computed(
  () =>
    fileStatus.value?.disks.length &&
    fileStatus.value?.platform === "win32" &&
    fileStatus.value?.isGlobalInstance
);

const columns = computed(() => {
  return arrayFilter<AntColumnsType>([
    {
      align: "left",
      title: t("TXT_CODE_94c193de"),
      dataIndex: "name",
      key: "name",
      minWidth: 200
    },
    {
      align: "center",
      title: t("TXT_CODE_67d68dd1"),
      dataIndex: "type",
      key: "type",
      customRender: (e: { text: number; record: { name: string } }) => {
        return e.text == 1 ? filterFileName(e.record.name) : t("TXT_CODE_e5f949c");
      },
      condition: () => !isPhone.value,
      minWidth: 200
    },
    {
      align: "center",
      title: t("TXT_CODE_94bb113a"),
      dataIndex: "size",
      key: "size",
      customRender: (e: { text: number }) =>
        e.text == 0 ? "--" : convertFileSize(e.text.toString()),
      minWidth: 200,
      condition: () => !isPhone.value
    },
    {
      align: "center",
      title: t("TXT_CODE_d3b29478"),
      dataIndex: "time",
      key: "time",
      customRender: (e: { text: string }) => {
        return dayjs(e.text).format("YYYY-MM-DD HH:mm:ss");
      },
      minWidth: 200,
      condition: () => !isPhone.value
    },
    {
      align: "center",
      title: t("TXT_CODE_511aea70"),
      dataIndex: "mode",
      key: "mode",
      minWidth: 200,
      condition: () => !isPhone.value && fileStatus.value?.platform !== "win32"
    },
    {
      align: isPhone.value ? "center" : "right",
      title: t("TXT_CODE_fe731dfc"),
      dataIndex: "action",
      key: "action",
      minWidth: 200,
      condition: () => !isMultiple.value
    }
  ]);
});

let task: NodeJS.Timer | undefined;
task = setInterval(async () => {
  await getFileStatus();
}, 3000);

const FileEditorDialog = ref<InstanceType<typeof FileEditor>>();

const opacity = ref(false);
const handleDragover = (e: DragEvent) => {
  e.preventDefault();
  opacity.value = true;
};

const handleDragleave = (e: DragEvent) => {
  e.preventDefault();
  opacity.value = false;
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  const files = e.dataTransfer?.files;
  opacity.value = false;
  if (!files) return;
  if (files.length === 0) return;
  if (files.length > 1) return message.error(t("TXT_CODE_f125d699"));
  if (percentComplete.value > 0) return message.error(t("TXT_CODE_4f6a2959"));
  Modal.confirm({
    title: t("TXT_CODE_52bc24ec") + ` ${files[0].name} ?`,
    icon: h(ExclamationCircleOutlined),
    content: t("TXT_CODE_fffaeb16"),
    onOk() {
      selectedFile(files[0]);
    }
  });
};

const editFile = (fileName: string) => {
  const path = breadcrumbs[breadcrumbs.length - 1].path + fileName;
  FileEditorDialog.value?.openDialog(path, fileName);
};

const menuList = (record: DataType) =>
  arrayFilter<ItemType & { style?: CSSProperties }>([
    {
      label: t("TXT_CODE_b147fabc"),
      key: "new",
      icon: h(PlusOutlined),
      children: [
        {
          label: t("TXT_CODE_cfc657db"),
          key: "newFolder",
          icon: h(FolderOutlined),
          onClick: () => touchFile(true)
        },
        {
          label: t("TXT_CODE_1e0b63b6"),
          key: "newFile",
          icon: h(FileOutlined),
          onClick: () => touchFile()
        }
      ],
      condition: () => !isMultiple.value
    },
    {
      label: t("TXT_CODE_88122886"),
      key: "zip",
      icon: h(FileZipOutlined),
      onClick: () => zipFile(),
      condition: () => !!isMultiple.value
    },
    {
      label: t("TXT_CODE_a64f3007"),
      key: "unzip",
      icon: h(FileZipOutlined),
      onClick: () => unzipFile(record.name),
      condition: () => record.type === 1 && getFileExtName(record.name) === "zip"
    },
    {
      label: t("TXT_CODE_ad207008"),
      key: "edit",
      icon: h(EditOutlined),
      onClick: () => editFile(record.name),
      condition: () => !isMultiple.value && record.type === 1
    },
    {
      label: t("TXT_CODE_65b21404"),
      key: "download",
      icon: h(DownloadOutlined),
      onClick: () => downloadFile(record.name),
      condition: () => !isMultiple.value && record.type === 1
    },
    {
      label: t("TXT_CODE_46c4169b"),
      key: "cut",
      icon: h(ScissorOutlined),
      onClick: () => setClipBoard("move")
    },
    {
      label: t("TXT_CODE_13ae6a93"),
      key: "copy",
      icon: h(CopyOutlined),
      onClick: () => setClipBoard("copy")
    },
    {
      label: t("TXT_CODE_c83551f5"),
      key: "rename",
      icon: h(FormOutlined),
      onClick: () => resetName(record.name),
      condition: () => !isMultiple.value
    },
    {
      label: t("TXT_CODE_16853efe"),
      key: "changePermission",
      icon: h(KeyOutlined),
      onClick: () => changePermission(record.name, record.mode),
      condition: () => !isMultiple.value && fileStatus.value?.platform !== "win32"
    },
    {
      label: t("TXT_CODE_ecbd7449"),
      key: "delete",
      icon: h(DeleteOutlined),
      style: {
        color: "var(--color-red-5)"
      },
      onClick: () => deleteFile(record.name)
    }
  ]);

const handleRightClickRow = (e: MouseEvent, record: DataType) => {
  e.preventDefault();
  e.stopPropagation();
  oneSelected(record.name, record);
  openRightClickMenu(e.clientX, e.clientY, menuList(record));
  return false;
};

onMounted(async () => {
  await getFileStatus();
  dialog.value.loading = true;
  await getFileList();
  dialog.value.loading = false;
});

onUnmounted(() => {
  if (task) clearInterval(task);
  task = undefined;
});
</script>

<template>
  <div style="height: 100%" class="container">
    <a-row :gutter="[24, 24]" style="height: 100%">
      <a-col :span="24">
        <BetweenMenus>
          <template v-if="!isPhone" #left>
            <a-typography-title class="mb-0" :level="4">
              {{ card.title }}
            </a-typography-title>
          </template>
          <template #right>
            <a-upload
              :before-upload="beforeUpload"
              :max-count="1"
              :disabled="percentComplete > 0"
              :show-upload-list="false"
            >
              <a-button type="dashed" :loading="percentComplete > 0">
                <upload-outlined v-if="percentComplete === 0" />
                {{
                  percentComplete > 0
                    ? t("TXT_CODE_b625dbf0") + percentComplete + "%"
                    : t("TXT_CODE_e00c858c")
                }}
              </a-button>
            </a-upload>
            <a-button
              v-if="clipboard?.value && clipboard.value.length > 0"
              type="dashed"
              danger
              @click="paste()"
            >
              {{ t("TXT_CODE_f0260e51") }}
            </a-button>
            <a-button v-else type="default" @click="reloadList()">
              {{ t("TXT_CODE_a53573af") }}
            </a-button>

            <a-dropdown v-if="isMultiple">
              <template #overlay>
                <a-menu
                  mode="vertical"
                  :items="
                    menuList({
                      name: '',
                      type: 0,
                      size: 0,
                      time: '',
                      mode: 0
                    })
                  "
                >
                </a-menu>
              </template>
              <a-button type="primary">
                {{ t("TXT_CODE_5cb656b9") }}
                <DownOutlined />
              </a-button>
            </a-dropdown>

            <a-dropdown v-else>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="newFile" @click="touchFile()">
                    {{ t("TXT_CODE_1e0b63b6") }}
                  </a-menu-item>
                  <a-menu-item key="newFolder" @click="touchFile(true)">
                    {{ t("TXT_CODE_cfc657db") }}
                  </a-menu-item>
                </a-menu>
              </template>
              <a-button type="primary">
                {{ t("TXT_CODE_b147fabc") }}
                <DownOutlined />
              </a-button>
            </a-dropdown>
          </template>
          <template #center>
            <div class="search-input">
              <a-input
                v-model:value.trim.lazy="operationForm.name"
                :placeholder="t('TXT_CODE_7cad42a5')"
                allow-clear
                @change="getFileList()"
              >
                <template #suffix>
                  <search-outlined />
                </template>
              </a-input>
            </div>
          </template>
        </BetweenMenus>
      </a-col>

      <a-col :span="24">
        <CardPanel
          style="height: 100%"
          :style="opacity && 'opacity: 0.4'"
          @dragover="handleDragover"
          @dragleave="handleDragleave"
          @drop="handleDrop"
        >
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
            <div class="flex-wrap items-flex-start">
              <a-select
                v-if="isShowDiskList"
                v-model:value="currentDisk"
                :class="isPhone ? 'w-100 mb-10' : 'mr-10'"
                style="width: 125px"
                @change="toDisk(currentDisk)"
              >
                <a-select-option value="/">{{ t("TXT_CODE_28124988") }}</a-select-option>
                <a-select-option v-for="disk in fileStatus?.disks" :key="disk" :value="disk">
                  {{ disk }}
                </a-select-option>
              </a-select>
              <div class="file-breadcrumbs mb-20">
                <a-breadcrumb separator=">">
                  <a-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
                    <div class="file-breadcrumbs-item" @click="handleChangeDir(item.path)">
                      {{ item.name }}
                    </div>
                  </a-breadcrumb-item>
                </a-breadcrumb>
              </div>
            </div>

            <p
              v-if="fileStatus?.instanceFileTask && fileStatus.instanceFileTask > 0"
              style="color: #1677ff"
            >
              <a-spin />
              {{ t("TXT_CODE_dd06dea2") + fileStatus?.instanceFileTask + t("TXT_CODE_3e959ce7") }}
            </p>
            <a-spin :spinning="spinning">
              <a-table
                :row-selection="{
                  selectedRowKeys: selectedRowKeys,
                  onChange: selectChanged
                }"
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
                :custom-row="
                  (record: DataType) => {
                    return {
                      onContextmenu: (e: MouseEvent) => handleRightClickRow(e, record)
                    };
                  }
                "
                @change="
                  (e) => handleTableChange({ current: e.current || 0, pageSize: e.pageSize || 0 })
                "
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'name'">
                    <a-button
                      type="link"
                      class="file-name"
                      @click="
                        record.type !== 1
                          ? rowClickTable(record.name, record.type)
                          : editFile(record.name)
                      "
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
                    <a-dropdown v-if="isPhone">
                      <template #overlay>
                        <a-menu mode="vertical" :items="menuList(record as DataType)"> </a-menu>
                      </template>
                      <a-button size="middle">
                        {{ t("TXT_CODE_fe731dfc") }}
                        <DownOutlined />
                      </a-button>
                    </a-dropdown>
                    <a-space v-else>
                      <a-tooltip
                        v-for="(item, i) in (menuList(record as DataType) as any).filter(
                          (menu: any) => !menu.children
                        )"
                        :key="i"
                        :title="item.label"
                      >
                        <a-button
                          :icon="item.icon"
                          type="text"
                          size="small"
                          :style="item.style"
                          @click="item.onClick"
                        >
                        </a-button>
                      </a-tooltip>
                    </a-space>
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
      :placeholder="t('TXT_CODE_4ea93630')"
    />

    <a-space v-if="dialog.mode == 'unzip'" direction="vertical" class="w-100">
      <a-typography-title :level="5">{{ t("TXT_CODE_a6453188") }}</a-typography-title>
      <a-radio-group v-model:value="dialog.unzipmode">
        <a-radio-button value="0">{{ t("TXT_CODE_7907c99") }}</a-radio-button>
        <a-radio-button value="1">{{ t("TXT_CODE_329fb904") }}</a-radio-button>
      </a-radio-group>

      <a-input
        v-if="dialog.unzipmode == '1'"
        v-model:value="dialog.value"
        :placeholder="t('TXT_CODE_377e5535')"
      />
    </a-space>

    <a-space v-if="dialog.mode == 'zip'" direction="vertical" class="w-100">
      <a-input
        :ref="dialog.ref"
        v-model:value="dialog.value"
        :placeholder="t('TXT_CODE_366bad15')"
        addon-after=". zip"
      />
    </a-space>

    <a-space v-if="dialog.mode == 'unzip'" direction="vertical" class="w-100 mt-16">
      <a-typography-title :level="5">{{ t("TXT_CODE_2841f4a") }}</a-typography-title>
      <a-typography-text v-if="getCurrentLang() == 'zh_cn'" type="secondary">
        {{ t("TXT_CODE_b278707d") }}
        <br />
        {{ t("TXT_CODE_48044fc2") }}
        <br />
        {{ t("TXT_CODE_76a82338") }}
      </a-typography-text>
      <a-radio-group v-model:value="dialog.code">
        <a-radio-button value="utf-8">UTF-8</a-radio-button>
        <a-radio-button value="gbk">GBK</a-radio-button>
        <a-radio-button value="big5">BIG5</a-radio-button>
      </a-radio-group>
    </a-space>

    <a-space v-if="dialog.mode == 'zip'" direction="vertical" class="w-100 mt-16">
      <a-typography-text>
        {{ t("TXT_CODE_92ebdc7f") }}
      </a-typography-text>
    </a-space>

    <a-space v-if="dialog.mode == 'permission'" direction="vertical" class="w-100 select-none">
      <a-spin :spinning="permission.loading">
        <div class="flex-between permission">
          <a-checkbox-group
            v-for="item in permission.item"
            :key="item.key"
            v-model:value="permission.data[item.role]"
          >
            <a-row class="direction-column son">
              <a-typography-text class="mb-10">
                <strong>{{ item.key }}</strong>
              </a-typography-text>
              <a-col class="mb-10 options">
                <a-checkbox value="4">{{ t("TXT_CODE_798f592e") }}</a-checkbox>
              </a-col>
              <a-col class="mb-10 options">
                <a-checkbox value="2">{{ t("TXT_CODE_46c4e9ac") }}</a-checkbox>
              </a-col>
              <a-col class="mb-10 options">
                <a-checkbox value="1">{{ t("TXT_CODE_e97669d8") }}</a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
        </div>
        <a-checkbox v-model:checked="permission.deep" class="mt-15">
          {{ t("TXT_CODE_74fd665e") }}
        </a-checkbox>
      </a-spin>
    </a-space>
  </a-modal>

  <FileEditor
    v-if="daemonId && instanceId"
    ref="FileEditorDialog"
    :daemon-id="daemonId"
    :instance-id="instanceId"
    @save="getFileList"
  />
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

.upload-tip {
  position: absolute;
  right: 0;
  left: 0;
  top: 0;
  bottom: 0;
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
  flex: 1;

  .file-breadcrumbs-item {
    padding: 8px;
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

@media (max-width: 350px) {
  .permission {
    flex-direction: column;
    .son {
      width: 100%;
    }
  }
}
</style>
