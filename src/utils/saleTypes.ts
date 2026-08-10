/**
 * Which exception type a page should land on after a search.
 *
 * Lived in `pages/lossPrevention/gradingUtils` while LP was the only consumer.
 * Nothing about it is LP-specific — Cashiers preflights the same exception list
 * off the same transaction rows — so it moved here rather than being copied and
 * left to drift.
 */

/** Valid but usually empty. Never the auto-selected landing tab unless nothing
 *  else came back — landing on one makes a working page look broken before the
 *  user has touched anything. */
const DEPRIORITIZED_DEFAULTS = ["Backup"];

/** Preferred landing types, best first. Matched as normalized prefixes rather
 *  than exact strings so "Refund"/"Refunded" and "Void"/"Voided" both hit — the
 *  backend's exact wording isn't guaranteed, and a near-miss here would
 *  silently fall through to the generic scan instead of erroring. */
const PREFERRED_DEFAULTS = ["refund", "void"];

const normalizeSaleType = (saleType: string) =>
  saleType.toLowerCase().replace(/[^a-z]/g, "");

/**
 * Description and Tender have no tab on either page, so selecting one would
 * leave nothing highlighted.
 */
export const pickDefaultSaleType = <T extends { sale_type: string }>(
  saleTypes: T[],
): T | undefined => {
  const visible = saleTypes.filter(
    (st) => st.sale_type !== "Description" && st.sale_type !== "Tender",
  );

  for (const preferred of PREFERRED_DEFAULTS) {
    const match = visible.find((st) =>
      normalizeSaleType(st.sale_type).startsWith(preferred),
    );
    if (match) return match;
  }

  return (
    visible.find((st) => !DEPRIORITIZED_DEFAULTS.includes(st.sale_type)) ??
    visible[0]
  );
};

/**
 * The same choice for a page whose exception list is bare strings rather than
 * row objects — Cashiers' preflight returns `string[]`.
 */
export const pickDefaultSaleTypeName = (
  saleTypes: string[],
): string | undefined =>
  pickDefaultSaleType(saleTypes.map((sale_type) => ({ sale_type })))?.sale_type;
