// Utils
import { formatCurrency2 } from "../../../../../../utils";
import {
  CTA_SEVERITY_CLASSES,
  severityDotClass,
  type Severity,
} from "../../../../../../utils/severity";

// Interfaces
import type { ItemTone } from "./topItems";
import type { TopItemPricePoint } from "../../../../../../api/topItems";
import type { PriceLine } from "../interfaces";
import type { CtaTone } from "../../../../../../components-dev/interfaces";

export const money = (v: number) => formatCurrency2(v);

/** Points, signed, two places. */
export const pts = (v: number) => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2);

/** Signed dollars, for a gap rather than an amount. */
export const signedMoney = (v: number) =>
  (v >= 0 ? "+" : "−") + formatCurrency2(Math.abs(v));

export const pct = (v: number | null) => (v === null ? "—" : `${v.toFixed(2)}%`);

/** Ahead or behind. No threshold: there is no third state to grade into
 *  when the only question is which of two stores sells more of a thing. */
export const toneOf = (signed: number): "healthy" | "critical" =>
  signed >= 0 ? "healthy" : "critical";

/**
 * The CTA palette for an ungraded row: no verdict, so no severity colour.
 * Same definition the Sub dept tab uses, for the same reason.
 */
const NEUTRAL_CTA = {
  border: "border-line_field",
  bg: "bg-fill_soft",
  hoverBg: "hover:bg-gray-100",
  text: "text-content",
};

/** `unknown` is this tab's own and is not a severity: an item whose margin
 *  the server withheld has not been graded badly, it has not been graded. */
export const ctaClasses = (tone: ItemTone) =>
  tone === "unknown" ? NEUTRAL_CTA : CTA_SEVERITY_CLASSES[tone as Severity];

export const dotClass = (tone: ItemTone) =>
  tone === "unknown" ? "bg-gray-400" : severityDotClass[tone as Severity];

/** Money, or a dash when there is none. */
export const moneyText = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : formatCurrency2(n);

export const pctText = (n: number | null) =>
  n === null ? "—" : `${n > 0 ? "+" : ""}${Math.round(n)}%`;

/** Margin moves in points, not percent: 22% to 11% is eleven points down, and
 *  "-50%" invites someone to read it as half the sales. */
export const pointsText = (n: number | null) =>
  n === null ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(1)}`;

export const dayText = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${Number(m)}/${Number(d)}/${y}`;
};

/** Name, the share bar, and the sales. */
export const LANDING_COLS = "minmax(0,1fr) minmax(0,1.35fr) 96px";

/** One store's units (or pounds) at a price point, or null when it has none. */
export const side = (p: TopItemPricePoint | null) =>
  p === null
    ? null
    : `${(p.weight > 0 ? p.weight : p.units).toLocaleString(undefined, {
        minimumFractionDigits: p.weight > 0 ? 1 : 0,
        maximumFractionDigits: p.weight > 0 ? 1 : 0,
      })} ${p.weight > 0 ? "lb" : "u"} · ${money(p.net_sales)}`;

/**
 * The price points, keyed on the PRICE rather than one table per store.
 *
 * Two tables would make the reader align the rows themselves. Keyed on the
 * price they line up, and a blank cell is the finding: the other store never
 * rang it at this. That is the answer to "why is it bigger there" far more
 * often than anything about the shopper.
 */
export const priceLines = (
  code: string,
  minePoints: TopItemPricePoint[],
  theirsPoints: TopItemPricePoint[],
): PriceLine[] => {
  const byPrice = new Map<number, PriceLine>();
  const put = (p: TopItemPricePoint, side: "mine" | "theirs") => {
    if (p.product_code !== code) return;
    const held =
      byPrice.get(p.price) ?? { price: p.price, mine: null, theirs: null };
    held[side] = p;
    byPrice.set(p.price, held);
  };
  for (const p of minePoints) put(p, "mine");
  for (const p of theirsPoints) put(p, "theirs");
  return [...byPrice.values()].sort((a, b) => b.price - a.price);
};

/** The healthy and critical pill colours. */
export const TONE_PILL: Record<"healthy" | "critical", string> = {
  healthy: "bg-severity_healthy_bg text-severity_healthy_text",
  critical: "bg-severity_critical_bg text-severity_critical_text",
};

/** Informational. Nothing in the outline is a verdict on either store, so it
 *  takes the neutral tone rather than borrowing a severity colour. */
export const OUTLINE_TONE: CtaTone = {
  border: "border-brand_navy/25",
  bg: "bg-bkg",
  hoverBg: "hover:bg-brand_navy/5",
  text: "text-content",
};

/**
 * Keys with a request already in the air.
 *
 * The slice's loading flag cannot do this job. It is read from the render
 * that scheduled the effect, so a second run scheduled from that same render
 * sees the value it had BEFORE the first run dispatched — and development
 * does exactly that: StrictMode mounts, unmounts and mounts again, so the tab
 * asked for all three windows twice on every open.
 *
 * It lives outside React because it has to survive the remount it exists to
 * absorb, and it is keyed by store-and-week so two different stores still
 * fetch independently.
 */
export const inFlight = new Set<string>();
