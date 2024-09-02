import _ from "lodash";
import { computed, ref } from "vue";
import { updateInstanceConfig } from "@/services/apis/instance";
import { arrayUnique } from "@/tools/array";
import type { InstanceDetail } from "@/types";
import { createGlobalState } from "@vueuse/core";

export function useInstanceTags(
  instanceId: string,
  daemonId: string,
  tags: string[],
  tagsTips?: string[]
) {
  const instanceTags = ref<string[]>(_.cloneDeep(tags));
  const instanceTagsTips = computed(() => {
    if (tagsTips) {
      const tmp = tagsTips.filter((tag) => !_.includes(instanceTags.value, tag));
      return arrayUnique(tmp)
        .slice(0, 20)
        .sort((a, b) => (a > b ? 1 : -1));
    }
    return [];
  });
  const { execute, isLoading } = updateInstanceConfig();

  const removeTag = (tag: string) => {
    tag = tag.trim();
    instanceTags.value.splice(tags.indexOf(tag), 1);
  };

  const addTag = (tag: string) => {
    tag = tag.trim();
    if (!_.includes(instanceTags.value, tag)) {
      instanceTags.value.push(tag);
    }
  };

  const saveTags = async () => {
    return await execute({
      params: {
        uuid: instanceId,
        daemonId: daemonId
      },
      data: {
        tag: instanceTags.value
      }
    });
  };

  return {
    removeTag,
    addTag,
    saveTags,
    instanceTags,
    instanceTagsTips,
    saveLoading: isLoading
  };
}

export const useInstanceTagTips = createGlobalState(() => {
  const tags = ref<string[]>([]);
  const updateTagTips = (instances: InstanceDetail[]) => {
    instances.forEach((instance) => {
      tags.value = arrayUnique(tags.value.concat(instance?.config?.tag || []));
    });
  };

  return {
    tagTips: tags,
    updateTagTips
  };
});
