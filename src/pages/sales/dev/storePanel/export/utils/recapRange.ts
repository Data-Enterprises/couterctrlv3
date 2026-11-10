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

const md = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

/**
 * An export's dates for its file name, in the store panel's own style: one
 * date ("Nov 3, 2026"), a range in one year ("Nov 1 – Nov 3, 2026"), or a
 * range across two ("Dec 30, 2026 – Jan 2, 2027").
 */
export const fileDateLabel = (from: string, to: string) => {
  const fy = from.slice(0, 4);
  const ty = to.slice(0, 4);
  if (from === to) return `${md(from)}, ${fy}`;
  return fy === ty
    ? `${md(from)} – ${md(to)}, ${ty}`
    : `${md(from)}, ${fy} – ${md(to)}, ${ty}`;
};
