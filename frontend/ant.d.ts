/* eslint-disable no-unused-vars */
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

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $t: (...args: any[]) => string;
  }
}
