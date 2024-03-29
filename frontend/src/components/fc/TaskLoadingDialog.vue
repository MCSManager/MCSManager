<script setup lang="ts">
import { ref } from "vue";
import type { MountComponent } from "@/types";
import { LoadingOutlined } from "@ant-design/icons-vue";

interface Props extends MountComponent {
  title: string;
  text: string;
  subTitle?: string;
}

const props = defineProps<Props>();

const open = ref(true);

const cancel = async () => {
  open.value = false;
  if (props.destroyComponent) props.destroyComponent();
};

defineExpose({
  cancel
});
</script>

<template>
  <a-modal
    v-model:open="open"
    centered
    width="600px"
    :title="props.title"
    :mask-closable="false"
    :closable="false"
    :footer="null"
    @cancel="cancel"
  >
    <div class="dialog-overflow-container">
      <div class="flex flex-center">
        <div>
          <a-typography-paragraph>
            <a-typography-title :level="5">
              <div class="flex flex-center mb-20">
                <LoadingOutlined style="font-size: 60px" />
              </div>
              <div class="flex flex-center" style="gap: 10px">
                {{ props.text }}
              </div>
            </a-typography-title>
            <a-typography-text v-if="props.subTitle">
              <div
                class="flex-center"
                style="font-size: 12px; opacity: 0.8; max-width: 300px; text-align: center"
              >
                {{ props.subTitle }}
              </div>
            </a-typography-text>
          </a-typography-paragraph>
        </div>
      </div>
    </div>
  </a-modal>
</template>
