import { useMountComponent } from "@/hooks/useMountComponent";
import IframeModal from "./index.vue";

export interface IframeModalOptions {
  src: string;
  title?: string;
  width?: string | number;
  height?: string | number;
  closable?: boolean;
  maskClosable?: boolean;
}

/**
 * Open Iframe Modal
 * @param options Modal configuration options
 * @returns Promise<any> Returns modal result
 */
export function openIframeModal(options: IframeModalOptions): Promise<any> {
  const { mount } = useMountComponent(options);
  const result = mount<any>(IframeModal);
  return result || Promise.resolve(null);
}

/**
 * Load Iframe modal component instance
 * @param options Modal configuration options
 * @returns Component instance and related methods
 */
export function loadIframeModal(options: IframeModalOptions) {
  const { loadApp } = useMountComponent(options);
  return loadApp(IframeModal);
}
