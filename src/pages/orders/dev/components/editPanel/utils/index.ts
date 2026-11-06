/** An order's date as the panel prints it: m/d/yyyy. */
export const fmtOrderDate = (iso: string) => {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${+m}/${+d}/${y}`;
};

/** A store number padded to three digits. */
export const padStoreNumber = (n: string | number) => String(n).padStart(3, "0");
