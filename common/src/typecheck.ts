export function configureEntityParams(self: any, args: any, key: string, typeFn?: Function): any {
  const selfDefaultValue = self[key] ?? null;
  const v = args[key] != null ? args[key] : selfDefaultValue;

  if (typeFn === Number) {
    if (v === "" || v == null) {
      self[key] = null;
    } else {
      if (isNaN(Number(v)))
        throw new Error(
          `ConfigureEntityParams Error: Expected type to be Number, but got ${typeof v}`
        );
      self[key] = Number(v);
    }
    return;
  }

  if (typeFn === String) {
    if (v == null) {
      self[key] = null;
    } else {
      self[key] = String(v);
    }
    return;
  }

  if (typeFn === Boolean) {
    if (v == null) {
      self[key] = false;
    } else {
      self[key] = Boolean(v);
    }
    return;
  }

  if (typeFn) {
    self[key] = typeFn(v);
  } else {
    self[key] = v;
  }
}

export function toText(v: any): string | null {
  if (isEmpty(v)) return null;
  return String(v);
}

export function toNumber(v: any): number | null {
  if (isEmpty(v)) return null;
  if (isNaN(Number(v))) return null;
  return Number(v);
}

export function toBoolean(v: any): boolean | null {
  if (isEmpty(v)) return null;
  return Boolean(v);
}

export function isEmpty(v: any): boolean {
  return v === null || v === undefined;
}

export function supposeValue<T>(v: any, def?: T) {
  if (isEmpty(v)) return def;
  return v;
}
