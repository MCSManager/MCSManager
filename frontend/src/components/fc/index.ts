import { useMountComponent } from "@/hooks/useMountComponent";
import type { UserInstance } from "@/types/user";

import SelectInstances from "@/components/fc/SelectInstances.vue";
import CmdAssistantDialog from "@/components/fc/CmdAssistantDialog/index.vue";
import KvOptionsDialogVue from "@/components/fc/KvOptionsDialog.vue";
import { t } from "@/lang/i18n";
import type { AntColumnsType } from "@/types/ant";
import UploadFileDialogVue from "./UploadFileDialog.vue";
import TaskLoadingDialog from "./TaskLoadingDialog.vue";
import TagsDialog from "./TagsDialog.vue";
import DeleteInstanceDialog from "@/widgets/instance/dialogs/DeleteInstanceDialog.vue";
import ImageViewerDialog from "@/widgets/instance/dialogs/ImageViewer.vue";

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
          title: t("TXT_CODE_534db0b2"),
          placeholder: "eg: 8080"
        },
        {
          align: "center",
          dataIndex: "container",
          title: t("TXT_CODE_b729d2e"),
          placeholder: "eg: 25565"
        },
        {
          align: "center",
          dataIndex: "protocol",
          title: t("TXT_CODE_ad1c674c"),
          placeholder: "tcp/udp"
        }
      ] as AntColumnsType[],
      textarea: false
    }).mount<PortConfigItem[]>(KvOptionsDialogVue)) || []
  );
}

export async function useVolumeEditDialog(data: DockerConfigItem[] = []) {
  return (
    (await useMountComponent({
      data,
      subTitle: t("TXT_CODE_6c232c9c"),
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
      ] as AntColumnsType[],
      textarea: true
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
      ] as AntColumnsType[],
      textarea: true
    }).mount<DockerEnvItem[]>(KvOptionsDialogVue)) || []
  );
}

export async function openLoadingDialog(title: string, text: string, subTitle?: string) {
  const component = useMountComponent({
    title,
    text,
    subTitle
  }).load<InstanceType<typeof TaskLoadingDialog>>(TaskLoadingDialog);
  return component;
}

export async function openInstanceTagsEditor(
  instanceId: string,
  daemonId: string,
  tags: string[],
  tagsTips?: string[]
) {
  return await useMountComponent({
    instanceId,
    daemonId,
    tagsTips,
    tags
  })
    .load<InstanceType<typeof TagsDialog>>(TagsDialog)
    .openDialog();
}

export async function useDeleteInstanceDialog(instanceId: string, daemonId: string) {
  return await useMountComponent({ instanceId, daemonId }).mount<boolean>(DeleteInstanceDialog);
}

export async function useImageViewerDialog(
  instanceId: string,
  daemonId: string,
  fileName: string,
  frontDir: string
) {
  return await useMountComponent({ instanceId, daemonId, fileName, frontDir }).mount(
    ImageViewerDialog
  );
}
