<script setup lang="ts">
import { t } from "@/lang/i18n";
import type { AddJavaConfigItem } from "@/types/javaManager";
import { ref } from "vue";
import type { MountComponent } from "../../types/index";

const props = defineProps<MountComponent>();
const dataSource = ref<AddJavaConfigItem>({
  name: "",
  path: ""
});

const open = ref(true);

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
    :title="t('TXT_CODE_8900e7ee')"
    :closable="false"
    :destroy-on-close="true"
    @cancel="cancel"
    @ok="submit"
  >
    <a-form layout="vertical">
      <a-form-item :label="t('TXT_CODE_3f36206f')">
        <a-input v-model:value="dataSource.name" :placeholder="t('TXT_CODE_4ea93630')" />
      </a-form-item>
      <a-form-item :label="t('TXT_CODE_43422ed3')">
        <a-input v-model:value="dataSource.path" :placeholder="t('TXT_CODE_4ea93630')" />
      </a-form-item>
    </a-form>

    <template #footer>
      <a-button @click="cancel">{{ t("TXT_CODE_a0451c97") }}</a-button>
      <a-button type="primary" @click="submit">{{ t("TXT_CODE_d507abff") }}</a-button>
    </template>
  </a-modal>
</template>
