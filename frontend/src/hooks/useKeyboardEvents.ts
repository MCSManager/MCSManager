import { onMounted, onUnmounted } from "vue";

export function useKeyboardEvents(
  keyCombination: { ctrl: boolean; alt: boolean; caseSensitive: boolean; key: string },
  fn: Function
) {
  const handleKeydown = (e: KeyboardEvent) => {
    const ctrl = keyCombination.ctrl && (e.ctrlKey || e.metaKey);
    const alt = keyCombination.alt && e.altKey;
    const key = keyCombination.caseSensitive
      ? keyCombination.key
      : keyCombination.key.toLocaleLowerCase();

    const eKey = keyCombination.caseSensitive ? e.key : e.key.toLocaleLowerCase();

    const isCombo = () => {
      if (ctrl && alt) return eKey === key;
      if (ctrl) return eKey === key;
      if (alt) return eKey === key;
      return false;
    };

    if (isCombo()) {
      e.preventDefault();
      fn();
    }
  };

  const removeKeydownListener = () => {
    document.removeEventListener("keydown", handleKeydown);
  };

  const startKeydownListener = () => {
    document.addEventListener("keydown", handleKeydown);
  };

  onMounted(() => {
    startKeydownListener();
  });

  onUnmounted(() => {
    removeKeydownListener();
  });

  return {
    removeKeydownListener,
    startKeydownListener
  };
}
