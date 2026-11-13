/**
 * The option list as the control should draw it.
 *
 * Unavailable options are kept rather than dropped, so the list does not
 * reflow as somebody filters and a dead pick can be seen rather than
 * guessed at. A dead pick that is SELECTED goes to the top: in a list of two
 * thousand items it is the one thing worth finding, and it is the reason the
 * screen is empty.
 */
export const markAvailability = <T extends { value: string }>(
  options: T[],
  available: Set<string>,
  selected: string[],
): (T & { unavailable: boolean })[] => {
  const picked = new Set(selected);
  const marked = options.map((o) => ({
    ...o,
    unavailable: !available.has(o.value),
  }));
  const deadPicks = marked.filter((o) => o.unavailable && picked.has(o.value));
  if (deadPicks.length === 0) return marked;
  const rest = marked.filter((o) => !(o.unavailable && picked.has(o.value)));
  return [...deadPicks, ...rest];
};
