import { globalConfiguration } from "../entity/config";

export function initApiKey() {
  // Initialize the global configuration service
  globalConfiguration.load();
  const config = globalConfiguration.config;
}
