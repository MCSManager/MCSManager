import { t } from "@/lang/i18n";

export const getExtName = (fileName: string) => {
  const i = fileName.lastIndexOf(".");
  const suffix = fileName.substring(i + 1).toUpperCase();

  return `${suffix} ${t("文件")}`;
};
