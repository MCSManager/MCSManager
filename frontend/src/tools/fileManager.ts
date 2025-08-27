import { t } from "@/lang/i18n";
import {
  AndroidOutlined,
  BranchesOutlined,
  CodeOutlined,
  CustomerServiceOutlined,
  FileExcelOutlined,
  FileGifOutlined,
  FileImageOutlined,
  FileMarkdownOutlined,
  FileOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileTextOutlined,
  FileUnknownOutlined,
  FileWordOutlined,
  FileZipOutlined,
  FolderOutlined,
  Html5Outlined,
  IeOutlined,
  PlaySquareOutlined,
  ToolOutlined,
  VideoCameraOutlined,
  WindowsOutlined
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

/**
 * 判断文件是否为可解压的压缩包格式
 * 支持常见单卷包：.7z, .zip, .rar, .tar.gz, .iso, .cab 等
 * 支持常见分卷包：.7z.001、.part1.rar、.rar + .r00、.zip + .z01 等
 */
export const isCompressFile = (fileName: string): boolean => {
  const lowerFileName = fileName.toLowerCase();
  
  // 常见单卷包后缀
  const singleVolumeExts = ['7z', 'zip', 'rar', 'tar.gz', 'iso', 'cab', 'tar', 'gz', 'tar.xz', 'bz2', 'tar.bz2'];
  
  // 检查单卷包
  for (const ext of singleVolumeExts) {
    if (lowerFileName.endsWith('.' + ext)) {
      return true;
    }
  }
  
  // 检查分卷包格式
  // 1. 7z分卷：.7z.001, .7z.002, .7z.003 等（只有 .7z.001 可以解压）
  if (/\.7z\.\d+$/i.test(lowerFileName)) {
    return lowerFileName.endsWith('.001'); // 只有第一卷可以解压
  }
  
  // 2. RAR分卷
  // 新版RAR5：.part1.rar, .part2.rar, .part3.rar 等（只有 part1.rar 可以解压）
  if (/\.part\d+\.rar$/i.test(lowerFileName)) {
    return /\.part1\.rar$/i.test(lowerFileName); // 只有第一卷可以解压
  }
  
  // 旧版RAR：.rar, .r00, .r01, .r02 等（只有 .rar 可以解压）
  if (/\.r\d{2}$/i.test(lowerFileName)) {
    return false; // .r00, .r01 等不能解压，只有主 .rar 文件可以
  }
  
  // 3. ZIP分卷：.zip, .z01, .z02, .z03 等（只有 .zip 主文件可以解压）
  if (/\.z\d{2}$/i.test(lowerFileName)) {
    return false; // .z01, .z02 等不能解压，只有主 .zip 文件可以
  }
  
  return false;
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
  ["ISO", FileZipOutlined], // 新增ISO格式
  ["CAB", FileZipOutlined], // 新增CAB格式
  ["BZ2", FileZipOutlined], // 新增BZ2格式
  ["TAR.BZ2", FileZipOutlined], // 新增TAR.BZ2格式
  
  // 分卷包格式支持
  ["001", FileZipOutlined], // 7z分卷 (.7z.001)
  ["R00", FileZipOutlined], // RAR旧版分卷 (.r00)
  ["R01", FileZipOutlined], // RAR旧版分卷 (.r01)
  ["R02", FileZipOutlined], // RAR旧版分卷 (.r02)
  ["Z01", FileZipOutlined], // ZIP分卷 (.z01)
  ["Z02", FileZipOutlined], // ZIP分卷 (.z02)
  ["Z03", FileZipOutlined], // ZIP分卷 (.z03)

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
