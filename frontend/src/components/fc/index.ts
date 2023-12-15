import { useMountComponent } from "@/hooks/useMountComponent";
import type { UserInstance } from "@/types/user";

import SelectInstances from "@/components/fc/SelectInstances.vue";
import CmdAssistantDialog from "@/components/fc/CmdAssistantDialog/index.vue";

export async function useSelectInstances() {
  return await useMountComponent().mount<UserInstance[]>(SelectInstances);
}

export async function useCmdAssistantDialog() {
  return await useMountComponent().mount<string>(CmdAssistantDialog);
}
