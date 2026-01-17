<script setup lang="ts">
import { useDialog } from "@/hooks/useDialog";
import type { ComputedNodeInfo } from "@/hooks/useOverviewInfo";
import { useRemoteNode } from "@/hooks/useRemoteNode";
import { t } from "@/lang/i18n";
import { reportErrorMsg } from "@/tools/validator";
import type { MountComponent } from "@/types";
import { ExclamationCircleOutlined } from "@ant-design/icons-vue";
import { computed, onMounted, ref } from "vue";

interface Props extends MountComponent<ComputedNodeInfo> {
  targetPlatforms?: string[];
}

const props = defineProps<Props>();

const { isVisible, openDialog, cancel, submit } = useDialog<ComputedNodeInfo>(props);

// 获取可用节点
const { response, refresh: refreshOverviewInfo } = useRemoteNode();

const availableNodes = ref<ComputedNodeInfo[]>([]);

// check node is supported target platforms
const isNodeSupported = (node: ComputedNodeInfo): boolean => {
  if (!props.targetPlatforms || props.targetPlatforms.length === 0) {
    return true;
  }
  
  if (!node.dockerPlatforms || node.dockerPlatforms.length === 0) {
    return false;
  }
  return node.dockerPlatforms?.some((platform) => props.targetPlatforms?.includes(platform));
};

// sorted nodes list: supported nodes first, unsupported nodes last
const sortedNodes = computed(() => {
  const nodes = [...availableNodes.value];
  return nodes.sort((a, b) => {
    const aSupported = isNodeSupported(a);
    const bSupported = isNodeSupported(b);
    if (aSupported === bSupported) return 0;
    return aSupported ? -1 : 1;
  });
});

const selectNode = (node: ComputedNodeInfo) => {
  if (!node.available) {
    reportErrorMsg(t("TXT_CODE_4ec4f7bb"));
    return;
  }
  submit(node);
};

onMounted(async () => {
  await refreshOverviewInfo();
  availableNodes.value = response.value?.remote?.filter((node) => node.available) || [];
});

defineExpose({
  openDialog
});
</script>

<template>
  <a-modal
    v-model:open="isVisible"
    :title="t('TXT_CODE_7e267ba')"
    :width="840"
    :footer="null"
    :destroy-on-close="true"
    @cancel="cancel"
  >
    <div class="node-select-container">
      <a-typography-paragraph>
        {{ t("TXT_CODE_ad24269a") }}
      </a-typography-paragraph>
      <div class="node-grid">
        <div v-if="availableNodes.length === 0">
          <div class="justify-center" flex-center>
            <div>
              <div class="mb-2">
                <p style="opacity: 0.8">
                  {{ t("TXT_CODE_f4110b65") }}
                </p>
              </div>
              <div>
                <a-button type="primary" @click="selectNode(availableNodes[0])">
                  {{ t("TXT_CODE_4fe5dce5") }}
                </a-button>
              </div>
            </div>
          </div>
        </div>
        <div
          v-for="item in sortedNodes"
          v-else
          :key="item.uuid + item.remarks + item.ip"
          :data-ip="item.ip"
          :data-uuid="item.uuid"
          class="node-item"
          :class="{ 'node-unsupported': props.targetPlatforms && props.targetPlatforms.length > 0 && !isNodeSupported(item) }"
          @click="selectNode(item)"
        >
          <div class="node-content">
            <div class="node-header">
              <span class="node-name">{{ item.remarks || `${item.ip}:${item.port}` }}</span>
              <div class="node-tags">
                <a-tag v-if="item.available" color="green">{{ t("TXT_CODE_b078a763") }}</a-tag>
                <a-tag v-else color="red">{{ t("TXT_CODE_6cbb84a9") }}</a-tag>
                <a-tag
                  v-if="props.targetPlatforms && props.targetPlatforms.length > 0 && !isNodeSupported(item)"
                  color="orange"
                >
                  <ExclamationCircleOutlined />
                  {{ t("TXT_CODE_node_platform_unsupported") }}
                </a-tag>
              </div>
            </div>
            <div class="node-details">
              <span>ID: {{ item.uuid }}</span>
              <span>{{ t("TXT_CODE_3d0885c0") }}: {{ item?.platformText }}</span>
              <span
                :class="{
                  'node-warning-text': props.targetPlatforms && props.targetPlatforms.length > 0 && !isNodeSupported(item)
                }"
              >
                <template v-if="props.targetPlatforms && props.targetPlatforms.length > 0 && !isNodeSupported(item)">
                  <ExclamationCircleOutlined />
                </template>
                Docker platforms: {{ item?.dockerPlatforms?.join(",") || "--" }}
              </span>
              <span>{{ t("TXT_CODE_c7d0002e") }}: {{ item.ip }}:{{ item.port }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped>
.node-select-container {
  max-height: 600px;
  overflow-y: auto;
  padding-right: 4px;
  .node-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .node-item {
    cursor: pointer;
    padding: 12px;
    border-radius: 8px;
    transition: all 0.3s ease;
    background-color: var(--color-gray-2);
    border: 1px solid var(--color-gray-3);

    &:hover {
      background-color: var(--color-gray-4);
      border-color: var(--color-gray-5);
    }

    &.node-unsupported {
      border-color: var(--color-warning);
      background-color: var(--color-warning-bg, rgba(255, 193, 7, 0.1));
    }

    .node-content {
      .node-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;

        .node-name {
          font-weight: 600;
          color: var(--color-gray-10);
          flex: 1;
          margin-right: 8px;
        }

        .node-tags {
          display: flex;
          gap: 4px;
          align-items: center;
        }
      }

      .node-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
        color: var(--color-gray-8);
        font-size: 12px;

        .node-warning-text {
          color: var(--color-warning, #faad14);
          font-weight: 500;
        }
      }
    }
  }
}
</style>
