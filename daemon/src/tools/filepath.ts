import formidable from "formidable";
import fs from "fs-extra";

export function checkFileName(fileName: string) {
  const blackKeys = ["/", "\\", "|", "?", "*", ">", "<", ";", '"'];
  for (const ch of blackKeys) {
    if (fileName.includes(ch)) return false;
  }
  return true;
}

export function clearUploadFiles(file?: formidable.File | formidable.File[]) {
  if (!file) return;
  if (file instanceof Array) {
    file.forEach((v) => {
      fs.remove(v.filepath, () => {});
    });
  } else {
    fs.remove(file.filepath, () => {});
  }
}
