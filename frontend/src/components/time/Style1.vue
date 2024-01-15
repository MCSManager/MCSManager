<script setup lang="ts">
defineProps<{
  time: string;
  date: string;
}>();
</script>

<template>
  <div class="h-100 flex-center">
    <div class="value pb-40" style="font-size: 60px">
      {{ time }}
    </div>
    <div class="ml-auto" style="font-size: 10px; position: absolute; right: 40px; bottom: 20px">
      {{ date }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.value {
  font-weight: bolder;
}
</style>
