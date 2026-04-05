export const permission2number = (
  owner: string[],
  usergroup: string[],
  everyone: string[]
): number => {
  const calculate = (arr: string[]): number => {
    return arr.reduce((acc, cur) => acc + parseInt(cur), 0);
  };
  return parseInt(`${calculate(owner)}${calculate(usergroup)}${calculate(everyone)}`);
};

export const number2permission = (permission: number) => {
  const calculate = (num: number): string[] => {
    const arr: string[] = [];
    if (num - 4 >= 0) {
      arr.push("4");
      num -= 4;
    }
    if (num - 2 >= 0) {
      arr.push("2");
      num -= 2;
    }
    if (num - 1 >= 0) {
      arr.push("1");
      num -= 1;
    }
    return arr;
  };
  const str = permission.toString().padStart(3, "0");
  return {
    owner: calculate(parseInt(str[0])),
    usergroup: calculate(parseInt(str[1])),
    everyone: calculate(parseInt(str[2]))
  };
};
