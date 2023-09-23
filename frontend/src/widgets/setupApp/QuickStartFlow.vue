<script setup lang="ts">
import ActionButton from "@/components/ActionButton.vue";
import Loading from "@/components/Loading.vue";
import { useScreen } from "@/hooks/useScreen";
import type { LayoutCard } from "@/types";
import {
  QUICKSTART_ACTION_TYPE,
  QUICKSTART_METHOD,
  useQuickStartFlow
} from "@/hooks/widgets/quickStartFlow";
import CreateInstanceForm from "./CreateInstanceForm.vue";
import { useRoute } from "vue-router";
const { isPhone } = useScreen();
const route = useRoute();

defineProps<{
  card: LayoutCard;
}>();

const { formData, toStep2, toStep3, toStep4, isReady, isFormStep, isNormalStep } =
  useQuickStartFlow();

const presetAppType = String(route.query.appType);
if (presetAppType in QUICKSTART_ACTION_TYPE) {
  toStep2(presetAppType as QUICKSTART_ACTION_TYPE);
}

const handleNext = (key: string) => {
  if (formData.step === 1) {
    return toStep2(key as QUICKSTART_ACTION_TYPE);
  }

  if (formData.step === 2) {
    return toStep3();
  }

  if (formData.step === 3) {
    return toStep4(key as QUICKSTART_METHOD);
  }
};
</script>

<template>
  <CardPanel class="CardWrapper" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <div v-if="isReady" class="pd-24">
        <a-row v-if="isNormalStep" :gutter="[24, 24]">
          <a-col v-if="!isPhone" :lg="12"> A </a-col>
          <a-col :lg="12">
            <div class="text-left" style="text-align: left">
              <a-typography-title :level="5" class="mb-24">
                {{ formData.title }}
              </a-typography-title>
              <div>
                <a-row :gutter="[12, 12]">
                  <action-button
                    v-for="action in formData.actions"
                    :key="action.key"
                    :title="action.title"
                    :icon="action.icon"
                    :click="() => handleNext(action.key)"
                  />
                </a-row>
              </div>
            </div>
          </a-col>
        </a-row>
        <div v-else-if="isFormStep && formData.appType && formData.createMethod">
          <CreateInstanceForm :app-type="formData.appType" :create-method="formData.createMethod" />
        </div>
      </div>
      <div v-else class="loading flex-center w-100 h-100">
        <Loading />
      </div>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.CardWrapper {
  min-height: 500px;
}
.btn-area {
  position: absolute;
  bottom: 16px;
  right: 16px;
}
</style>
