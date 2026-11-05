import { formatCurrency2 } from "../../../../../../utils";
import {
  CTA_SEVERITY_CLASSES,
  severityDotClass,
  type Severity,
} from "../../../../../../utils/severity";
import type { ItemTone } from "./topItems";

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
  border: "border-gray-200",
  bg: "bg-gray-50",
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
