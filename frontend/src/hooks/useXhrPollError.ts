import { t } from "@/lang/i18n";
import { computed, type Ref } from "vue";

export function useXhrPollError(error: Ref<Error | undefined>) {
  const xhrErrorMsg = t("TXT_CODE_46c48969");
  const xhrErrorMsg2 = t("TXT_CODE_2fb14927");

  const isXhrPollError = computed(() => {
    return error.value?.message.toLowerCase().includes("xhr poll error");
  });
  const xhrPollErrorReason = computed(() => {
    if (window.location.protocol.includes("https")) {
      return xhrErrorMsg;
    }
    return xhrErrorMsg2;
  });

  return {
    isXhrPollError,
    xhrPollErrorReason
  };
}
