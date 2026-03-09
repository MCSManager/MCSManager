/**
 * Returns gradient stroke color for progress bar by percent (Ant Design Progress strokeColor).
 * - > 80%: red gradient
 * - > 50%: yellow gradient
 * - otherwise: blue gradient
 */
export function getProgressStrokeColor(percent: number): { "0%": string; "100%": string } {
  if (percent > 80) {
    return { "0%": "#ff4d4f", "100%": "#ff4d4f" };
  }
  if (percent > 50) {
    return { "0%": "#faad14", "100%": "#faad14" };
  }
  return { "0%": "#1890ff", "100%": "#1890ff" };
}
