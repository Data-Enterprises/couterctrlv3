export const formatDate = (date: string) => {
  const dte = new Date(date);
  const month = dte.getMonth() + 1;
  const day = dte.getDate();
  const year = dte.getFullYear();
  return month + "/" + day + "/" + year;
  // return `${year}-${addZero(month)}-${addZero(day)}`; // just for now
};

export const addDays = (date: string | Date, number: number) => {
  const newDate = new Date(date.toString());
  return new Date(newDate.setDate(newDate.getDate() + number));
};

export const formatGoliathDate = (date: string) => {
  const addZero = (num: number) => (num < 10 ? "0" + num : num);
  const dte = new Date(date);
  const month = dte.getMonth() + 1;
  const day = dte.getDate();
  const year = dte.getFullYear();
  return `${year}-${addZero(month)}-${addZero(day)}`;
};