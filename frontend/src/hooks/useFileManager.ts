import { openLoadingDialog, useImageViewerDialog } from "@/components/fc";
import OverwriteFilesPopUpContent from "@/components/OverwriteFilesPopUpContent.vue";
import { t } from "@/lang/i18n";
import {
  addFolder as addFolderApi,
  changePermission as changePermissionApi,
  compressFile as compressFileApi,
  copyFile as copyFileApi,
  deleteFile as deleteFileApi,
  downloadAddress,
  fileList as getFileListApi,
  getFileStatus as getFileStatusApi,
  moveFile as moveFileApi,
  touchFile as touchFileApi,
  uploadAddress
} from "@/services/apis/fileManager";
import uploadService from "@/services/uploadService";
import { number2permission, permission2number } from "@/tools/permission";
import { mapDaemonAddress, parseForwardAddress, type RemoteMappingEntry } from "@/tools/protocol";
import { reportErrorMsg } from "@/tools/validator";
import type {
  Breadcrumb,
  DataType,
  FileStatus,
  OperationForm,
  Permission
} from "@/types/fileManager";
import { ExclamationCircleOutlined } from "@ant-design/icons-vue";
import { message, Modal } from "ant-design-vue";
import type { Key } from "ant-design-vue/es/table/interface";
import { computed, createVNode, reactive, ref, type VNodeRef } from "vue";

export function getFileConfigAddr(config: { addr: string; remoteMappings?: RemoteMappingEntry[] }) {
  let addr = config.addr;
  if (config.remoteMappings) {
    const mapped = mapDaemonAddress(config.remoteMappings);
    if (mapped) {
      addr = mapped.addr + mapped.prefix;
    }
  }
  return addr;
}

