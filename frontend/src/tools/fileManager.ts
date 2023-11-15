import { t } from "@/lang/i18n";
import {
  FileOutlined,
  FolderOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  FileZipOutlined,
  FileImageOutlined,
  FileGifOutlined,
  FileMarkdownOutlined,
  FileUnknownOutlined,
  PlaySquareOutlined,
  VideoCameraOutlined,
  Html5Outlined,
  CodeOutlined,
  ToolOutlined,
  BranchesOutlined,
  AndroidOutlined,
  IeOutlined,
  WindowsOutlined,
  CustomerServiceOutlined
} from "@ant-design/icons-vue";

export const filterFileName = (fileName: string, onlyExtname = false) => {
  const i = fileName.lastIndexOf(".");
  const suffix = fileName.substring(i + 1).toUpperCase();
  return i === -1
    ? onlyExtname
      ? "UNKNOWN"
      : t("TXT_CODE_d4cf1cb8")
    : onlyExtname
    ? suffix
    : `${suffix} ${t("TXT_CODE_d4cf1cb8")}`;
};

export const getFileExtName = (fileName: string) => {
  if (fileName.indexOf(".") === -1) return "";
  const i = fileName.lastIndexOf(".");
  const suffix = fileName.substring(i + 1).toLowerCase();
  return suffix;
};

const fileType = new Map([
  ["DOC", FileWordOutlined],
  ["DOCX", FileWordOutlined],
  ["XLS", FileExcelOutlined],
  ["XLSX", FileExcelOutlined],
  ["PPT", FilePptOutlined],
  ["PPTX", FilePptOutlined],
  ["PDF", FilePdfOutlined],
  ["CSV", FileTextOutlined],

  ["ZIP", FileZipOutlined],
  ["TAR", FileZipOutlined],
  ["GZ", FileZipOutlined],
  ["7Z", FileZipOutlined],
  ["RAR", FileZipOutlined],
  ["TAR.GZ", FileZipOutlined],
  ["TAR.XZ", FileZipOutlined],

  ["JPG", FileImageOutlined],
  ["JPEG", FileImageOutlined],
  ["PNG", FileImageOutlined],
  ["GIF", FileGifOutlined],
  ["BMP", FileImageOutlined],
  ["WEBP", FileImageOutlined],
  ["SVG", FileImageOutlined],
  ["PSD", FileImageOutlined],
  ["ICO", FileImageOutlined],

  ["MP4", CustomerServiceOutlined],
  ["MOV", CustomerServiceOutlined],
  ["FLV", CustomerServiceOutlined],
  ["AVI", CustomerServiceOutlined],
  ["WMV", CustomerServiceOutlined],
  ["MKV", CustomerServiceOutlined],
  ["M4V", CustomerServiceOutlined],
  ["MPEG", CustomerServiceOutlined],
  ["MPG", CustomerServiceOutlined],

  ["M3U", VideoCameraOutlined],
  ["M3U8", VideoCameraOutlined],

  ["MP3", PlaySquareOutlined],
  ["WAV", PlaySquareOutlined],
  ["OGG", PlaySquareOutlined],
  ["WMA", PlaySquareOutlined],
  ["FLAC", PlaySquareOutlined],
  ["AAC", PlaySquareOutlined],

  ["TXT", FileTextOutlined],
  ["LRC", FileTextOutlined],
  ["TS", FileTextOutlined],
  ["JS", FileTextOutlined],
  ["JSX", FileTextOutlined],
  ["CSS", FileTextOutlined],
  ["HTML", Html5Outlined],
  ["SCSS", FileTextOutlined],
  ["SCSS", FileTextOutlined],
  ["VUE", FileTextOutlined],
  ["PHP", FileTextOutlined],
  ["JSP", FileTextOutlined],
  ["ENV", ToolOutlined],
  ["YML", FileTextOutlined],
  ["YAML", FileTextOutlined],
  ["JSON", FileTextOutlined],
  ["XML", FileTextOutlined],
  ["SQL", FileTextOutlined],
  ["PROPERTIES", ToolOutlined],
  ["BAT", CodeOutlined],
  ["SH", CodeOutlined],
  ["MD", FileMarkdownOutlined],
  ["GITIGNORE", BranchesOutlined],

  ["APK", AndroidOutlined],
  ["URL", IeOutlined],
  ["EXE", WindowsOutlined],

  ["UNKNOWN", FileUnknownOutlined]
]);
export const getFileIcon = (name: string, type: number) => {
  name = filterFileName(name, true);
  if (type === 0) return FolderOutlined;
  return fileType.get(name) || FileOutlined;
};
