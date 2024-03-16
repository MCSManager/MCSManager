import { t } from "@/lang/i18n";
import { message } from "ant-design-vue";

export function emptyValueValidator(value: string | number) {
  if (String(value).trim() === "") throw new Error(t("TXT_CODE_cb08d342"));
  return Promise.resolve();
}

export function isNumberValidator(value: any) {
  if (!value || isNaN(Number(value))) throw new Error(t("TXT_CODE_a9bcbde9"));
  return Promise.resolve();
}

export function getValidatorErrorMsg(error: any, def: string = "") {
  if (error.message) {
    return error.message;
  }
  if (error.errorFields instanceof Array) {
    return String(error.errorFields[0]?.errors[0] || "");
  }
  if (error === null || error === undefined) {
    return def;
  }
  return String(error);
}

export function reportValidatorError(error: any) {
  console.error("Function reportValidatorError():", error);
  message.error(getValidatorErrorMsg(error, t("TXT_CODE_6a365d01")));
}

export function reportErrorMsg(error: any = {}) {
  console.error("Function reportErrorMsg():", error);
  message.error(getValidatorErrorMsg(error, t("TXT_CODE_6a365d01")));
}

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\x00-\x7F]{9,36}$/;
