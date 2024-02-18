import { EventEmitter } from "events";

// Instance specific process interface
export interface IInstanceProcess extends EventEmitter {
  pid?: number | string;
  kill: (signal?: any) => any;
  destroy: () => void;
  write: (data?: any) => any;
}
