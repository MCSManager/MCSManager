import { useMountComponent } from "./useMountComponent";
import SelectInstances from "@/components/SelectInstances.vue";
import type { UserInstance } from "@/types/user";

export function useSelectInstances() {
  const { mount } = useMountComponent();
  return mount<UserInstance[]>(SelectInstances);
}
