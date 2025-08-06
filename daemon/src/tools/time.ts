export const formatTime = (seconds: number) => {
  if (seconds < 60) return Math.round(seconds) + "s";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return minutes + "m " + remainingSeconds + "s";
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
