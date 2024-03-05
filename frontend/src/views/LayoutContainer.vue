<script setup lang="ts">
import NewCardList from "@/components//NewCardList/index.vue";
import CardOperator from "@/components/CardOperator.vue";
import LayoutCardComponent from "@/components//LayoutCard.vue";
import PlaceHolderCard from "@/components//PlaceHolderCard.vue";
import { useLayoutConfigStore } from "@/stores/useLayoutConfig";
import { useCardDragMove } from "@/hooks/useCardDragMove";
import { useCardLayoutComputed, PLACE_HOLDER_CARD } from "@/hooks/useCardLayoutComputed";
import { useRouterParams } from "../hooks/useRouterParams";
import { useLayoutContainerStore } from "@/stores/useLayoutContainerStore";
import { useScreen } from "@/hooks/useScreen";
import { useMouseEnter } from "@/hooks/useMouseEnter";
import type { ILayoutCard } from "../../../common/global";

const { containerState } = useLayoutContainerStore();
const { currentRoutePath } = useRouterParams();
const { getPageLayoutConfig } = useLayoutConfigStore();
const currentLayoutConfig = getPageLayoutConfig(currentRoutePath.value);
const { computedLayout } = useCardLayoutComputed(currentLayoutConfig);
const { isPhone } = useScreen();

const {
  dragover,
  dragleave,
  drop,
  dragstart,
  dropToNewArea,
  dragenter,
  newAreaDragenter,
  newAreaDragleave
} = useCardDragMove();

const { targetId, handleMouseEnter, handleMouseLeave } = useMouseEnter();

const showCardOperator = (card: ILayoutCard) => {
  return (
    card.type != PLACE_HOLDER_CARD && containerState.isDesignMode && targetId.value === card.id
  );
};
</script>

<template>
  <main class="main-layout-container">
    <NewCardList v-if="containerState.isDesignMode" ref="newCardList" />

    <a-row
      v-if="currentLayoutConfig.length > 1"
      :class="{ 'row-order-mode': containerState.isDesignMode }"
      :gutter="[24, 24]"
    >
      <a-col
        v-for="card in computedLayout"
        :key="card.id"
        :span="24"
        :md="24"
        :lg="card.width * 2"
        class="layout-card-col"
        :class="{ 'is-order-mode': containerState.isDesignMode }"
        :data-card-type="card.type"
        :style="{ minHeight: card.height }"
        @mouseenter="() => handleMouseEnter(card.id)"
        @mouseleave="() => handleMouseLeave(card.id)"
      >
        <CardOperator v-if="showCardOperator(card)" :card="card" />
        <LayoutCardComponent
          v-if="card.type != PLACE_HOLDER_CARD"
          :card="card"
          :data-id="card.id"
          :design-mode="containerState.isDesignMode"
          :draggable="containerState.isDesignMode"
          @dragstart="(e: DragEvent) => dragstart(e, card.id)"
          @dragover="(e: DragEvent) => dragover(e, card.id)"
          @dragleave="(e: DragEvent) => dragleave(e, card.id)"
          @dragenter="(e: DragEvent) => dragenter(e, card.id)"
          @drop="(e: DragEvent) => drop(e, card.id)"
        />

        <PlaceHolderCard
          v-else-if="card.type == PLACE_HOLDER_CARD"
          :id="'layout-card-container-' + card.id"
          :design-mode="containerState.isDesignMode"
          :card="card"
          :data-id="card.id"
          :draggable="containerState.isDesignMode"
          @dragstart="(e: DragEvent) => e.preventDefault()"
          @dragover="(e: DragEvent) => e.preventDefault()"
          @dragleave="(e: DragEvent) => newAreaDragleave(e)"
          @dragenter="(e: DragEvent) => newAreaDragenter(e)"
          @drop="(e: DragEvent) => dropToNewArea(e, String(card.followId))"
        />
      </a-col>
    </a-row>

    <div
      v-if="currentLayoutConfig.length <= 1 && currentLayoutConfig.length != 0"
      :class="{ 'main-flex-center': !isPhone }"
    >
      <a-row :gutter="[0, 0]" :align="'center' as any" style="width: 100%">
        <a-col
          :span="24"
          :md="24"
          :lg="currentLayoutConfig[0].width * 2"
          class="layout-card-col transition-all-6"
        >
          <CardOperator v-if="containerState.isDesignMode" :card="currentLayoutConfig[0]" />
          <LayoutCardComponent
            :card="currentLayoutConfig[0]"
            :data-id="currentLayoutConfig[0].id"
            :style="{ minHeight: currentLayoutConfig[0].height }"
          />
        </a-col>
      </a-row>
    </div>
  </main>
</template>

<style lang="scss">
// Gloabl
@import "../assets/variables.scss";

// Hide the EmptyCard component when mobile device.
@media (max-width: 992px) {
  .layout-card-col[data-card-type="EmptyCard"] {
    display: none;
  }
  .layout-card-col[data-card-type="PLACEHOLDER"] {
    display: none;
  }
}
</style>

<style lang="scss" scoped>
@import "../assets/global.scss";

.layout-card-col {
  position: relative;
}
.main-flex-center {
  margin-top: 10vh;
  height: 100%;
  width: 100%;
  text-align: center;
}
.main-layout-container {
  position: relative;
  animation: scaleAnimation 0.6s ease-in-out;
  min-height: 100%;
  margin: auto;
  padding-bottom: 20px;
}

@keyframes scaleAnimation {
  0% {
    opacity: 0.02;
    // transform: scale(0.98);
  }

  100% {
    opacity: 1;
    // transform: scale(1);
  }
}
</style>
