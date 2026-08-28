import { SERIES } from "./case/chartTheme";

/**
 * The colour of an exception type. Keyed by NAME, and stable forever.
 *
 * `chartTheme.colourFor` picks a hue by the type's index in whatever array it
 * was handed, and that array is sorted by movement — so the same exception
 * type came out a different colour for a different cashier, and a different
 * colour for the same cashier in a different week. Two screenshots of the same
 * void spike disagreed. Anyone who learns "violet is Voided" has to be able to
 * keep that, which means the hue cannot depend on rank, on a filter, or on who
 * is being looked at.
 *
 * The five hues themselves are unchanged — they pass their colour-blind
 * separation and contrast checks as a SET, so do not substitute one without
 * re-running that check on all five.
 */

/**
 * The types LP actually grades, each pinned to its own slot.
 *
 * Order here is the slot order, not a ranking: `Voided` takes SERIES[0]
 * whether it is the loudest type on the page or absent from it entirely.
 */
const SLOT: Record<string, number> = {
  Voided: 0,
  Cancelled: 1,
  "No Sale": 2,
  Refunded: 3,
  Suspended: 4,
};

/**
 * Anything the backend sends that isn't in `SLOT` still needs a colour that
 * does not move. Hashing the name gives one: same name, same hue, every time.
 * It can land on a slot a known type already holds — rare enough to accept,
 * and far better than a hue that changes between two views of one cashier.
 */
const hashOf = (saleType: string) => {
  let h = 0;
  for (let i = 0; i < saleType.length; i += 1) {
    h = (h * 31 + saleType.charCodeAt(i)) >>> 0;
  }
  return h;
};

export const hueFor = (saleType: string): string => {
  const slot = SLOT[saleType];
  return SERIES[
    (slot === undefined ? hashOf(saleType) : slot) % SERIES.length
  ];
};

/** The slot order, for anything that has to stack or legend consistently. */
export const typeOrder = (saleType: string) =>
  SLOT[saleType] ?? SERIES.length + (hashOf(saleType) % 1000);
