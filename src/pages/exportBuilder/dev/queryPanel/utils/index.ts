/** One look for the whole toolbar row, so none of them reads as the odd one. */
export const QUERY_ACTION =
  "text-[11.5px] font-semibold px-2.5 py-1 rounded border border-brand_line_2 hover:border-brand_slate transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

/** A saved query's date, short. */
export const savedOn = (iso: string) => {
  const at = new Date(iso);
  return Number.isNaN(at.getTime())
    ? ""
    : at.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
