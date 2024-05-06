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
import FadeUpAnimation from "@/components/FadeUpAnimation.vue";
const { isPhone } = useScreen();
const route = useRoute();

defineProps<{
  card: LayoutCard;
}>();

const {
  formData,
  toStep2,
  toStep3,
  toStep4,
  toStep5,
  isLoading,
  isFormStep,
  isNormalStep,
  currentIcon
} = useQuickStartFlow();

const presetAppType = String(route.query.appType);
const fromDaemonId = String(route.query.daemonId);

if (presetAppType in QUICKSTART_ACTION_TYPE) {
  toStep2(presetAppType as QUICKSTART_ACTION_TYPE);
}

const handleNext = (key: string) => {
  if (formData.step === 1) {
    return toStep2(key as QUICKSTART_ACTION_TYPE, fromDaemonId);
  }

  if (formData.step === 2) {
    return toStep3(key);
  }

  if (formData.step === 3) {
    return toStep4(key as QUICKSTART_METHOD);
  }

  if (formData.step === 4) {
    return toStep5(key);
  }
};
</script>

<template>
  <CardPanel class="card-wrapper" style="height: 100%">
    <template #title>{{ card.title }}</template>
    <template #body>
      <div v-if="!isLoading" class="pd-24 h-100">
        <a-row v-if="isNormalStep" :gutter="[24, 24]" class="h-100">
          <a-col v-if="!isPhone" :lg="12">
            <div class="quickstart-icon flex-center h-100">
              <Transition name="global-action-float">
                <component :is="currentIcon"></component>
              </Transition>
            </div>
          </a-col>
          <a-col :lg="12">
            <div class="text-left" style="text-align: left">
              <a-typography-title :level="5" class="mb-24">
                {{ formData.title }}
              </a-typography-title>
              <div style="max-height: 400px; overflow-x: hidden">
                <a-typography-paragraph v-if="formData.actions?.length === 0">
                  {{ formData.emptyActionsText }}
                </a-typography-paragraph>
                <a-row :gutter="[12, 12]">
                  <fade-up-animation>
                    <action-button
                      v-for="(action, index) in formData.actions"
                      :key="action.key"
                      :data-index="index"
                      :title="action.title"
                      :icon="action.icon"
                      :click="() => (action.click ? action.click() : handleNext(action.key))"
                    />
                  </fade-up-animation>
                </a-row>
              </div>
            </div>
          </a-col>
        </a-row>
        <div v-else-if="isFormStep && formData.appType && formData.createMethod">
          <CreateInstanceForm
            :app-type="formData.appType"
            :create-method="formData.createMethod"
            :daemon-id="formData.daemonId ? formData.daemonId : ''"
            @next-step="handleNext"
          />
        </div>
      </div>
      <div v-else class="loading flex-center w-100 h-100">
        <Loading />
      </div>
    </template>
  </CardPanel>
</template>

<style lang="scss" scoped>
.card-wrapper {
  min-height: 500px;
}
.btn-area {
  position: absolute;
  bottom: 16px;
  right: 16px;
}

.quickstart-icon {
  font-size: 180px;
}
</style>
