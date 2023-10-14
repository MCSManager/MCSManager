import { h, type Ref } from "vue";

import {
  // DownOutlined,
  // SearchOutlined,
  LoadingOutlined
  // ExclamationCircleOutlined,
  // UploadOutlined
} from "@ant-design/icons-vue";

import {
  getFileList as getFileListApi
  // getFileStatus as getFileStatusApi,
  // addFolder as addFolderApi,
  // deleteFile as deleteFileApi,
  // touchFile as touchFileApi,
  // copyFile as copyFileApi,
  // moveFile as moveFileApi,
  // compressFile as compressFileApi,
  // uploadAddress,
  // uploadFile as uploadFileApi,
  // downloadAddress
} from "@/services/apis/fileManager";

import { message } from "ant-design-vue";

import type { DataType, OperationForm, Breadcrumb } from "@/types/fileManager";

export const useFileManager = (instanceId: string | undefined, daemonId: string | undefined) => {
  const indicator = h(LoadingOutlined, {
    style: {
      fontSize: "24px"
    }
  });

  const getFileListHook = async (
    operationForm: Ref<OperationForm>,
    breadcrumbs: Breadcrumb[],
    dataSource: Ref<DataType[] | undefined>
  ) => {
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

  return {
    indicator,
    getFileListHook
  };
};
