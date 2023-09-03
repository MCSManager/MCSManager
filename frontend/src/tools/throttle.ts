export function throttle(func: (...args: any) => void, time: number = 1000): Function {
  let lastTime = 0;
  let timeoutId: NodeJS.Timeout;

  return function (...args: any[]) {
    const now = Date.now();
    const elapsedTime = now - lastTime;

    if (elapsedTime >= time) {
      func(...args);
      lastTime = now;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastTime = Date.now();
      }, time - elapsedTime);
    }
  };
}
