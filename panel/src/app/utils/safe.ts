export function checkSafeName(name: string) {
  return /^[A-Za-z0-9-_]+$/.test(name);
}
