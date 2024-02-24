import { ref } from "vue";

const TERMINAL_HISTORY_KEY = "TERMINAL_HISTORY_KEY";

export const useCommandHistory = () => {
  const commandInputValue = ref<string>("");

  const history = ref<string[]>([]);

  const focusHistoryList = ref(false);

  const selectLocation = ref(0);

  const setHistory = (text: string) => {
    if (!text) return;
    const history = JSON.parse(localStorage.getItem(TERMINAL_HISTORY_KEY) || "[]") as string[];
    const index = history.indexOf(text);
    if (index !== -1) history.splice(index, 1);
    history.unshift(text);
    if (history.length > 30) history.pop();
    localStorage.setItem(TERMINAL_HISTORY_KEY, JSON.stringify(history));
  };

  const getHistory = () => {
    const history = JSON.parse(localStorage.getItem(TERMINAL_HISTORY_KEY) || "[]") as string[];
    return history.filter((item) => item.startsWith(commandInputValue.value)).splice(0, 10);
  };

  history.value = getHistory();

  const openHistoryList = () => {
    history.value = getHistory();
    focusHistoryList.value = true;
    selectLocation.value = 0;
  };

  const closeHistoryList = () => {
    focusHistoryList.value = false;
  };

  const clickHistoryItem = (item: string) => {
    commandInputValue.value = item;
    closeHistoryList();
  };

  const handleHistorySelect = (e: KeyboardEvent) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown" && e.key !== "Enter" && e.key !== "Escape") {
      if (focusHistoryList.value === true) closeHistoryList();
      return;
    }
    if (e.key === "Escape") return closeHistoryList();
    if (e.key === "Enter" && focusHistoryList.value === false) return;
    if (focusHistoryList.value === false) {
      return openHistoryList();
    }
    const body = document.querySelector("body");
    if (body) body.style.overflowY = "hidden";
    if (e.key === "ArrowUp") {
      if (selectLocation.value <= 0) {
        selectLocation.value = history.value.length - 1;
      } else {
        selectLocation.value--;
      }
    }
    if (e.key === "ArrowDown") {
      if (selectLocation.value >= history.value.length - 1) {
        selectLocation.value = 0;
      } else {
        selectLocation.value++;
      }
    }
    if (e.key === "Enter") {
      commandInputValue.value = history.value[selectLocation.value];
      closeHistoryList();
    }

    // document.querySelector("#Terminal-History-Select-Item")?.scrollIntoView({
    //   behavior: "smooth",
    //   block: "center"
    // });
    if (body) body.style.overflowY = "auto";
  };

  return {
    history,
    focusHistoryList,
    selectLocation,
    commandInputValue,
    setHistory,
    getHistory,
    openHistoryList,
    closeHistoryList,
    clickHistoryItem,
    handleHistorySelect
  };
};
