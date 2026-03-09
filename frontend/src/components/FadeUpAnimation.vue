<script setup lang="ts">
const props = defineProps<{
  delay?: number;
}>();

const beforeEnter = (el: any) => {
  el.style.opacity = 0;
};

const enter = (el: any, done: () => void) => {
  let delay = el.dataset.index * Number(props.delay ?? 100);
  setTimeout(() => {
    el.style.transition = "opacity 0.2s";
    el.style.opacity = 1;
    el.style.animation = "global-fade-up-animation 0.2s 1";
    done();
  }, delay);
};
</script>

<template>
  <transition-group
    :appear="true"
    name="more"
    :css="false"
    @before-enter="beforeEnter"
    @enter="enter"
  >
    <slot></slot>
  </transition-group>
</template>

<style lang="scss">
@keyframes global-fade-up-animation {
  from {
    transform: translateY(16px);
    opacity: 0;
  }
  to {
    transform: translateY(0px);
    opacity: 1;
  }
}
</style>