export const useFileManager = (instanceId?: string, daemonId?: string) => {
  const dataSource = ref<DataType[]>();
  const fileStatus = ref<FileStatus>();
  const selectedRowKeys = ref<Key[]>([]);
  const selectionData = ref<DataType[]>();
  const isMultiple = computed(() => selectionData.value && selectionData.value.length > 1);
  const operationForm = ref<OperationForm>({
    name: "",
    current: 1,
    pageSize: 100,
    total: 0
  });

  const breadcrumbs = reactive<Breadcrumb[]>([]);
  breadcrumbs.push({
    path: "/",
    name: "/",
    disabled: false
  });

  const clipboard = ref<{
    type: "copy" | "move";
    value: string[];
  }>();

  const dialog = ref({
    show: false,
    title: "Dialog",
    loading: false,
    value: "",
    info: "",
    mode: "",
    unzipmode: "0",
    code: "utf-8",
    ref: ref<VNodeRef>(),
    ok: () => {},
    cancel: () => {
      dialog.value.value = "";
    },
    style: {}
  });

  const openDialog = (
    title: string,
    info: string,
    defaultValue?: string,
    mode?: string,
    style?: object
  ): Promise<string> => {
    dialog.value.style = style || {};
    dialog.value.value = defaultValue || "";
    dialog.value.mode = mode || "";

    dialog.value.title = title;
    dialog.value.info = info;
    dialog.value.show = true;

    (dialog.value?.ref as any)?.focus();

    return new Promise((resolve) => {
      dialog.value.ok = () => {
        if (
          dialog.value.value == "" &&
          dialog.value.mode != "unzip" &&
          dialog.value.mode != "permission"
        ) {
          return reportErrorMsg(t("TXT_CODE_4ea93630"));
        }
        resolve(dialog.value.value);
        dialog.value.show = false;
        dialog.value.value = "";
        dialog.value.info = "";
        dialog.value.mode = "";
        dialog.value.style = {};
        dialog.value.ok = () => {};
      };
    });
  };

  const getFileList = async (throwErr = false) => {
    const { execute } = getFileListApi();
    try {
      clearSelected();
      const res = await execute({
        params: {
          daemonId: daemonId || "",
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
      if (throwErr) throw error;
      return reportErrorMsg(error.message);
    }
  };

  const reloadList = async () => {
    await getFileList();
    return message.success(t("TXT_CODE_8ccb5428"));
  };

  const touchFile = async (dir?: boolean) => {
    clearSelected();
    const dirname = dir
      ? await openDialog(t("TXT_CODE_6215388a"), t("TXT_CODE_1b450b79"))
      : await openDialog(t("TXT_CODE_791c73e9"), t("TXT_CODE_59cb16ff"));
    const execute = dir ? addFolderApi().execute : touchFileApi().execute;

    try {
      await execute({
        params: {
          uuid: instanceId || "",
          daemonId: daemonId || ""
        },
        data: {
          target: breadcrumbs[breadcrumbs.length - 1].path + dirname
        }
      });
      await getFileList();
      message.success(t("TXT_CODE_d28c05df"));
    } catch (error: any) {
      return reportErrorMsg(error.message);
    }
  };

  const setClipBoard = (type: "copy" | "move", file?: string) => {
    if (file) {
      clipboard.value = {
        type,
        value: [breadcrumbs[breadcrumbs.length - 1].path + file]
      };
    } else {
      if (!selectionData.value || selectionData.value.length === 0)
        return reportErrorMsg(t("TXT_CODE_b152cd75"));
      clipboard.value = {
        type,
        value: selectionData.value?.map((e) => breadcrumbs[breadcrumbs.length - 1].path + e.name)
      };
    }
    message.success(t("TXT_CODE_25cb04bb"));
    clearSelected();
  };

  const paste = async () => {
    if (!clipboard?.value?.type || !clipboard.value.value)
      return reportErrorMsg(t("TXT_CODE_b152cd75"));
    const execute = clipboard.value.type == "copy" ? copyFileApi().execute : moveFileApi().execute;
    try {
      await execute({
        params: {
          uuid: instanceId || "",
          daemonId: daemonId || ""
        },
        data: {
          targets: clipboard.value.value.map((e) => [
            e,
            breadcrumbs[breadcrumbs.length - 1].path + e.split("/")[e.split("/").length - 1]
          ])
        }
      });
      await getFileList();
      message.success(t("TXT_CODE_93d4b66a"));
      clearSelected();
      clipboard.value.value = [];
    } catch (error: any) {
      reportErrorMsg(error.message);
    }
  };

  const resetName = async (file: string) => {
    const newname = await openDialog(t("TXT_CODE_c83551f5"), t("TXT_CODE_a5830778"), file);
    try {
      const { execute } = moveFileApi();
      await execute({
        params: {
          uuid: instanceId || "",
          daemonId: daemonId || ""
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
      message.success(t("TXT_CODE_5b990e2e"));
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
            daemonId: daemonId || ""
          },
          data: {
            targets: files
          }
        });
        await getFileList();
        message.success(t("TXT_CODE_cae10a08"));
        if (dataSource?.value?.length === 0 && operationForm.value.current > 1) {
          operationForm.value.current -= 1;
          await getFileList();
        }
      } catch (error: any) {
        reportErrorMsg(error.message);
      }
    };

    Modal.confirm({
      title: t("TXT_CODE_71155575"),
      icon: createVNode(ExclamationCircleOutlined),
      content: createVNode("div", { style: "color:red;" }, t("TXT_CODE_6a10302d")),
      async onOk() {
        if (!isMultiple.value) {
          // one file
          await useDeleteFileApi([breadcrumbs[breadcrumbs.length - 1].path + file]);
        } else {
          // more file
          if (!selectionData.value) return reportErrorMsg(t("TXT_CODE_f41ad30a"));
          await useDeleteFileApi(
            selectionData.value.map((e) => breadcrumbs[breadcrumbs.length - 1].path + e.name)
          );
        }
      },
      okType: "danger",
      okText: t("TXT_CODE_d507abff"),
      class: "test"
    });
    return;
  };

  const zipFile = async () => {
    if (!selectionData.value || selectionData.value.length === 0)
      return reportErrorMsg(t("TXT_CODE_b152cd75"));
    const filename = await openDialog(t("TXT_CODE_f8a15a94"), t("TXT_CODE_366bad15"), "", "zip");
    const { execute } = compressFileApi();
    const loadingDialog = await openLoadingDialog(
      t("TXT_CODE_b3825da"),
      t("TXT_CODE_ba027d6c"),
      t("TXT_CODE_e1070b52")
    );
    try {
      await execute({
        params: {
          uuid: instanceId || "",
          daemonId: daemonId || ""
        },
        data: {
          type: 1,
          code: "utf-8",
          source: breadcrumbs[breadcrumbs.length - 1].path + filename + ".zip",
          targets: selectionData.value.map((e) => breadcrumbs[breadcrumbs.length - 1].path + e.name)
        }
      });
      message.success(t("TXT_CODE_c3a933d3"));
      await getFileList();
    } catch (error: any) {
      message.error(t("TXT_CODE_dba9bf61"));
      reportErrorMsg(error.message);
    } finally {
      loadingDialog.cancel();
    }
  };

  const unzipFile = async (name: string) => {
    const dirname = await openDialog(t("TXT_CODE_7669fd3f"), "", "", "unzip");
    const { execute } = compressFileApi();
    const loadingDialog = await openLoadingDialog(
      t("TXT_CODE_b3825da"),
      t("TXT_CODE_b82225c3"),
      t("TXT_CODE_6f038f25")
    );
    try {
      await execute({
        params: {
          uuid: instanceId || "",
          daemonId: daemonId || ""
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
      message.success(t("TXT_CODE_c3a933d3"));
      await getFileList();
    } catch (error: any) {
      message.error(t("TXT_CODE_26d7316f"));
      reportErrorMsg(error.message);
    } finally {
      loadingDialog.cancel();
    }
  };

  const spinning = ref(false);

  const selectedFiles = async (files: File[]) => {
    const { state: missionCfg, execute: getUploadMissionCfg } = uploadAddress();
    const fileSet = new Set(files.map((f) => ({ file: f, overwrite: false })));
    const existingFiles: typeof fileSet = new Set();

    for (const f of fileSet) {
      if (dataSource.value?.find((dataType) => dataType.name === f.file.name)) {
        existingFiles.add(f);
      }
    }

    for (const f of existingFiles) {
      const all = ref(false);
      const overwrite = ref(false);
      const confirmPromise = new Promise<boolean>((onComplete) => {
        Modal.confirm({
          title: t("TXT_CODE_99ca8563"),
          icon: createVNode(ExclamationCircleOutlined),
          content: createVNode(
            OverwriteFilesPopUpContent,
            {
              count: existingFiles.size,
              fileName: f.file.name,
              all: all,
              overwrite: overwrite,
              "onUpdate:all": (val: boolean) => (all.value = val),
              "onUpdate:overwrite": (val: boolean) => (overwrite.value = val)
            },
            null
          ),
          okText: t("TXT_CODE_ae09d79d"),
          cancelText: t("TXT_CODE_518528d0"),
          onOk() {
            onComplete(true);
          },
          onCancel() {
            onComplete(false);
          }
        });
      });
      if (await confirmPromise) {
        if (all.value) {
          for (const f of existingFiles) {
            f.overwrite = overwrite.value;
          }
          break;
        }
        f.overwrite = overwrite.value;
        existingFiles.delete(f);
      } else {
        // skip
        if (all.value) {
          for (const f of existingFiles) {
            fileSet.delete(f);
          }
          break;
        }
        existingFiles.delete(f);
        fileSet.delete(f);
      }
    }

    for (const f of fileSet) {
      try {
        const uploadDir = breadcrumbs[breadcrumbs.length - 1].path;
        await getUploadMissionCfg({
          params: {
            upload_dir: uploadDir,
            daemonId: daemonId!,
            uuid: instanceId!,
            file_name: f.file.name
          }
        });
        if (!missionCfg.value) throw new Error(t("TXT_CODE_e8ce38c2"));

        const addr = parseForwardAddress(getFileConfigAddr(missionCfg.value), "http");
        uploadService.append(
          f.file,
          addr,
          missionCfg.value.password,
          {
            overwrite: f.overwrite
          },
          (task) => {
            task.instanceInfo = {
              instanceId: instanceId || "",
              daemonId: daemonId || ""
            };
          }
        );
      } catch (err: any) {
        console.error(err);
        return reportErrorMsg(err.response?.data || err.message);
      }
    }
  };

  const selectChanged = (_selectedRowKeys: Key[], selectedRows: DataType[]) => {
    selectionData.value = selectedRows;
    selectedRowKeys.value = _selectedRowKeys;
  };

  const pushSelected = (key: Key, row: DataType) => {
    const index = selectedRowKeys.value.indexOf(key);
    if (index > -1) return;
    selectionData.value?.push(row);
    selectedRowKeys.value.push(key);
  };

  const oneSelected = (key: Key, row: DataType) => {
    const index = selectedRowKeys.value.indexOf(key);
    if (index > -1) return;
    selectionData.value = [row];
    selectedRowKeys.value = [key];
  };

  const clearSelected = () => {
    selectionData.value = [];
    selectedRowKeys.value = [];
  };

  const rowClickTable = async (item: string, type: number) => {
    if (type === 1) return;
    try {
      spinning.value = true;
      breadcrumbs.push({
        path: `${breadcrumbs[breadcrumbs.length - 1].path}${item}/`,
        name: item,
        disabled: false
      });
      operationForm.value.name = "";
      operationForm.value.current = 1;
      await getFileList(true);
    } catch (error: any) {
      breadcrumbs.splice(breadcrumbs.length - 1, 1);
      return reportErrorMsg(error.message);
    } finally {
      spinning.value = false;
    }
  };

  const getFileLink = async (fileName: string, frontDir?: string) => {
    frontDir = frontDir || breadcrumbs[breadcrumbs.length - 1].path;
    const { state: downloadCfg, execute: getDownloadCfg } = downloadAddress();

    try {
      await getDownloadCfg({
        params: {
          file_name: frontDir + fileName,
          daemonId: daemonId || "",
          uuid: instanceId || ""
        }
      });
      if (!downloadCfg.value) return null;
      const addr = parseForwardAddress(getFileConfigAddr(downloadCfg.value), "http");
      const path = `/download/${downloadCfg.value.password}/${fileName}`;
      return addr + path;
    } catch (err: any) {
      console.error(err);
      return reportErrorMsg(err.message);
    }
  };

  const downloadFile = async (fileName: string) => {
    const link = await getFileLink(fileName);
    if (!link) throw new Error(t("TXT_CODE_6d772765"));
    window.open(link);
  };

  const handleChangeDir = async (dir: string) => {
    if (breadcrumbs.findIndex((e) => e.path === dir) === -1)
      return reportErrorMsg(t("TXT_CODE_96281410"));
    spinning.value = true;
    breadcrumbs.splice(breadcrumbs.findIndex((e) => e.path === dir) + 1);
    operationForm.value.name = "";
    operationForm.value.current = 1;
    await getFileList();
    spinning.value = false;
  };

  const handleTableChange = (e: { current: number; pageSize: number }) => {
    selectedRowKeys.value = [];
    selectionData.value = [];
    // operationForm.value.name = "";
    operationForm.value.current = e.current;
    operationForm.value.pageSize = e.pageSize;
    getFileList();
  };

  const handleSearchChange = () => {
    operationForm.value.current = 1;
    getFileList();
  };

  const getFileStatus = async () => {
    const { state, execute } = getFileStatusApi();
    try {
      await execute({
        params: {
          daemonId: daemonId || "",
          uuid: instanceId || ""
        }
      });
      if (state.value) {
        fileStatus.value = state.value;
      }
    } catch (err: any) {
      console.error(err);
      return reportErrorMsg(err.message);
    }
  };

  const permission = reactive<Permission>({
    data: {
      owner: [],
      usergroup: [],
      everyone: []
    },
    deep: false,
    loading: false,
    item: [
      {
        key: t("TXT_CODE_2e5d3d0f"),
        role: "owner"
      },
      {
        key: t("TXT_CODE_e7b75c0e"),
        role: "usergroup"
      },
      {
        key: t("TXT_CODE_5c54f599"),
        role: "everyone"
      }
    ]
  });

  const changePermission = async (name: string, mode: number) => {
    permission.loading = true;
    permission.data = number2permission(mode);
    permission.loading = false;
    await openDialog(t("TXT_CODE_16853efe"), "", "", "permission", {
      maxWidth: "400px"
    });
    const { execute } = changePermissionApi();
    try {
      await execute({
        params: {
          daemonId: daemonId || "",
          uuid: instanceId || ""
        },
        data: {
          chmod: permission2number(
            permission.data.owner,
            permission.data.usergroup,
            permission.data.everyone
          ),
          deep: permission.deep,
          target: breadcrumbs[breadcrumbs.length - 1].path + name
        }
      });
      message.success(t("TXT_CODE_b05948d1"));
      await getFileList();
    } catch (err: any) {
      return reportErrorMsg(err.message);
    }
    permission.deep = false;
  };

  const currentDisk = ref(t("TXT_CODE_28124988"));

  const toDisk = async (disk: string) => {
    breadcrumbs.splice(0, breadcrumbs.length);
    breadcrumbs.push({
      path: disk === "/" ? disk : disk + ":\\",
      name: "/",
      disabled: false
    });
    spinning.value = true;
    operationForm.value.name = "";
    operationForm.value.current = 1;
    await getFileList();
    spinning.value = false;
  };

  const isImage = (extName: string) => {
    if (!extName) return;
    return ["JPG", "JPEG", "PNG", "GIF", "BMP", "WEBP", "ICO"].includes(extName.toUpperCase());
  };

  const showImage = (file: DataType) => {
    const frontDir = breadcrumbs[breadcrumbs.length - 1].path;
    useImageViewerDialog(instanceId || "", daemonId || "", file.name, frontDir);
  };

  return {
    fileStatus,
    dialog,
    spinning,
    operationForm,
    dataSource,
    breadcrumbs,
    permission,
    clipboard,
    selectedRowKeys,
    currentDisk,
    selectionData,
    selectChanged,
    isMultiple,
    openDialog,
    getFileList,
    touchFile,
    reloadList,
    setClipBoard,
    paste,
    resetName,
    deleteFile,
    zipFile,
    unzipFile,
    selectedFiles,
    rowClickTable,
    downloadFile,
    getFileLink,
    handleChangeDir,
    handleTableChange,
    handleSearchChange,
    getFileStatus,
    changePermission,
    toDisk,
    pushSelected,
    oneSelected,
    isImage,
    showImage
  };
};
