/**
 * How Summary names what it keeps, and which days it may keep at all.
 */

/** One store location's day: `storeid__number__date`. The number is in the
 *  key so a co-located store's two locations never share an answer. */
export const dayKey = (storeId: number, storeNumber: string, date: string) =>
  `${storeId}__${storeNumber}__${date}`;

/**
 * How many store-days of folded item rows to keep for the export: two
 * store-weeks. A big grocery day folds to a few hundred KB, so this bounds
 * the cache at a few MB however long someone walks the ledger.
 */
export const RECAP_ITEMS_MAX = 14;

/**
 * How many store-days of item count and price mix to keep: eight store-weeks.
 * Each holds the day's item codes (so a week's distinct count can merge
 * them), a few thousand short strings at a big store.
 */
export const RECAP_MIX_MAX = 56;

/** Today as yyyy-mm-dd, in the reader's own time zone. */
export const localIsoToday = (now: Date = new Date()) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
};

/**
 * Whether a day's item rows may be kept for the export.
 *
 * Not today: the registers are still ringing it, so a copy taken at noon is
 * wrong by close, and an export of it must be read fresh. Every earlier day
 * is finished and safe to reuse.
 */
export const isCacheableDay = (date: string, today: string = localIsoToday()) =>
  date < today;
