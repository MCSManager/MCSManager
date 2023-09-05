declare module "properties" {
  function parse(data: string, options?: any): any;
  function stringify(data: any, options?: any): string;

  export { parse, stringify };
}

declare module "*.json" {
  const value: any;
  export default value;
}
