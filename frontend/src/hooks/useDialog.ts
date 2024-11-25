import { ref } from "vue";

export function useDialog<T = any>(props: any) {
  const isVisible = ref(false);

  const openDialog = async () => {
    isVisible.value = true;
  };

  const cancel = async () => {
    isVisible.value = false;
    if (props.destroyComponent) props.destroyComponent();
  };

  const submit = async (data?: T) => {
    if (props.emitResult) props.emitResult(data);
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
