<script setup lang="ts">
import { QUICKSTART_METHOD } from "@/hooks/widgets/quickStartFlow";
import { t } from "@/lang/i18n";
import {
  AppstoreAddOutlined,
  BuildOutlined,
  CodeOutlined,
  DropboxOutlined,
  FileZipOutlined
} from "@ant-design/icons-vue";
import { Flex } from "ant-design-vue";
import { ref, type Component } from "vue";
import InstallOptionButton from "./InstallOptionButton.vue";

type MarketCreateMethod =
  | "preset"
  | QUICKSTART_METHOD.IMPORT
  | QUICKSTART_METHOD.DOCKER
  | QUICKSTART_METHOD.EXIST;

defineProps<{
  categoryTitle?: string;
}>();

const emit = defineEmits<{
  back: [];
  select: [method: MarketCreateMethod];
}>();

interface MethodOption {
  key: MarketCreateMethod;
  label: string;
  description: string;
  icon: Component;
  action: () => void;
}

const selectedMethod = ref<MarketCreateMethod>();

const options: MethodOption[] = [
  {
    key: QUICKSTART_METHOD.IMPORT,
    label: t("TXT_CODE_1bfd647d"),
    description: t("TXT_CODE_f09da050"),
    icon: FileZipOutlined,
    action: () => (selectedMethod.value = QUICKSTART_METHOD.IMPORT)
  },
  {
    key: "preset",
    label: t("TXT_CODE_9b45858c"),
    description: t("TXT_CODE_22814776"),
    icon: AppstoreAddOutlined,
    action: () => (selectedMethod.value = "preset")
  },
  {
    key: QUICKSTART_METHOD.DOCKER,
    label: t("TXT_CODE_bae487e4"),
    description: t("TXT_CODE_b51bac6f"),
    icon: DropboxOutlined,
    action: () => (selectedMethod.value = QUICKSTART_METHOD.DOCKER)
  },
  {
    key: QUICKSTART_METHOD.EXIST,
    label: t("TXT_CODE_c14caab"),
    description: t("TXT_CODE_b3844cf8"),
    icon: CodeOutlined,
    action: () => (selectedMethod.value = QUICKSTART_METHOD.EXIST)
  }
];

const submit = () => {
  if (selectedMethod.value) emit("select", selectedMethod.value);
};
</script>

<template>
  <section class="method-step">
    <div class="mb-15">
      <a-typography-title :level="4" class="mb-8">
        <BuildOutlined />
        {{ t("TXT_CODE_49981cb9") }}
      </a-typography-title>

      <a-typography-text type="secondary">
        {{ t("TXT_CODE_dcdbc73") }}
      </a-typography-text>
    </div>

    <a-row :gutter="[20, 20]">
      <a-col v-for="option in options" :key="option.key" :xs="24" :lg="12">
        <InstallOptionButton
          :data-testid="`market-method-${option.key}`"
          :option="option"
          :selected="selectedMethod === option.key"
        />
      </a-col>
    </a-row>

    <Flex justify="space-between" align="center" class="mt-20">
      <div>
        <a-typography-text v-if="categoryTitle" type="secondary">
          {{ t("TXT_CODE_432cbc38") }}
        </a-typography-text>
        <a-tag color="success">{{ categoryTitle }}</a-tag>
      </div>
      <Flex gap="12">
        <a-button data-testid="market-method-back" @click="emit('back')">
          {{ t("TXT_CODE_c14b2ea3") }}
        </a-button>
        <a-button
          data-testid="market-method-next"
          type="primary"
          :disabled="!selectedMethod"
          @click="submit"
        >
          {{ t("TXT_CODE_5e9022f8") }}
        </a-button>
      </Flex>
    </Flex>
  </section>
</template>
