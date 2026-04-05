<script setup lang="ts">
import { t } from "@/lang/i18n";
import { useVModel } from "@vueuse/core";
import { Form } from 'ant-design-vue';
import _ from "lodash";
import { watch, type PropType } from "vue";

type RemoteMappingItem = IPanelOverviewRemoteMappingResponse;

type ListRenderItem = {
  item: RemoteMappingItem;
  index: number;
};

const formItemContext = Form.useInjectFormItemContext();

const DEFAULT_MAPPING = {
  from: {
    ip: "",
    port: 24444,
    prefix: "",
  },
  to: {
    ip: "",
    port: 24444,
    prefix: "",
  }
};

/**
 * Here we follow the convention of `ant-design-vue` and name the model prop as
 * `value`. It should be used like `v-model:value="..."`.
 * 
 * To be compatible with lower Vue runtime versions, we use `useVModel` from
 * `vueuse` instead of `defineModel`, which is available in Vue 3.4+. Also,
 * runtime declaration forms of `defineProps` and `defineEmits` are used
 * instead of type declaration forms for better compatibility.
 */

const props = defineProps({
  value: {
    type: Array as PropType<RemoteMappingItem[]>,
    required: true,
  },
});

const emit = defineEmits({
  'update:value': (value: RemoteMappingItem[]) => null
});

const remoteMappings = useVModel(props, 'value', emit);

watch(remoteMappings, () => {
  formItemContext.onFieldChange();
});
</script>

<template>
  <template v-if="remoteMappings.length > 0">
    <a-list item-layout="horizontal" :data-source="remoteMappings">
      <template #header>
        <a-list-item>
          <a-row class="w-full" :gutter="8">
            <a-col class="center-container" :span="9">
              {{ t("TXT_CODE_2ee6fd18") }}
            </a-col>
            <a-col :span="2" />
            <a-col class="center-container" :span="9">
              {{ t("TXT_CODE_6f27624c") }}
            </a-col>
            <a-col :span="4" />
          </a-row>
        </a-list-item>
      </template>
      <template #footer>
        <a-list-item>
          <div class="center-container w-full">
            <a-button @click="remoteMappings.push(_.cloneDeep(DEFAULT_MAPPING))">
              {{ t("TXT_CODE_8d8fbbf4") }}
            </a-button>
          </div>
        </a-list-item>
      </template>
      <template #renderItem="{ item: mapping, index }: ListRenderItem">
        <a-list-item>
          <a-row class="w-full" :gutter="8">
            <a-col :span="9">
              <a-space direction="vertical">
                {{ t("TXT_CODE_54312194") }}
                <a-row :gutter="8">
                  <a-col :span="15">
                    <a-textarea auto-size v-model:value="mapping.from.ip"/>
                  </a-col>
                  <a-col :span="9">
                    <a-input-number class="w-full" :min="1" :max="65535" v-model:value="mapping.from.port" />
                  </a-col>
                </a-row>
                {{ t("TXT_CODE_941d83b8") }}
                <a-row :gutter="8">
                  <a-col :span="24">
                    <a-textarea auto-size v-model:value="mapping.from.prefix" />
                  </a-col>
                </a-row>
              </a-space>
            </a-col>
            <a-col class="center-container" :span="2">
              -&gt;
            </a-col>
            <a-col :span="9">
              <a-space direction="vertical">
                {{ t("TXT_CODE_54312194") }}
                <a-row :gutter="8">
                  <a-col :span="15">
                    <a-textarea auto-size v-model:value="mapping.to.ip" />
                  </a-col>
                  <a-col :span="9">
                    <a-input-number class="w-full" :min="1" :max="65535" v-model:value="mapping.to.port" />
                  </a-col>
                </a-row>
                {{ t("TXT_CODE_941d83b8") }}
                <a-row :gutter="8">
                  <a-col :span="24">
                    <a-textarea auto-size v-model:value="mapping.to.prefix" />
                  </a-col>
                </a-row>
              </a-space>
            </a-col>
            <a-col class="center-container" :span="4">
              <a-button danger @click="remoteMappings.splice(index, 1)">
                {{ t("TXT_CODE_6f2c1806") }}
              </a-button>
            </a-col>
          </a-row>
        </a-list-item>
      </template>
    </a-list>
  </template>
  <template v-else>
    <a-space>
      {{ t("TXT_CODE_8036ea5e") }}
      <a-button @click="remoteMappings.push(_.cloneDeep(DEFAULT_MAPPING))">
        {{ t("TXT_CODE_8d8fbbf4") }}
      </a-button>
    </a-space>
  </template>
</template>

<style lang="css" scoped>
.center-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.w-full {
  width: 100%;
}
</style>
