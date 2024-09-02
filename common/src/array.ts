export function arrayUnique<T>(arr: T[], felidName?: string): T[] {
  if (!felidName) return Array.from(new Set(arr));
  const map = new Map();
  return arr.filter((v: any) => !map.has(v[felidName]) && map.set(v[felidName], v));
}
