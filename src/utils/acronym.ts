export const asAcronym = (str: string) =>
  str
    .split(" ")
    .map((part) => part[0])
    .join("");
