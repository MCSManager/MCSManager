import { t } from "@/lang/i18n";
import { message } from "ant-design-vue";

export function emptyValueValidator(value: string | number) {
  if (String(value).trim() === "") throw new Error(t("字段不可为空"));
  return Promise.resolve();
}

export function isNumberValidator(value: any) {
  if (!value || isNaN(Number(value))) throw new Error("字段必须是数字");
  return Promise.resolve();
}

export function getValidatorErrorMsg(error: any, def: string = "") {
  console.debug("ERR:", error);
  if (error === null || error === undefined || Object.keys(error).length === 0) {
    return def;
  }
  if (error instanceof Error) {
    return String(error.message);
  }
  if (error.errorFields instanceof Array) {
    return String(error.errorFields[0]?.errors[0] || "");
  }
  return String(error);
}

export function reportValidatorError(error: any) {
  console.error("Function reportValidatorError():", error);
  message.error(getValidatorErrorMsg(error, t("操作失败")));
}

export function reportError(error: any = {}) {
  console.error("Function reportError():", error);
  message.error(getValidatorErrorMsg(error, t("操作失败")));
}
