export function checkSafeName(name: string) {
  if (name === undefined || name === null || name.length === 0) return false;
  name = String(name).trim();
  if (name.length === 0) return false;
  return /^[A-Za-z0-9-_]+$/.test(name);
}
