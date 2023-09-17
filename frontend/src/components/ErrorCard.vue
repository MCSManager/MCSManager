<script setup lang="ts">
import CardPanel from "@/components/CardPanel.vue";

const props = defineProps<{
  title: string,
  details?: string
}>();

</script>

<template>
  <div class="h-100 w-100">
    <CardPanel>
      <template #body>
        <div class="error-panel">
          <div class="error-card">
            <div class="error-title">
              <a-typography-title :level="3">
                {{ props.title }}
              </a-typography-title>
            </div>
            <div v-if="props.details" class="error-details">
              <a-typography>
                {{ props.details }}
              </a-typography>
            </div>
          </div>
        </div>
      </template>
    </CardPanel>
  </div>
</template>

<style scoped lang="scss">
.error-panel {
  height: 100% !important;
  justify-content: center;
  display: flex;
  align-items: center;
}

.error-card {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  box-sizing: border-box;
  padding: 32px 32px;
  color: rgba(0, 0, 0, 0.88);
  border-radius: 8px;
  width: 400px;
  height: 247.2px;
  gap: 6px;
}
</style>