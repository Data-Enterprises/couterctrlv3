/** The longest span Items Sold reads: a day's items are one read each. */
export const MAX_EXPORT_DAYS = 31;

/**
 * Every date from `from` to `to`, inclusive, as yyyy-mm-dd. Empty when `to`
 * is before `from`. Counted in UTC so a clock change can never skip or
 * repeat a day.
 */
export const datesBetween = (from: string, to: string): string[] => {
  const out: string[] = [];
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  if (!fy || !ty) return out;
  const end = Date.UTC(ty, tm - 1, td);
  for (let t = Date.UTC(fy, fm - 1, fd); t <= end; t += 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
};
