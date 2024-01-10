<script lang="ts" setup>
import { t } from "@/lang/i18n";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import { CloseCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons-vue";

const { containerState } = useLayoutContainerStore();
CloseCircleOutlined;
ExclamationCircleOutlined;
defineProps<{
  title: string;
  error: Error;
}>();
</script>

<template>
  <CardPanel>
    <template #title>{{ title }}</template>
    <template #body>
      <div class="flex justify-center align-center h-100">
        <div class="">
          <a-typography-paragraph
            v-if="containerState.showNewCardDialog"
            :level="5"
            style="max-width: 320px; margin: auto; text-align: center"
          >
            <ExclamationCircleOutlined />
            {{ t("TXT_CODE_450481c5") }}
          </a-typography-paragraph>
          <template v-else>
            <div>
              <a-typography-paragraph>
                <ExclamationCircleOutlined />
                {{ t("TXT_CODE_4e627613") }}
              </a-typography-paragraph>

              <a-typography-paragraph>
                <div>
                  {{ t("TXT_CODE_9c95b60f") }}
                </div>
                <pre>{{ error.message ? error.message : error }}</pre>
              </a-typography-paragraph>
            </div>
          </template>
        </div>
      </div>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.icon {
  text-align: center;
  color: var(--color-gray-7);
}
</style>
