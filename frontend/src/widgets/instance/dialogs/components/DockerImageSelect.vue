<script setup lang="ts">
import { useAppRouters } from "@/hooks/useAppRouters";
import { t } from "@/lang/i18n";
import { imageList } from "@/services/apis/envImage";
import { arrayFilter } from "@/tools/array";
import type { DefaultOptionType } from "ant-design-vue/es/select";
import { ref } from "vue";

const IMAGE_DEFINE = {
  NEW: "__MCSM_NEW_IMAGE__",
  EDIT: "__MCSM_EDIT_IMAGE__"
};

const props = defineProps<{
  modelValue: string;
  daemonId?: string;
  isAllowEmpty?: boolean;
  isAllowText?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:imageSelectMethod": [value: "SELECT" | "EDIT"];
}>();

const imageSelectMethod = ref<"SELECT" | "EDIT">("SELECT");
const { toPage } = useAppRouters();
const dockerImages = ref<{ label: string; value: string }[]>([]);
const loading = ref(false);
const { execute: getImageList } = imageList();

const loadImages = async () => {
  loading.value = true;
  dockerImages.value = arrayFilter([
    {
      label: props.isAllowText ?? t("TXT_CODE_79d4205"),
      value: "",
      condition: () => props.isAllowEmpty
    },
    {
      label: t("TXT_CODE_435f4975"),
      value: IMAGE_DEFINE.EDIT
    }
  ]);

  try {
    const images = await getImageList({
      params: {
        daemonId: props.daemonId ?? ""
      },
      method: "GET"
    });

    if (images.value) {
      for (const iterator of images.value) {
        const repoTags = iterator?.RepoTags?.[0];
        if (repoTags)
          dockerImages.value.push({
            label: repoTags,
            value: repoTags
          });
      }
    }
  } catch {
    // ignore
  } finally {
    loading.value = false;
  }
};

const selectImage = (row: DefaultOptionType) => {
  const image = row.value;
  if (typeof image === "string" && image === IMAGE_DEFINE.NEW) {
    toPage({
      path: `/node/image?daemonId=${props.daemonId}`
    });
    return;
  }
  if (image === IMAGE_DEFINE.EDIT) {
    emit("update:modelValue", "");
    emit("update:imageSelectMethod", "EDIT");
    imageSelectMethod.value = "EDIT";
  }
};
</script>

<template>
  <template v-if="imageSelectMethod === 'SELECT'">
    <a-select
      :value="modelValue"
      size="large"
      style="width: 100%"
      :placeholder="t('TXT_CODE_3bb646e4')"
      :loading="loading"
      @focus="loadImages"
      @update:value="(v: any) => emit('update:modelValue', v)"
      @change="(_e, option: DefaultOptionType) => selectImage(option)"
    >
      <a-select-option v-for="item in dockerImages" :key="item.value" :value="item.value">
        {{ item.label }}
      </a-select-option>
    </a-select>
  </template>

  <template v-else>
    <a-input
      :value="modelValue"
      :placeholder="t('TXT_CODE_d7638d7b')"
      @update:value="(v: string) => emit('update:modelValue', v)"
    />
  </template>
</template>
