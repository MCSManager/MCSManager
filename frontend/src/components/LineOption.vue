<!-- eslint-disable vue/no-mutating-props -->
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { t } from "@/lang/i18n";
import { EditOutlined } from "@ant-design/icons-vue";

const props = defineProps<{
  optionValue?: Record<string, any>;
  optionKey?: any;
  custom?: boolean;
}>();

enum CONTROL {
  SELECT = 1,
  INPUT = 2
}

const value = ref<Record<string, any>>({});
const key = ref();
const type = ref(2);

const valueType = computed(() => {
  if (typeof value.value[key.value] === "boolean") {
    return CONTROL.SELECT;
  }
  return CONTROL.INPUT;
});

const forceType = () => {
  if (type.value >= 2) return (type.value = 1);
  type.value = type.value + 1;
};

onMounted(() => {
  if (props.custom) return;
  if (props.optionValue) value.value = props.optionValue;
  if (props.optionKey) key.value = props.optionKey;
  type.value = valueType.value;
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
              <a-input v-if="type == CONTROL.INPUT" v-model:value="value[key]" />
              <a-select
                v-if="type == CONTROL.SELECT"
                v-model:value="value[key]"
                style="width: 100%"
                :placeholder="t('TXT_CODE_fe3f34e6')"
              >
                <a-select-option :value="true">{{ t("TXT_CODE_addfcb6b") }}</a-select-option>
                <a-select-option :value="false">{{ t("TXT_CODE_1e9c479e") }}</a-select-option>
              </a-select>
              <a-button v-if="type == CONTROL.SELECT" class="ml-8" @click="forceType">
                <EditOutlined />
              </a-button>
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
