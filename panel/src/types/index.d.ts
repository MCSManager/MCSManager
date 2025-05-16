import { SecureVersion } from "tls";

declare module "*.json" {
  const value: any;
  export default value;
}
export interface HttpsOptions {
  key: string,
  cert: string,
  min_tls_version?: SecureVersion,
  type: "file_path" | "text",
  domain?: string,
}