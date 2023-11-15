export interface DataType {
  name: string;
  type: number;
  size: number;
  time: string;
  mode: number;
}

export interface OperationForm {
  name: string;
  current: number;
  pageSize: number;
  total: number;
}

export interface Breadcrumb {
  path: string;
  name: string;
  disabled: boolean;
}

export interface FileStatus {
  instanceFileTask: number;
  globalFileTask: number;
  platform: string;
  isGlobalInstance: boolean;
  disks: string[];
}

export interface Permission {
  data: {
    owner: string[];
    usergroup: string[];
    everyone: string[];
  };
  deep: boolean;
  loading: boolean;
  item: {
    key: string;
    role: "owner" | "usergroup" | "everyone";
  }[];
}
