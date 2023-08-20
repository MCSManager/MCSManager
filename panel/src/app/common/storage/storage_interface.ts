export interface IStorage {
  store(category: string, uuid: string, object: any): Promise<void>;
  load(category: string, classz: any, uuid: string): Promise<any>;
  list(category: string): Promise<Array<string>>;
  delete(category: string, uuid: string): Promise<void>;
}