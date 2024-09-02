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
    message.success(t("保存成功"));
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
      :title="t('实例标签')"
      centered
      :confirm-loading="saveLoading"
      @ok="submit"
      @cancel="cancel"
    >
      <div class="dialog-overflow-container">
        <div class="flex direction-column">
          <a-typography-paragraph>
            <a-typography-text type="secondary">
              {{
                t(
                  "实例拥有标签之后，MCSManager 在显示这些实例时，将自动按照标签名字对实例进行分类供用户筛选，标签名字支持任何语言。"
                )
              }}
            </a-typography-text>
          </a-typography-paragraph>
          <div>
            <a-typography-paragraph>
              <a-typography-text>
                {{ t("此实例的标签列表") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{ t("请勿创建过多新标签，这可能会导致界面上元素混乱和面板性能下降。") }}
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
                {{ t("新标签") }}
              </a-tag>
            </div>
          </div>

          <div v-if="instanceTagsTips?.length > 0" class="mt-20">
            <a-typography-paragraph>
              <a-typography-text>
                {{ t("部分可选标签") }}
              </a-typography-text>
            </a-typography-paragraph>
            <a-typography-paragraph>
              <a-typography-text type="secondary">
                {{
                  t(
                    "这些可选择的标签由当前页实例列表计算而来，并不包含所有已存在的标签，此处最多展示 30 个"
                  )
                }}
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

.my-tag {
  height: 26px;
  line-height: 24px;
}

.tag-option {
  cursor: pointer;
}
</style>
