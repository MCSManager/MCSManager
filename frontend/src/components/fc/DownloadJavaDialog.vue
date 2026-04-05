<script setup lang="ts">
import JavaIcon from "@/assets/components/java.png";
import { t } from "@/lang/i18n";
import type { DownloadJavaConfigItem } from "@/types/javaManager";
import { Flex } from "ant-design-vue";
import { computed, ref } from "vue";
import type { MountComponent } from "../../types/index";

const props = defineProps<MountComponent>();

const open = ref(true);
const selectedIndex = ref<number | null>(null);

// 合并后的单一数据源
const JAVA_OPTIONS: DownloadJavaConfigItem[] = [
  { name: "zulu", version: "8" },
  { name: "zulu", version: "11" },
  { name: "zulu", version: "15" },
  { name: "zulu", version: "17" },
  { name: "zulu", version: "21" },
  { name: "zulu", version: "25" }
];

const selectedItem = computed(() => {
  if (selectedIndex.value === null) return null;
  return JAVA_OPTIONS[selectedIndex.value];
});

const handleSelect = (index: number) => {
  selectedIndex.value = index;
};

const cancel = async () => {
  open.value = false;
  if (props.destroyComponent) props.destroyComponent();
};

const submit = async () => {
  if (selectedItem.value) {
    props.emitResult(selectedItem.value);
  }
  await cancel();
};
</script>

<template>
  <a-modal
    v-model:open="open"
    width="820px"
    centered
    :title="t('TXT_CODE_84588601')"
    :closable="false"
    :destroy-on-close="true"
    @cancel="cancel"
    @ok="submit"
  >
    <flex wrap="wrap" gap="middle" justify="flex-start">
      <a-card
        v-for="(item, index) in JAVA_OPTIONS"
        :key="`${item.name}-${item.version}`"
        hoverable
        :class="['java-card', { 'java-card-selected': selectedIndex === index }]"
        @click="handleSelect(index)"
      >
        <template #cover>
          <div justify="center" align="center" align-items="center" class="java-card-cover">
            <a-image
              :src="JavaIcon"
              :preview="false"
              :height="62"
              style="object-fit: cover; border-radius: 0px"
            />
          </div>
        </template>
        <a-card-meta>
          <template #title>
            <a-typography-text strong> Java {{ item.version.toUpperCase() }}</a-typography-text>
          </template>
          <template #description>
            <a-tag color="blue">{{ item.name.toUpperCase() }}</a-tag>
          </template>
        </a-card-meta>
      </a-card>
    </flex>

    <template #footer>
      <a-button @click="cancel">{{ t("TXT_CODE_a0451c97") }}</a-button>
      <a-button type="primary" :disabled="selectedIndex === null" @click="submit">
        {{ t("TXT_CODE_d507abff") }}
      </a-button>
    </template>
  </a-modal>
</template>

<style scoped>
.java-card {
  width: 140px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  border: 1px solid var(--color-gray-5);
  overflow: hidden;
}

.java-card:hover {
  border-color: #1890ff;
}

.java-card-selected {
  border-color: #1890ff;
  background: linear-gradient(135deg, var(--color-gray-1) 0%, var(--color-gray-2) 100%);
}

.java-card-cover {
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, var(--color-gray-3) 0%, var(--color-gray-5) 100%);
}

.java-card :deep(.ant-card-body) {
  padding: 12px;
  text-align: center;
}

.java-card :deep(.ant-card-meta-title) {
  margin-bottom: 4px !important;
}

.java-card :deep(.ant-card-meta-description) {
  margin-top: 4px;
}
</style>
