<script setup lang="ts">
import { useCardOperation } from "@/hooks/useCardOperation";
import type { LayoutCard } from "@/types";
import {
  CloseOutlined,
  EditOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons-vue";
import { h } from "vue";
import { $t as t } from "@/lang/i18n";
import { useAppToolsStore } from "@/stores/useAppToolsStore";
import { arrayFilter } from "@/tools/array";

const props = defineProps<{
  card: LayoutCard;
}>();

const { openInputDialog } = useAppToolsStore();

const {
  addCardHeight,
  reduceCardHeight,
  addCardWidth,
  reduceCardWidth,
  deleteCard,
  editCardName,
} = useCardOperation();

let btns = arrayFilter([
  {
    tipText: t("TXT_CODE_153f705d"),
    icon: CloseOutlined,
    click: deleteCard,
    condition: () => {
      return props.card.disableDelete !== true;
    },
  },
  {
    tipText: t("TXT_CODE_fd5ca298"),
    icon: VerticalAlignTopOutlined,
    click: reduceCardHeight,
    style: "transform: rotate(0deg);",
  },
  {
    tipText: t("TXT_CODE_5db4e96b"),
    icon: VerticalAlignTopOutlined,
    click: addCardHeight,
    style: "transform: rotate(180deg);",
  },
  {
    tipText: t("TXT_CODE_d356cf9d"),
    icon: VerticalAlignTopOutlined,
    click: reduceCardWidth,
    style: "transform: rotate(270deg);",
  },
  {
    tipText: t("TXT_CODE_baa16e45"),
    icon: VerticalAlignTopOutlined,
    click: addCardWidth,
    style: "transform: rotate(90deg);",
  },
  {
    tipText: t("TXT_CODE_18cdc17f"),
    icon: EditOutlined,
    click: async (id: string) => {
      const newName = await openInputDialog(t("请输入新的卡片标题"));
      editCardName(id, String(newName));
    },
  },
]);
</script>

<template>
  <div class="layout-card-design-btn">
    <a-tooltip placement="left" v-for="(item, index) in btns" :key="index">
      <template #title>
        <span>{{ item.tipText }}</span>
      </template>
      <a-button
        :style="item.style"
        type="text"
        :icon="h(item.icon)"
        @click="() => item.click(card.id)"
      />
    </a-tooltip>
  </div>
  <div class="number-card">
    <div class="number-card-H">
      <span>{{ t("TXT_CODE_1f246be3") }} {{ card.height }}</span>
    </div>
    <div class="number-card-W">
      <span>
        {{ t("TXT_CODE_108ce2e4") }}
        <span>{{ card.width }}/12</span>
        {{ t("TXT_CODE_3efe364e") }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../assets/global.scss";

.base {
  @extend .global-text-color;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--float-box-bg-color);
  backdrop-filter: saturate(180%) blur(20px);
  font-size: 12px;
  border: 1px dashed var(--gray-border-color);
  font-size: 12px;
  border-radius: 4px;
  transition: all 0.4s;
}

.number-card {
  position: absolute;
  right: 40px;
  top: 0px;
  z-index: 10;
  > div {
    margin-bottom: 8px;
    padding: 2px 4px;
  }
}
.number-card-W {
  @extend .base;
}
.number-card-H {
  @extend .base;
}
.layout-card-design-btn {
  @extend .base;
  width: 32px;
  position: absolute;
  right: 0px;
  top: 0px;

  i {
    margin: 4px;
    cursor: pointer;
    transition: all 0.4s;
  }

  i:hover {
    opacity: 0.9;
    transform: scale(1.2);
    color: var(--color-primary);
  }
}

.layout-card-design-btn:hover {
  border: 1px dashed var(--color-primary);
  // transform: scale(1.04);
}
</style>
