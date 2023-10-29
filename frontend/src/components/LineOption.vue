<!-- eslint-disable vue/no-mutating-props -->
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { t } from "@/lang/i18n";
import { EditOutlined } from "@ant-design/icons-vue";

const props = defineProps<{
  optionValue?: { [key: string]: any };
  optionKey?: any;
  custom?: boolean;
}>();

const value = ref();
const key = ref();
const type = ref(0);

const valueType = (value: string) => {
  if (typeof value === "object") return -1;
  if (typeof value === "boolean") return 1;
  if (typeof value === "number") return 2;
  return 0;
};

const forceType = () => {
  if (type.value >= 2) return (type.value = 1);
  type.value = type.value + 1;
};

onMounted(() => {
  if (props.custom) return;
  if (props.optionValue) value.value = props.optionValue;
  if (props.optionKey) key.value = props.optionKey;

  if (valueType(value.value[key.value]) == 1) {
    type.value = 1;
  }
  if (valueType(value.value[key.value]) != 1) {
    type.value = 2;
  }
});
</script>

<template>
  <div class="line-option-wrapper">
    <a-card :body-style="{ padding: '10px' }">
      <div v-if="!custom">
        <a-row :gutter="20" align="middle" :wrap="true">
          <a-col :sm="7">
            <slot name="title"></slot>
          </a-col>
          <a-col :sm="11">
            <slot name="info"></slot>
          </a-col>
          <a-col :sm="6">
            <div v-if="$slots.optionInput">
              <slot name="optionInput"></slot>
            </div>
            <div v-else class="flex">
              <a-input v-if="type == 2" v-model:value="value[key]" />
              <a-select
                v-if="type == 1"
                v-model:value="value[key]"
                style="width: 100%"
                :placeholder="t('未选择')"
              >
                <a-select-option :value="true">{{ t("是") }}</a-select-option>
                <a-select-option :value="false">{{ t("否") }}</a-select-option>
              </a-select>
              <a-button v-if="type == 1" @click="forceType"><EditOutlined /></a-button>
            </div>
          </a-col>
        </a-row>
      </div>
      <div v-else>
        <slot></slot>
      </div>
    </a-card>
  </div>
</template>

<style lang="scss" scoped>
.line-option-wrapper {
  width: 100%;
  margin-bottom: 4px;
}
</style>
