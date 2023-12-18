import { ComponentOptions } from "vue";

export {};

declare module "vue" {
  export const componentOptions: ComponentOptions;
  export interface GlobalComponents {
    ATypographyParagraph: any;
    ATypographyText: any;
    ATypographyTitle: any;
  }
}
