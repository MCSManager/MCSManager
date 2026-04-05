import { t } from "@/lang/i18n";
import { useClipboard } from "@vueuse/core";
import { message, Modal } from "ant-design-vue";
import { h } from "vue";

const { copy, copied, isSupported } = useClipboard();

export const toCopy = async (sth: string | number) => {
  try {
    if (!isSupported.value) {
      const input = document.createElement("input");
      input.setAttribute("value", String(sth));
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      return message.success(t("TXT_CODE_b858d78a"));
    } else {
      await copy(String(sth));
      if (copied.value) return message.success(t("TXT_CODE_b858d78a"));
    }
  } catch (err: any) {
    console.error(err);
    Modal.warning({
      title: t("TXT_CODE_ca07c84c"),
      content: [h("span", t("TXT_CODE_2452016e")), h("br"), h("span", sth)]
    });
  }
};
