export const formatDate= (dateStr: string) => {
  const split = dateStr.split("T")[0].split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};