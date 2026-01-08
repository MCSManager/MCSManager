/**
 * Common network request headers to avoid 403 Forbidden and other security issues.
 * Provides a standardized set of headers for all outward network requests.
 */
export function getCommonHeaders(url?: string) {
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Accept: "*/*",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    Connection: "keep-alive"
  };

  if (url) {
    try {
      const urlObj = new URL(url);
      headers["Referer"] = urlObj.origin;
    } catch (e) {
      // Ignore invalid URL
    }
  }

  return headers;
}
