import { useMountComponent } from "@/hooks/useMountComponent";
import type { UserInstance } from "@/types/user";

import SelectInstances from "@/components/fc/SelectInstances.vue";
import CmdAssistantDialog from "@/components/fc/CmdAssistantDialog/index.vue";
import KvOptionsDialogVue from "@/components/fc/KvOptionsDialog.vue";
import { t } from "@/lang/i18n";
import type { AntColumnsType } from "@/types/ant";
import UploadFileDialogVue from "./UploadFileDialog.vue";
import TaskLoadingDialog from "./TaskLoadingDialog.vue";

interface DockerConfigItem {
  host: string;
  container: string;
}
interface PortConfigItem extends DockerConfigItem {
  protocol: string;
}

interface DockerEnvItem {
  label: string;
  value: string;
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
        title: t("TXT_CODE_5def0cbe"),
        key: "safe"
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

export async function useDockerEnvEditDialog(data: DockerEnvItem[] = []) {
  return (
    (await useMountComponent({
      data,
      title: t("TXT_CODE_90a9d317"),
      columns: [
        {
          align: "center",
          dataIndex: "label",
          title: t("TXT_CODE_a42984e")
        },
        {
          align: "center",
          dataIndex: "value",
          title: t("TXT_CODE_115e8a25")
        }
      ] as AntColumnsType[]
    }).mount<DockerEnvItem[]>(KvOptionsDialogVue)) || []
  );
}

export async function openLoadingDialog(title: string, text: string, subTitle?: string) {
  const component = (
    await useMountComponent({
      title,
      text,
      subTitle
    })
  ).load<InstanceType<typeof TaskLoadingDialog>>(TaskLoadingDialog);
  return component;
}
