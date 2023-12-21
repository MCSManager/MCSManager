import { useMountComponent } from "@/hooks/useMountComponent";
import type { UserInstance } from "@/types/user";

import SelectInstances from "@/components/fc/SelectInstances.vue";
import CmdAssistantDialog from "@/components/fc/CmdAssistantDialog/index.vue";
import KvOptionsDialogVue from "@/components/fc/KvOptionsDialog.vue";
import { t } from "@/lang/i18n";
import type { AntColumnsType } from "@/types/ant";

interface DockerConfigItem {
  host: string;
  container: string;
}
interface PortConfigItem extends DockerConfigItem {
  protocol: string;
}

export async function useSelectInstances() {
  return await useMountComponent().mount<UserInstance[]>(SelectInstances);
}

export async function useCmdAssistantDialog() {
  return await useMountComponent().mount<string>(CmdAssistantDialog);
}

export async function usePortEditDialog(data: PortConfigItem[] = []) {
  return (
    (await useMountComponent({
      data,
      title: t("容器端口映射配置"),
      columns: [
        {
          align: "center",
          dataIndex: "host",
          title: t("主机端口")
        },
        {
          align: "center",
          dataIndex: "container",
          title: t("容器端口")
        },
        {
          align: "center",
          dataIndex: "protocol",
          title: t("协议")
        }
      ] as AntColumnsType[]
    }).mount<PortConfigItem[]>(KvOptionsDialogVue)) || []
  );
}

export async function useVolumeEditDialog(data: DockerConfigItem[] = []) {
  return (
    (await useMountComponent({
      data,
      title: t("挂载目录到容器"),
      columns: [
        {
          align: "center",
          dataIndex: "host",
          title: t("主机目录")
        },
        {
          align: "center",
          dataIndex: "container",
          title: t("容器目录")
        }
      ] as AntColumnsType[]
    }).mount<DockerConfigItem[]>(KvOptionsDialogVue)) || []
  );
}
