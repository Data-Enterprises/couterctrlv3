import type { CouponTier } from "../../../features/couponSalesSlice";
import type { SevFilter } from "../../../features/salesLedgerSlice";
import type { Tier } from "../../../utils/grading";
import type { CouponRow } from "../shared/couponGrading";

/**
 * The one place the coupon tier scale meets the shared mobile components.
 *
 * Coupon Sales grades `critical | watch | ok | ungraded`; `SevBadge` and
 * `SevChips` speak `critical | watch | healthy | ungraded`. Only "ok" and
 * "healthy" differ, and mapping it in each of the three screens is how the
 * two drift apart — so it is mapped once, here.
 */
export const badgeTier = (tier: CouponTier): Tier =>
  tier === "ok" ? "healthy" : tier;

/** Counts for the `SevChips` row. "all" deliberately counts every row
 *  including ungraded ones, so the chip agrees with the list underneath it
 *  when nothing is filtered. Ungraded gets its own trailing chip — folding it
 *  into healthy would claim a verdict the baseline never gave. */
export const tierCounts = (rows: CouponRow[]): Record<SevFilter, number> => ({
  all: rows.length,
  critical: rows.filter((r) => r.tier === "critical").length,
  watch: rows.filter((r) => r.tier === "watch").length,
  healthy: rows.filter((r) => r.tier === "ok").length,
});

export const ungradedCount = (rows: CouponRow[]): number =>
  rows.filter((r) => r.tier === "ungraded").length;

/** `SevChips` is typed on `SevFilter`, and this page has a fifth state, so the
 *  active value is a plain string. `"ungraded"` is only ever produced by the
 *  extra chip. */
export type CouponFilter = SevFilter | "ungraded";

export const filterByTier = (
  rows: CouponRow[],
  filter: CouponFilter,
): CouponRow[] => {
  if (filter === "all") return rows;
  if (filter === "healthy") return rows.filter((r) => r.tier === "ok");
  return rows.filter((r) => r.tier === filter);
};
