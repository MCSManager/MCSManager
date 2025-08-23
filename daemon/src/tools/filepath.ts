import formidable from "formidable";
import fs from "fs-extra";
import os from "os";
import path from "path";

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

export function normalizedJoin(...paths: string[]) {
  if (os.platform() === "win32") {
    return joinWin32(...paths);
  }
  return path.normalize(path.join(...paths));
}

function joinWin32(...paths: string[]): string {
  if (!paths.length) return ".";
  if (paths.length == 1) return paths[0];
  const parts = path.win32.parse(paths[1]);
  let p: string;
  if (parts.root) {
    p = paths[1];
  } else {
    p = path.normalize(path.join(paths[0], paths[1]));
  }
  if (paths.length <= 2) return p;

  return joinWin32(p, ...paths.slice(2));
}
