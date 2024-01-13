import { useMountComponent } from "@/hooks/useMountComponent";
import type { UserInstance } from "@/types/user";

import SelectInstances from "@/components/fc/SelectInstances.vue";
import CmdAssistantDialog from "@/components/fc/CmdAssistantDialog/index.vue";
import KvOptionsDialogVue from "@/components/fc/KvOptionsDialog.vue";
import { t } from "@/lang/i18n";
import type { AntColumnsType } from "@/types/ant";
import UploadFileDialogVue from "./UploadFileDialog.vue";

interface DockerConfigItem {
  host: string;
  container: string;
}
interface PortConfigItem extends DockerConfigItem {
  protocol: string;
}

export async function useUploadFileDialog() {
  return (await useMountComponent().mount<string>(UploadFileDialogVue)) || "";
}

export async function useSelectInstances(data: UserInstance[] = []) {
  return await useMountComponent({
    data,
    title: t("TXT_CODE_8145d25a"),
    columns: [
      {
        align: "center",
        title: t("TXT_CODE_f70badb9"),
        dataIndex: "nickname",
        key: "instanceUuid"
      },
      {
        align: "center",
        title: t("TXT_CODE_fe731dfc"),
        key: "operation"
      }
    ]
  }).mount<UserInstance[]>(SelectInstances);
}

export async function useCmdAssistantDialog() {
  return await useMountComponent().mount<string>(CmdAssistantDialog);
}

export async function usePortEditDialog(data: PortConfigItem[] = []) {
  return (
    (await useMountComponent({
      data,
      title: t("TXT_CODE_c4435af9"),
      columns: [
        {
          align: "center",
          dataIndex: "host",
          title: t("TXT_CODE_534db0b2")
        },
        {
          align: "center",
          dataIndex: "container",
          title: t("TXT_CODE_b729d2e")
        },
        {
          align: "center",
          dataIndex: "protocol",
          title: t("TXT_CODE_ad1c674c")
        }
      ] as AntColumnsType[]
    }).mount<PortConfigItem[]>(KvOptionsDialogVue)) || []
  );
}

export async function useVolumeEditDialog(data: DockerConfigItem[] = []) {
  return (
    (await useMountComponent({
      data,
      title: t("TXT_CODE_820ebc92"),
      columns: [
        {
          align: "center",
          dataIndex: "host",
          title: t("TXT_CODE_681aaeb9")
        },
        {
          align: "center",
          dataIndex: "container",
          title: t("TXT_CODE_30258325")
        }
      ] as AntColumnsType[]
    }).mount<DockerConfigItem[]>(KvOptionsDialogVue)) || []
  );
}
