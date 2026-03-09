<script setup lang="ts">
import { ref, reactive, nextTick } from "vue";
import type { MountComponent } from "@/types";
import { t } from "@/lang/i18n";

import AppConfigProvider from "../AppConfigProvider.vue";
import { useInstanceTags, useInstanceTagTips } from "@/hooks/useInstanceTag";
import { reportErrorMsg } from "@/tools/validator";
import { message } from "ant-design-vue";
import { PlusOutlined } from "@ant-design/icons-vue";

interface Props extends MountComponent {
  instanceId: string;
  daemonId: string;
  tags: string[];
}

const props = defineProps<Props>();

const inputRef = ref();
const state = reactive({
  inputVisible: false,
  inputValue: ""
});

const { tagTips } = useInstanceTagTips();
const { removeTag, addTag, instanceTags, saveTags, saveLoading, instanceTagsTips } =
  useInstanceTags(props.instanceId, props.daemonId, props.tags, tagTips.value);

// eslint-disable-next-line no-unused-vars
let resolve: (tags: string[]) => void;
const open = ref(false);

const handleInputConfirm = () => {
  if (state.inputValue) {
    addTag(state.inputValue);
  }
  state.inputVisible = false;
  state.inputValue = "";
};

const showInput = () => {
  state.inputVisible = true;
  nextTick(() => {
    inputRef.value.focus();
  });
};

const cancel = async () => {
  open.value = false;
  resolve(instanceTags.value);
  if (props.destroyComponent) props.destroyComponent(1000);
};

const submit = async () => {
  try {
    await saveTags();
    message.success(t("TXT_CODE_a7907771"));
    await cancel();
  } catch (error) {
    reportErrorMsg(error);
  }
};

const openDialog = () => {
  open.value = true;
  return new Promise<string[]>((_resolve) => {
    resolve = _resolve;
  });
};

defineExpose({ openDialog });
</script>

<template>
  <AppConfigProvider>
    <a-modal
      v-model:open="open"
      :title="t('TXT_CODE_a2544278')"
      centered
      :confirm-loading="saveLoading"
      @ok="submit"
      @cancel="cancel"
    >
      <div class="dialog-overflow-container">
        <div class="flex direction-column">
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{ t("TXT_CODE_f84ae54f") }}
            </a-typography-text>
          </a-typography-paragraph>
          <div>
            <a-typography-paragraph>
              <a-typography-text>
                {{ t("TXT_CODE_2c1337d") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("TXT_CODE_e26d53d5") }}
              </a-typography-text>
            </a-typography-paragraph>
            <div class="tag-container">
              <a-tag
                v-for="tag in instanceTags"
                :key="tag"
                class="m-4 my-tag"
                color="blue"
                closable
                @close="() => removeTag(tag)"
              >
                {{ tag }}
              </a-tag>
              <a-input
                v-if="state.inputVisible"
                ref="inputRef"
                v-model:value="state.inputValue"
                type="text"
                size="small"
                :style="{ width: '82px' }"
                class="m-4"
                @blur="handleInputConfirm"
                @keyup.enter="handleInputConfirm"
              />
              <a-tag v-else class="m-4 my-tag" style="border-style: dashed" @click="showInput">
                <plus-outlined />
                {{ t("TXT_CODE_3dd66d98") }}
              </a-tag>
            </div>
          </div>

          <div v-if="instanceTagsTips?.length > 0" class="mt-20">
            <a-typography-paragraph>
              <a-typography-text>
                {{ t("TXT_CODE_67d1ea21") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("TXT_CODE_3ecee271") }}
              </a-typography-text>
            </a-typography-paragraph>
            <div class="tag-container">
              <a-tag
                v-for="tag in instanceTagsTips"
                :key="tag"
                class="m-4 my-tag tag-option"
                @click="addTag(tag)"
              >
                {{ tag }}
              </a-tag>
            </div>
          </div>
        </div>
      </div>
    </a-modal>
  </AppConfigProvider>
</template>

<style lang="scss" scoped>
.tag-container {
  margin-left: -4px;
  margin-right: -4px;
}

.group-name-tag {
  height: 26px;
  line-height: 24px;
}

.tag-option {
  cursor: pointer;
}
</style>
