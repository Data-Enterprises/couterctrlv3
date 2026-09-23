export interface WeekBarData {
  sales: number;
  date: string;
}

export const formatDate = (date: string) => {
  const split = date.split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};