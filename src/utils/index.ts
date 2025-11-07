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

const isValid = (val: string | number | undefined | null) => {
  if (typeof val === "undefined" || val === null) {
    return false;
  } else {
    if (typeof val === "string" && val.length === 0) {
      return false;
    }

    if (typeof val === "object") {
      if (Object.keys(val).length === 0) {
        return false;
      }
    }
    return true;
  }
};

const formatCurrency = (
  value: string,
  locale: string = "en-US",
  currency: string = "USD"
): string => {
  if (!isValid(value)) return "";
  const numberValue = parseFloat(value);
  if (isNaN(numberValue)) {
    throw new Error("Invalid number");
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(numberValue);
};

export const formatCurrency2 = (x: number) => {
  const result = x.toString();
  return x < 0 ? `${formatCurrency(result)}` : formatCurrency(result);
};

export const reformatDate = (date: string) => {
  const dte = new Date(date);
  const month = dte.getMonth() + 1;
  const day = dte.getDate();
  const year = dte.getFullYear();
  return `${month}/${day}/${year}`;
};

export const formatBigNumber = (
  value: number,
  decimals: number = 2,
  locale: string = "en-US"
): string => {
  const options: Intl.NumberFormatOptions = {};
  if (decimals !== undefined) {
    options.minimumFractionDigits = decimals;
  }
  return new Intl.NumberFormat(locale, options).format(value);
};
