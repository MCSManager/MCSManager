import prettyBytes, { type Options } from "pretty-bytes";

export const formatMemoryUsage = (usage?: number, limit?: number) => {
  const config: Options = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    binary: true
  };
  const fUsage = prettyBytes(usage ?? 0, config);
  const fLimit = prettyBytes(limit ?? 0, config);

  return limit ? `${fUsage} / ${fLimit}` : fUsage;
};
