<script setup lang="ts">
import { ref, onMounted } from "vue";
import { t } from "@/lang/i18n";
import { remoteNodeList } from "@/services/apis";
import type { NodeStatus } from "@/types";
import { useDialog } from "@/hooks/useDialog";
import { reportErrorMsg } from "@/tools/validator";

interface Props {
  destroyComponent?: () => void;
  emitResult?: (node: NodeStatus) => void;
}

const props = defineProps<Props>();

const { isVisible, openDialog, cancel, submit } = useDialog<NodeStatus>(props);

// 获取可用节点
const { state: nodes, execute: getNodes } = remoteNodeList();
const availableNodes = ref<NodeStatus[]>([]);

const selectNode = (node: NodeStatus) => {
  if (!node.available) {
    reportErrorMsg(t("TXT_CODE_4ec4f7bb"));
    return;
  }
  submit(node);
};

onMounted(async () => {
  await getNodes();
  availableNodes.value = nodes.value?.filter((node) => node.available) || [];
});

// 暴露openDialog方法
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
        <div
          v-for="item in availableNodes"
          :key="item.uuid"
          class="node-item"
          @click="selectNode(item)"
        >
          <div class="node-content">
            <div class="node-header">
              <span class="node-name">{{ item.remarks || `${item.ip}:${item.port}` }}</span>
              <a-tag v-if="item.available" color="green">{{ t("TXT_CODE_b078a763") }}</a-tag>
              <a-tag v-else color="red">{{ t("TXT_CODE_6cbb84a9") }}</a-tag>
            </div>
            <div class="node-details">
              <span>IP: {{ item.ip }}:{{ item.port }}</span>
              <span>UUID: {{ item.uuid }}</span>
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
      }

      .node-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
        color: var(--color-gray-8);
        font-size: 12px;
      }
    }
  }
}
</style>
