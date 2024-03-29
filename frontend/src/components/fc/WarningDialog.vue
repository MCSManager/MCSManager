<script setup lang="ts">
import { ref } from "vue";
import type { MountComponent } from "@/types";
import { t } from "@/lang/i18n";

interface Props extends MountComponent {
  title: string;
  subTitle: string;
  checkText: string;
}

const props = defineProps<Props>();
const open = ref(false);
const checkbox = ref(false);
let resolve: Function;
let reject: Function;

const openDialog = () => {
  open.value = true;
  return new Promise<void>((y, n) => {
    resolve = y;
    reject = n;
  });
};

const cancel = () => {
  open.value = false;
  reject(new Error(t("TXT_CODE_1b7a8832")));
  if (props.destroyComponent) props.destroyComponent();
};

const confirm = () => {
  open.value = false;
  resolve();
  if (props.destroyComponent) props.destroyComponent();
};

defineExpose({
  cancel,
  confirm,
  openDialog
});
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    width="600px"
    title=""
    :mask-closable="false"
    :closable="false"
    :footer="null"
    @cancel="cancel"
  >
    <div class="dialog-overflow-container">
      <div class="flex flex-center">
        <div>
          <a-typography-paragraph>
            <a-typography-title :level="4">
              <div class="flex flex-center mb-24">
                {{ props.title }}
              </div>
            </a-typography-title>
            <a-typography-text>
              <div class="flex flex-center" style="gap: 10px">
                <pre>{{ props.subTitle }}</pre>
              </div>
            </a-typography-text>
          </a-typography-paragraph>
          <div class="justify-center mb-24">
            <a-checkbox v-model:checked="checkbox">{{ props.checkText }}</a-checkbox>
          </div>
          <div class="flex justify-center">
            <a-button class="mr-12" danger :disabled="!checkbox" @click="confirm">
              {{ t("TXT_CODE_d507abff") }}
            </a-button>
            <a-button @click="cancel">{{ t("TXT_CODE_a0451c97") }}</a-button>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>
