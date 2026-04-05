/* eslint-disable no-unused-vars */
import { ref } from "vue";

export function useDialog<T = any>(props: any) {
  let resolve: (value?: T) => void;
  let reject: (reason?: any) => void;
  const isVisible = ref(false);

  const openDialog = async () => {
    isVisible.value = true;
    return new Promise<T | undefined>((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });
  };

  const cancel = async () => {
    isVisible.value = false;
    if (props.destroyComponent) props.destroyComponent();
    reject(new Error("cancel"));
  };

  const submit = async (data?: T) => {
    if (props.emitResult) props.emitResult(data);
    resolve(data);
    await cancel();
  };

  return {
    openDialog,
    isVisible,
    cancel,
    submit
  };
}

export function usePromiseDialog<T = any>(props: any) {
  const { isVisible, ...rest } = useDialog<T>(props);
  isVisible.value = true;
  return {
    isVisible,
    ...rest
  };
}
