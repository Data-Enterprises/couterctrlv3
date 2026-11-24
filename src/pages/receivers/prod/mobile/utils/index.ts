/** A searched m/d/yyyy date as a short label, e.g. Nov 9. */
export const fmtSearchDate = (mdy: string) => {
  const [m, d, y] = mdy.split("/");
  return new Date(
    `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T12:00:00`,
  ).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
