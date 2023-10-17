import { h, ref, createVNode, type Ref, reactive } from "vue";
import { t } from "@/lang/i18n";
import type { TableProps, UploadProps } from "ant-design-vue";

import { LoadingOutlined, ExclamationCircleOutlined } from "@ant-design/icons-vue";

import { parseForwardAddress } from "@/tools/protocol";
import { number2permission, permission2number } from "@/tools/permission";
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

import { message, Modal } from "ant-design-vue";

import type {
  DataType,
  OperationForm,
  Breadcrumb,
  FileStatus,
  Permission
} from "@/types/fileManager";

export const useFileManager = (
  operationForm: Ref<OperationForm>,
  breadcrumbs: Breadcrumb[],
  dataSource: Ref<DataType[] | undefined>,
  clipboard: Ref<
    | {
        type: "copy" | "move";
        value: string[];
      }
    | undefined
  >,
  selectionData: Ref<DataType[] | undefined>,
  instanceId?: string,
  daemonId?: string
) => {
  const indicator = h(LoadingOutlined, {
    style: {
      fontSize: "24px"
    }
  });

  const fileStatus = ref<FileStatus>();

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
    },
    style: {}
  });

  const openDialog = (
    title: string,
    info: string,
    defaultvalue?: string,
    mode?: string,
    style?: object
  ): Promise<string> => {
    dialog.value.style = style || {};
    dialog.value.value = defaultvalue || "";
    dialog.value.mode = mode || "";

    dialog.value.title = title;
    dialog.value.info = info;
    dialog.value.show = true;

    dialog.value?.ref?.focus();

    return new Promise((resolve) => {
      dialog.value.ok = () => {
        if (
          dialog.value.value == "" &&
          dialog.value.mode != "unzip" &&
          dialog.value.mode != "permission"
        ) {
          return message.error(t("请输入内容"));
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

  const percentComplete = ref(0);

  const spinning = ref(false);

  const selectedFile = async (file: File) => {
    const { execute: uploadFile } = uploadFileApi();
    const { state: uploadCfg, execute: getUploadCfg } = uploadAddress();
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

  const beforeUpload: UploadProps["beforeUpload"] = async (file) => {
    await selectedFile(file);
    return false;
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

  const downloadFile = async (fileName: string) => {
    const { state: downloadCfg, execute: getDownloadCfg } = downloadAddress();
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

  const handleTableChange = (e: { current: number; pageSize: number }) => {
    operationForm.value.current = e.current;
    operationForm.value.pageSize = e.pageSize;
    getFileList();
  };

  const getFileStatus = async () => {
    const { state, execute } = getFileStatusApi();
    try {
      await execute({
        params: {
          remote_uuid: daemonId || "",
          uuid: instanceId || ""
        }
      });
      if (state.value) {
        fileStatus.value = state.value;
      }
    } catch (err: any) {
      console.error(err);
      return message.error(err.message);
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
        key: t("所有者"),
        role: "owner"
      },
      {
        key: t("用户组"),
        role: "usergroup"
      },
      {
        key: t("任何人"),
        role: "everyone"
      }
    ]
  });
  const changePermission = async (name: string, mode: number) => {
    permission.loading = true;
    permission.data = number2permission(mode);
    permission.loading = false;
    await openDialog(t("更改权限"), "", "", "permission", {
      maxWidth: "450px"
    });
    const { execute } = changePermissionApi();
    try {
      await execute({
        params: {
          remote_uuid: daemonId || "",
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
      message.success(t("更改权限成功"));
      await getFileList();
    } catch (err: any) {
      return message.error(err.message);
    }
    permission.deep = false;
  };

  return {
    fileStatus,
    indicator,
    dialog,
    percentComplete,
    spinning,
    rowSelection,
    permission,
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
    changePermission
  };
};
