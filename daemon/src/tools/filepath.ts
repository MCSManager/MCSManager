export function checkFileName(fileName: string) {
  const blackKeys = ["/", "\\", "|", "?", "*", ">", "<", ";", '"'];
  for (const ch of blackKeys) {
    if (fileName.includes(ch)) return false;
  }
  return true;
}
