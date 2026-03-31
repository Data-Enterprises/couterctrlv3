export const formatSubDate = (date: string) => {
  const split = date.split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};