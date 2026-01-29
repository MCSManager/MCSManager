export type JavaRuntime = IJavaRuntime;
export type JavaInfo = IJavaInfo;

export interface AddJavaConfigItem {
  name: string;
  path: string;
}

export interface DownloadJavaConfigItem {
  name: string;
  version: string;
}
