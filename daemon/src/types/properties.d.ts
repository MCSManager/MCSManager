declare module "properties" {
  function parse(data: string, options?: any): any;
  function stringify(data: any, options?: any): string;

  export { parse, stringify };
}
