import _ from "lodash";
import { computed, ref } from "vue";
import { updateInstanceConfig } from "@/services/apis/instance";
import { arrayUnique } from "@/tools/array";
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
        .slice(0, 30)
        .sort((a, b) => (a > b ? 1 : -1));
    }
    return [];
  });
  const { execute, isLoading } = updateInstanceConfig();

  const removeTag = (tag: string) => {
    tag = tag.trim();
    instanceTags.value.splice(
      instanceTags.value.findIndex((v) => v === tag),
      1
    );
  };

  const addTag = (tag: string) => {
    tag = tag.trim();
    if (!_.includes(instanceTags.value, tag)) {
      instanceTags.value.push(tag);
    }
    instanceTags.value = instanceTags.value.sort((a, b) => (a > b ? 1 : -1));
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
  const updateTagTips = (allTags: string[]) => {
    tags.value = allTags;
  };

  return {
    tagTips: tags,
    updateTagTips
  };
});

export function useInstanceTagSearch() {
  const tags = ref<string[]>([]);
  let searchFn: Function = () => {};

  const selectTag = (tag: string) => {
    tags.value.push(tag);
    searchFn();
  };

  const removeTag = (tag: string) => {
    tags.value = tags.value.filter((v) => v !== tag);
    searchFn();
  };

  const setRefreshFn = (fn: Function) => {
    searchFn = fn;
  };

  const isTagSelected = (tag: string) => {
    return _.includes(tags.value, tag);
  };

  const clearTags = () => {
    tags.value = [];
    searchFn();
  };

  return {
    tags,
    clearTags,
    selectTag,
    removeTag,
    setRefreshFn,
    isTagSelected
  };
}
