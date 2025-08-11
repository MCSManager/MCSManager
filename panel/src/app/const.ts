import path from "path";

export const FILENAME_BLACKLIST = ["\\", "/", ".", "'", '"', "?", "*", "<", ">"];

export const MARKET_CACHE_FILE_PATH = path.normalize(
  path.join(process.cwd(), "data", "market_cache.json")
);
