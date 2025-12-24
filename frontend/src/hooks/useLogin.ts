import { router } from "@/config/router";
import { t } from "@/lang/i18n";
import { loginUser } from "@/services/apis";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { sleep } from "@/tools/common";
import { reportErrorMsg } from "@/tools/validator";
import { message, Modal } from "ant-design-vue";
import { reactive, ref } from "vue";

export interface LoginFormData {
  username: string;
  password: string;
  code: string;
}

export function useLogin() {
  const formData = reactive<LoginFormData>({
    username: "",
    password: "",
    code: ""
  });

  const { execute: login } = loginUser();
  const { updateUserInfo, isAdmin } = useAppStateStore();

  const loginStep = ref(0); // 0: 输入, 1: 登录中, 2: 更新用户信息, 3: 成功
  const is2Fa = ref(false);

  const resetForm = () => {
    formData.username = "";
    formData.password = "";
    formData.code = "";
    loginStep.value = 0;
    is2Fa.value = false;
  };

  const handleLogin = async () => {
    if (!formData.username.trim() || !formData.password.trim()) {
      return message.error(t("TXT_CODE_c846074d"));
    }

    try {
      loginStep.value = 1; // 登录中
      await sleep(600);

      const result = await login({
        data: formData
      });

      if (result.value === "NEED_2FA") {
        loginStep.value = 0;
        is2Fa.value = true;
        return;
      }

      is2Fa.value = false;
      await sleep(600);
      await handleNext();
    } catch (error: any) {
      loginStep.value = 0;
      reportErrorMsg(error);
    }
  };

  const handleNext = async () => {
    try {
      loginStep.value = 2; // 更新用户信息
      await updateUserInfo();
      await sleep(1000);
      loginSuccess();
    } catch (error: any) {
      console.error(error);
      loginStep.value = 0;
      Modal.error({
        title: t("TXT_CODE_da2fb99a"),
        content: t("TXT_CODE_6e718abe")
      });
    }
  };

  const loginSuccess = () => {
    loginStep.value = 3; // 成功
    if (isAdmin.value) {
      router.push({
        path: "/"
      });
    } else {
      router.push({ path: "/customer" });
    }
  };

  return {
    formData,
    loginStep,
    is2Fa,
    handleLogin,
    resetForm
  };
}
