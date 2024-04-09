import { message, Modal } from "ant-design-vue";
import type { UploadProps } from "ant-design-vue";
import type { Key } from "ant-design-vue/es/table/interface";
import { ref, createVNode, reactive, type VNodeRef, computed } from "vue";
import { ExclamationCircleOutlined } from "@ant-design/icons-vue";
import { parseForwardAddress } from "@/tools/protocol";
import { number2permission, permission2number } from "@/tools/permission";
import { t } from "@/lang/i18n";
import {
  fileList as getFileListApi,
  getFileStatus as getFileStatusApi,
  addFolder as addFolderApi,
  deleteFile as deleteFileApi,
  touchFile as touchFileApi,
  copyFile as copyFileApi,
  moveFile as moveFileApi,
  compressFile as compressFileApi,
  uploadAddress,
  uploadFile as uploadFileApi,
  downloadAddress,
  changePermission as changePermissionApi
} from "@/services/apis/fileManager";
import type {
  DataType,
  OperationForm,
  Breadcrumb,
  FileStatus,
  Permission
} from "@/types/fileManager";
import { reportErrorMsg } from "@/tools/validator";
import { openLoadingDialog } from "@/components/fc";

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

  const percentComplete = ref(0);

  const spinning = ref(false);

  const selectedFile = async (file: File) => {
    const { execute: uploadFile } = uploadFileApi();
    const { state: uploadCfg, execute: getUploadCfg } = uploadAddress();
    try {
      percentComplete.value = 1;
      await getUploadCfg({
        params: {
          upload_dir: breadcrumbs[breadcrumbs.length - 1].path,
          daemonId: daemonId!,
          uuid: instanceId!
        }
      });
      if (!uploadCfg.value) {
        percentComplete.value = 0;
        throw new Error(t("TXT_CODE_e8ce38c2"));
      }

      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      await uploadFile({
        data: uploadFormData,
        timeout: Number.MAX_VALUE,
        url: `${parseForwardAddress(uploadCfg.value.addr, "http")}/upload/${
          uploadCfg.value.password
        }`,
        onUploadProgress: (progressEvent: any) => {
          const p = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (p >= 1) percentComplete.value = p;
        }
      });
      await getFileList();
      percentComplete.value = 0;
      return message.success(t("TXT_CODE_773f36a0"));
    } catch (err: any) {
      console.error(err);
      percentComplete.value = 0;
      return reportErrorMsg(err.response?.data || err.message);
    }
  };

  const beforeUpload: UploadProps["beforeUpload"] = async (file) => {
    await selectedFile(file);
    return false;
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
      await getFileList(true);
    } catch (error: any) {
      breadcrumbs.splice(breadcrumbs.length - 1, 1);
      return reportErrorMsg(error.message);
    } finally {
      spinning.value = false;
    }
  };

  const downloadFile = async (fileName: string) => {
    const { state: downloadCfg, execute: getDownloadCfg } = downloadAddress();
    try {
      await getDownloadCfg({
        params: {
          file_name: breadcrumbs[breadcrumbs.length - 1].path + fileName,
          daemonId: daemonId!,
          uuid: instanceId!
        }
      });
      if (!downloadCfg.value) throw new Error(t("TXT_CODE_6d772765"));
      window.open(
        `${parseForwardAddress(downloadCfg.value.addr, "http")}/download/${
          downloadCfg.value.password
        }/${fileName}`
      );
    } catch (err: any) {
      console.error(err);
      return reportErrorMsg(err.message);
    }
  };

  const handleChangeDir = async (dir: string) => {
    if (breadcrumbs.findIndex((e) => e.path === dir) === -1)
      return reportErrorMsg(t("TXT_CODE_96281410"));
    spinning.value = true;
    breadcrumbs.splice(breadcrumbs.findIndex((e) => e.path === dir) + 1);
    operationForm.value.name = "";
    await getFileList();
    spinning.value = false;
  };

  const handleTableChange = (e: { current: number; pageSize: number }) => {
    selectedRowKeys.value = [];
    selectionData.value = [];
    operationForm.value.name = "";
    operationForm.value.current = e.current;
    operationForm.value.pageSize = e.pageSize;
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
      path: disk + ":\\",
      name: "/",
      disabled: false
    });
    spinning.value = true;
    operationForm.value.name = "";
    await getFileList();
    spinning.value = false;
  };

  return {
    fileStatus,
    dialog,
    percentComplete,
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
    beforeUpload,
    selectedFile,
    rowClickTable,
    downloadFile,
    handleChangeDir,
    handleTableChange,
    getFileStatus,
    changePermission,
    toDisk,
    pushSelected,
    oneSelected
  };
};
