import { $t } from "../../i18n";

export const PALWORLD_QUOTED_PREFIX = "<__palworld_quoted__>";
export const PALWORLD_RAW_PREFIX = "<__palworld_raw__>";

const SECTION_HEADER = "[/Script/Pal.PalGameWorldSettings]";

function malformed(): never {
  throw new Error($t("TXT_CODE_palworldConfig.malformed"));
}

function findOptionBody(text: string): string {
  if (!text.split(/\r?\n/).some((line) => line.trim() === SECTION_HEADER)) {
    throw new Error($t("TXT_CODE_palworldConfig.sectionMissing"));
  }
  const optionMatch = /^\s*OptionSettings\s*=\s*/m.exec(text);
  if (!optionMatch) throw new Error($t("TXT_CODE_palworldConfig.optionMissing"));
  const openIndex = optionMatch.index + optionMatch[0].length;
  if (text[openIndex] !== "(") malformed();

  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = openIndex; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === "(") depth++;
    else if (char === ")") {
      depth--;
      if (depth === 0) return text.slice(openIndex + 1, index);
      if (depth < 0) malformed();
    }
  }
  malformed();
}

function splitOptions(body: string): string[] {
  const entries: string[] = [];
  let start = 0;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < body.length; index++) {
    const char = body[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === "(") depth++;
    else if (char === ")") {
      depth--;
      if (depth < 0) malformed();
    } else if (char === "," && depth === 0) {
      entries.push(body.slice(start, index).trim());
      start = index + 1;
    }
  }
  if (quoted || depth !== 0) malformed();
  entries.push(body.slice(start).trim());
  return entries.filter((entry) => entry.length > 0);
}

function decodeValue(rawValue: string): string | number | boolean {
  if (/^(true|false)$/i.test(rawValue)) return rawValue.toLowerCase() === "true";
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(rawValue)) return Number(rawValue);
  if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
    const value = rawValue.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    return PALWORLD_QUOTED_PREFIX + value;
  }
  return PALWORLD_RAW_PREFIX + rawValue;
}

function encodeValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") malformed();
  if (value.startsWith(PALWORLD_QUOTED_PREFIX)) {
    const content = value
      .slice(PALWORLD_QUOTED_PREFIX.length)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
    return `"${content}"`;
  }
  if (value.startsWith(PALWORLD_RAW_PREFIX)) return value.slice(PALWORLD_RAW_PREFIX.length);
  const content = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${content}"`;
}

export function parsePalworldConfig(text: string): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const entry of splitOptions(findOptionBody(text))) {
    const separator = entry.indexOf("=");
    if (separator <= 0) malformed();
    const key = entry.slice(0, separator).trim();
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(key)) malformed();
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      throw new Error($t("TXT_CODE_palworldConfig.duplicate", { key }));
    }
    result[key] = decodeValue(entry.slice(separator + 1).trim());
  }
  return result;
}

export function stringifyPalworldConfig(config: object): string {
  if (!config || Array.isArray(config)) malformed();
  const entries = Object.entries(config).map(([key, value]) => {
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(key)) malformed();
    return `${key}=${encodeValue(value)}`;
  });
  if (entries.length === 0) malformed();
  return `${SECTION_HEADER}\nOptionSettings=(${entries.join(",")})\n`;
}
