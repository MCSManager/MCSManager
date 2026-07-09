<script setup lang="ts">
import { t } from "@/lang/i18n";
import { EditOutlined } from "@ant-design/icons-vue";
import { computed, onMounted, ref } from "vue";
import type { ConfigField } from "@/config/instanceConfigMap";

const LONG_MAGIC_PREFIX = "<__long__>";
const FLOAT_MAGIC_PREFIX = "<__float__>";
const PALWORLD_QUOTED_PREFIX = "<__palworld_quoted__>";
const PALWORLD_RAW_PREFIX = "<__palworld_raw__>";
const props = defineProps<{
  optionValue?: Record<string, any>;
  optionKey?: any;
  custom?: boolean;
  field?: ConfigField;
}>();

enum CONTROL {
  SELECT = 1,
  INPUT = 2
}

const value = ref<Record<string, any>>({});
const key = ref();
const type = ref(2);

const computedValue = computed({
  get: () => {
    const v = value.value[key.value];
    if (typeof v === "string") {
      if (v.startsWith(LONG_MAGIC_PREFIX)) {
        return v.replace(LONG_MAGIC_PREFIX, "");
      } else if (v.startsWith(FLOAT_MAGIC_PREFIX)) {
        return v.replace(FLOAT_MAGIC_PREFIX, "");
      } else if (v.startsWith(PALWORLD_QUOTED_PREFIX)) {
        return v.replace(PALWORLD_QUOTED_PREFIX, "");
      } else if (v.startsWith(PALWORLD_RAW_PREFIX)) {
        return v.replace(PALWORLD_RAW_PREFIX, "");
      }
    }
    return v;
  },
  set: (v) => {
    const preValue = value.value[key.value];
    if (typeof preValue === "string") {
      if (preValue.startsWith(LONG_MAGIC_PREFIX)) {
        value.value[key.value] = `${LONG_MAGIC_PREFIX}${v}`;
        return;
      } else if (preValue.startsWith(FLOAT_MAGIC_PREFIX)) {
        value.value[key.value] = `${FLOAT_MAGIC_PREFIX}${v}`;
        return;
      } else if (preValue.startsWith(PALWORLD_QUOTED_PREFIX)) {
        value.value[key.value] = `${PALWORLD_QUOTED_PREFIX}${v}`;
        return;
      } else if (preValue.startsWith(PALWORLD_RAW_PREFIX)) {
        value.value[key.value] = `${PALWORLD_RAW_PREFIX}${v}`;
        return;
      }
    }
    value.value[key.value] = v;
  }
});

const valueType = computed(() => {
  if (props.field?.control === "boolean") return CONTROL.SELECT;
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
    <a-card class="line-option-card" :body-style="{ padding: '10px' }">
      <div v-if="!custom">
        <a-row :gutter="[10, 10]" align="middle">
          <a-col :md="7" :span="24">
            <slot name="title"></slot>
          </a-col>
          <a-col :md="11" :span="24">
            <slot name="info"></slot>
          </a-col>
          <a-col :md="6" :span="24">
            <div v-if="$slots.optionInput">
              <slot name="optionInput"></slot>
            </div>
            <div v-else class="flex">
              <a-input-password
                v-if="field?.control === 'password'"
                v-model:value="computedValue"
              />
              <a-input-number
                v-else-if="field?.control === 'number'"
                v-model:value="computedValue"
                :min="field.min"
                :max="field.max"
                :step="field.step"
                style="width: 100%"
              />
              <a-select
                v-else-if="field?.control === 'select'"
                v-model:value="computedValue"
                style="width: 100%"
              >
                <a-select-option
                  v-for="option in field.options"
                  :key="String(option.value)"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
              <a-input v-else-if="type == CONTROL.INPUT" v-model:value="computedValue" />
              <a-select
                v-if="type == CONTROL.SELECT"
                v-model:value="computedValue"
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
  margin-bottom: 6px;
  .line-option-card {
    transition: all 0.4s;
    border-radius: 6px;
  }
  .line-option-card:hover {
    border: 1px solid var(--color-gray-6) !important;
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16);
  }
}
</style>
