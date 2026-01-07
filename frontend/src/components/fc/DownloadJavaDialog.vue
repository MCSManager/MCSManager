<script setup lang="ts">
import { t } from "@/lang/i18n";
import type { DownloadJavaConfigItem } from "@/types/javaManager";
import { computed, ref } from "vue";
import type { MountComponent } from "../../types/index";

const props = defineProps<MountComponent>();
const dataSource = ref<DownloadJavaConfigItem>({
  name: "",
  version: ""
});

const open = ref(true);
const JAVA_LIST = [
  {
    name: "zulu",
    version: ["8", "11", "15", "17", "21", "25"]
  }
];

const javaVersions = computed(() => {
  const selected = JAVA_LIST.find((item) => item.name === dataSource.value.name);
  return selected ? selected.version : [];
});

const cancel = async () => {
  open.value = false;
  if (props.destroyComponent) props.destroyComponent();
};

const submit = async () => {
  props.emitResult(dataSource.value);
  await cancel();
};
</script>

<template>
  <a-modal
    v-model:open="open"
    width="400px"
    centered
    :title="t('下载Java环境')"
    :closable="false"
    :destroy-on-close="true"
    @cancel="cancel"
    @ok="submit"
  >
    <a-form layout="vertical">
      <a-form-item :label="t('Java 类型')">
        <a-select v-model:value="dataSource.name">
          <a-select-option v-for="java in JAVA_LIST" :key="java.name" :value="java.name">
            {{ java.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item :label="t('Java 版本')">
        <a-select v-model:value="dataSource.version" :disabled="!dataSource.name">
          <a-select-option v-for="version in javaVersions" :key="version" :value="version">
            {{ version }}
          </a-select-option>
        </a-select>
      </a-form-item>
    </a-form>

    <template #footer>
      <a-button @click="cancel">{{ t("TXT_CODE_a0451c97") }}</a-button>
      <a-button type="primary" @click="submit">{{ t("TXT_CODE_d507abff") }}</a-button>
    </template>
  </a-modal>
</template>
