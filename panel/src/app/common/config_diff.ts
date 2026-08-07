const SENSITIVE_KEY_REGEX = /passw(or)?d|secret|token|api_?key/i;
const MASK_TEXT = "******";

const DIFF_EXCLUDED_KEY_REGEX = /^(passw(or)?d|passWordType|salt|secret|api_?key)$/i;

export interface ConfigDiffResult {
  before: Record<string, any>;
  after: Record<string, any>;
}

export function maskSensitiveValues<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => maskSensitiveValues(item)) as unknown as T;
  }
  if (typeof value === "object") {
    const result: Record<string, any> = {};
    for (const key of Object.keys(value as Record<string, any>)) {
      const item = (value as Record<string, any>)[key];
      if (SENSITIVE_KEY_REGEX.test(key) && item != null && item !== "") {
        result[key] = MASK_TEXT;
        continue;
      }
      result[key] = maskSensitiveValues(item);
    }
    return result as T;
  }
  return value;
}

function isPlainObject(value: any) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isSameValue(a: any, b: any) {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function diffValue(before: any, after: any): { before: any; after: any } | null {
  if (after === null || after === undefined || typeof after === "function") return null;
  if (!isPlainObject(after) || !isPlainObject(before)) {
    if (isSameValue(before, after)) return null;
    return { before: before ?? null, after };
  }

  const changedBefore: Record<string, any> = {};
  const changedAfter: Record<string, any> = {};
  let changed = false;
  for (const key of Object.keys(after)) {
    if (DIFF_EXCLUDED_KEY_REGEX.test(key)) continue;
    const child = diffValue(before[key], after[key]);
    if (!child) continue;

    changedBefore[key] = child.before;
    changedAfter[key] = child.after;
    changed = true;
  }
  return changed ? { before: changedBefore, after: changedAfter } : null;
}

export function diffConfig(before: any, after: any): ConfigDiffResult | null {
  if (!isPlainObject(after)) return null;

  const result = diffValue(isPlainObject(before) ? before : {}, after);
  if (!result) return null;

  return {
    before: maskSensitiveValues(result.before ?? {}),
    after: maskSensitiveValues(result.after ?? {})
  };
}
