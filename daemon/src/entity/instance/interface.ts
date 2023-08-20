import { EventEmitter } from "events";

// interface of docker config
export interface IDockerConfig {
  containerName: string;
  image: string;
  memory: number; // Memory limit in bytes.
  ports: string[];
  extraVolumes: string[];
  maxSpace: number;
  network: number;
  io: number;
  networkMode: string;
  networkAliases: string[];
  cpusetCpus: string; // CPU allowed to execute (eg 0-3, , 0, 1)
  cpuUsage: number;
}

// Instance specific process interface
export interface IInstanceProcess extends EventEmitter {
  pid?: number | string;
  kill: (signal?: any) => any;
  destroy: () => void;
  write: (data?: any) => any;
}
