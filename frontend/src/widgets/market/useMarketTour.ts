import { $t } from "@/lang/i18n";
import type { MaybeRef } from "vue";
import { computed, nextTick, onMounted, ref, unref } from "vue";

const MCS_MARKET_TOUR_DONE = "mcs_market_tour_completed";

export function useMarketTour(isAdmin: MaybeRef<boolean>) {
  const step1Ref = ref<HTMLElement | null>(null);
  const step2Ref = ref<HTMLElement | null>(null);
  const step3Ref = ref<HTMLElement | null>(null);
  const openTour = ref(false);
  const tourCurrent = ref(0);

  function setStepRef(index: number, el: unknown) {
    const dom = el ? (el as { $el?: HTMLElement }).$el ?? el : null;
    if (index === 0) step1Ref.value = dom as HTMLElement | null;
    if (index === 1) step2Ref.value = dom as HTMLElement | null;
  }

  const tourSteps = computed(() => {
    const steps: Array<{
      target: () => HTMLElement | null;
      title: string;
      description: string;
    }> = [];
    if (unref(isAdmin)) {
      steps.push({
        target: () => step1Ref.value ?? null,
        title: $t("TXT_CODE_1bfd647d"),
        description: $t("TXT_CODE_b5be5a6a")
      });
      steps.push({
        target: () => step2Ref.value ?? null,
        title: $t("TXT_CODE_963e00f"),
        description: $t("TXT_CODE_572ba7f0")
      });
    }
    steps.push({
      target: () => step3Ref.value ?? null,
      title: $t("TXT_CODE_d284d8a9"),
      description: $t("TXT_CODE_22814776")
    });
    return steps as any;
  });

  const markTourDone = () => {
    localStorage.setItem(MCS_MARKET_TOUR_DONE, "1");
    openTour.value = false;
  };

  const startTour = () => {
    if (window.innerWidth < 1000) return;
    if (localStorage.getItem(MCS_MARKET_TOUR_DONE)) return;
    nextTick(() => {
      openTour.value = true;
    });
  };

  onMounted(() => {
    setTimeout(() => {
      startTour();
    }, 1000);
  });

  return {
    step1Ref,
    step2Ref,
    step3Ref,
    openTour,
    tourCurrent,
    tourSteps,
    setStepRef,
    markTourDone
  };
}
