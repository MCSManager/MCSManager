import { useMountComponent } from "@/hooks/useMountComponent";
import type { UserInstance } from "@/types/user";

import CmdAssistantDialog from "@/components/fc/CmdAssistantDialog/index.vue";
import KvOptionsDialogVue from "@/components/fc/KvOptionsDialog.vue";
import SelectInstances from "@/components/fc/SelectInstances.vue";
import { t } from "@/lang/i18n";
import type { AntColumnsType } from "@/types/ant";
import type { DownloadFileConfigItem } from "@/types/fileManager";
import type { AddJavaConfigItem, DownloadJavaConfigItem } from "@/types/javaManager";
import DeleteInstanceDialog from "@/widgets/instance/dialogs/DeleteInstanceDialog.vue";
import ImageViewerDialog from "@/widgets/instance/dialogs/ImageViewer.vue";
import MarketDialog from "@/widgets/instance/dialogs/MarketDialog.vue";
import AddJavaDialog from "./AddJavaDialog.vue";
import DockerCapabilityDialogVue from "./DockerCapabilityDialog.vue";
import DockerDeviceDialogVue from "./DockerDeviceDialog.vue";
import DockerPortDialog from "./DockerPortDialog.vue";
import DownloadFileDialogVue from "./DownloadFileDialog.vue";
import DownloadJavaDialog from "./DownloadJavaDialog.vue";
import NodeSelectDialog from "./NodeSelectDialog.vue";
import RenewalDialog from "./RenewalDialog.vue";
import TagsDialog from "./TagsDialog.vue";
import TaskLoadingDialog from "./TaskLoadingDialog.vue";
import UploadFileDialogVue from "./UploadFileDialog.vue";

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

interface DockerLabelItem {
  label: string;
  value: string;
}

interface DockerCapabilityItem {
  label: string;
  value: string;
}

interface DockerDeviceItem {
  PathOnHost: string;
  PathInContainer: string;
  CgroupPermissions: string;
}

export async function useDownloadFileDialog() {
  return (
    (await useMountComponent().mount<DownloadFileConfigItem>(DownloadFileDialogVue)) || undefined
  );
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
      textarea: false
    }).mount<PortConfigItem[]>(DockerPortDialog)) || []
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

export async function useDockerLabelEditDialog(data: DockerLabelItem[] = []) {
  return (
    (await useMountComponent({
      data,
      title: t("TXT_CODE_g1c43s2h"),
      subTitle: t("TXT_CODE_MimBB1Ea"),
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
    }).mount<DockerLabelItem[]>(KvOptionsDialogVue)) || []
  );
}

export async function useDockerCapabilityEditDialog(data: DockerCapabilityItem[] = []) {
  return (
    (await useMountComponent({
      data,
      title: t("TXT_CODE_bbbd4133"),
      subTitle: t("TXT_CODE_377319df"),
      textarea: false
    }).mount<DockerCapabilityItem[]>(DockerCapabilityDialogVue)) || []
  );
}

export async function useDockerDeviceEditDialog(data: DockerDeviceItem[] = []) {
  return (
    (await useMountComponent({
      data,
      title: t("TXT_CODE_b3a60c78"),
      subTitle: t("TXT_CODE_b6e18b87"),
      textarea: false
    }).mount<DockerDeviceItem[]>(DockerDeviceDialogVue)) || []
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

export async function openRenewalDialog(instanceId: string, daemonId: string, productId: number) {
  return useMountComponent({ instanceId, daemonId, productId })
    .load<InstanceType<typeof RenewalDialog>>(RenewalDialog)
    .openDialog();
}

export async function openNodeSelectDialog(targetPlatforms?: string[]) {
  const dialog = useMountComponent({ targetPlatforms }).load<InstanceType<typeof NodeSelectDialog>>(
    NodeSelectDialog
  );
  return dialog!.openDialog();
}

export interface OpenMarketDialogProps {
  daemonId?: string;
  instanceId?: string;
  autoInstall?: boolean;
  btnText?: string;
  dialogTitle?: string;
  showCustomBtn?: boolean;
  onlyDockerTemplate?: boolean;
}

export async function openMarketDialog(
  daemonId?: string,
  instanceId?: string,
  options: OpenMarketDialogProps = {}
) {
  const dialog = useMountComponent({
    daemonId,
    instanceId,
    ...options
  }).load<InstanceType<typeof MarketDialog>>(MarketDialog);
  return dialog!.openDialog();
}

export async function useAddJavaDialog() {
  return (await useMountComponent().mount<AddJavaConfigItem>(AddJavaDialog)) || undefined;
}

export async function useDownloadJavaDialog(installedJavaList?: string[]) {
  return (
    (await useMountComponent({ installedJavaList }).mount<DownloadJavaConfigItem>(
      DownloadJavaDialog
    )) || undefined
  );
}
