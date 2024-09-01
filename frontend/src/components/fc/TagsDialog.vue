<!-- eslint-disable vue/attributes-order -->
C
<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { MountComponent } from "@/types";
import { t } from "@/lang/i18n";
import _ from "lodash";
import AppConfigProvider from "../AppConfigProvider.vue";

interface Props extends MountComponent {
  instanceId: string;
  tags: string[];
}

const props = defineProps<Props>();

const open = ref(false);

const cancel = async () => {
  open.value = false;
  if (props.destroyComponent) props.destroyComponent(1000);
};

const submit = async () => {
  await cancel();
};

onMounted(async () => {
  open.value = true;
});
</script>

<template>
  <AppConfigProvider>
    <a-modal v-model:open="open" :title="t('实例标签')" centered @ok="submit" @cancel="cancel">
      <div class="dialog-overflow-container">
        <div class="flex flex-center">
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("实例拥有标签之后，MCSManager 将自动按照相同标签对实例进行分类。") }}
            </a-typography-text>
          </a-typography-paragraph>
        </div>
      </div>
    </a-modal>
  </AppConfigProvider>
</template>
