// Utils
import { severityDotClass } from "../../../../../utils/severity";
import { SHARE_BAND_PCT, type ShareStanding } from "./shareBalance";
import { storeKeyOf } from "./shareByDay";

// Interfaces
import type { CtaTone } from "../../../../../components-dev/interfaces";
import type { Excluded } from "../../utils/storeComparison";

// Components
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  MinusIcon,
} from "@heroicons/react/16/solid";

/** Share bars read 0–25% of the group. Above a quarter the bar is full and
 *  the number beside it carries the rest — a scale set by the biggest store
 *  would squash every other row flat in a fifty-store group. */
export const BAR_CEILING_PCT = 25;

/**
 * Tone, not grade: these say WHICH WAY share moved, the same distinction the
 * grid's standing pills make with the same tokens. The severity family is for
 * grading a figure against a threshold, which is a different question and
 * belongs to the dots.
 */
export const BALANCE_TONE: Record<ShareStanding, { pill: string; text: string; bar: string }> =
  {
    falling: {
      pill: "bg-delta_negative_bg text-delta_negative_text",
      text: "text-delta_negative_text",
      bar: severityDotClass.critical,
    },
    consistent: {
      pill: "bg-gray-200 text-content",
      text: "text-content",
      bar: "bg-brand_navy",
    },
    rising: {
      pill: "bg-delta_positive_bg text-delta_positive_text",
      text: "text-delta_positive_text",
      bar: severityDotClass.healthy,
    },
  };

/** What each share standing means, for its tooltip. */
export const BAND_WHY: Record<ShareStanding, string> = {
  falling: `lost more than ${SHARE_BAND_PCT}% of the group`,
  consistent: `within ${SHARE_BAND_PCT}% of usual`,
  rising: `gained more than ${SHARE_BAND_PCT}% of the group`,
};

/** Each share standing's name. */
export const BAND_LABEL: Record<ShareStanding, string> = {
  falling: "Falling",
  consistent: "Consistent",
  rising: "Rising",
};

/** The standings in the order the balance lists them. */
export const ORDER: ShareStanding[] = ["falling", "consistent", "rising"];

/** Shared by the column heads and every row — two copies of this is a column
 *  that slides out from under its own name.
 *
 *  The store name takes a tenth of the bar's room on top of its 142px, so
 *  more of a long name shows and the bar is 10% shorter at any width: the
 *  room the two share is the row less the three figure columns and four
 *  8px gaps (226px). */
export const COLS =
  "minmax(0,calc(142px + (100% - 226px - 142px) * 0.1)) minmax(0,1fr) 58px 62px 74px";

/** Points of the group, written as a percentage because that is what the
 *  column beside it is. */
export const changeText = (n: number) =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}%`;

/** A share's bar width, against BAR_CEILING_PCT and capped at full. */
export const widthOf = (pct: number) =>
  `${Math.min(100, Math.max(0, (pct / BAR_CEILING_PCT) * 100))}%`;

/** Co-located stores share one storeid, so neither half identifies a store on
 *  its own — the same key the day shares are gathered under. */
export const keyOf = (r: { storeid: number; storeNumber: string }) =>
  storeKeyOf({ storeid: r.storeid, store_number: r.storeNumber });

/** Tone, not grade: which way share moved. The severity family grades a
 *  figure against a threshold, which is a different question. */
export const DETAIL_TONE: Record<
  ShareStanding,
  { pill: string; text: string; bar: string; card: string }
> = {
  falling: {
    pill: "bg-delta_negative_bg text-delta_negative_text",
    text: "text-delta_negative_text",
    bar: severityDotClass.critical,
    card: "bg-delta_negative_bg",
  },
  consistent: {
    pill: "bg-gray-200 text-content",
    text: "text-content",
    bar: "bg-brand_navy",
    card: "bg-fill_soft",
  },
  rising: {
    pill: "bg-delta_positive_bg text-delta_positive_text",
    text: "text-delta_positive_text",
    bar: severityDotClass.healthy,
    card: "bg-delta_positive_bg",
  },
};

/** What the house strip wants, in the delta family: this says which way
 *  share moved, so it is not graded and cannot use CTA_SEVERITY_CLASSES. */
export const CTA_TONE: Record<ShareStanding, CtaTone> = {
  falling: {
    border: "border-delta_negative_text/25",
    bg: "bg-delta_negative_bg",
    hoverBg: "hover:bg-delta_negative_text/10",
    text: "text-delta_negative_text",
  },
  consistent: {
    border: "border-line_field",
    bg: "bg-fill_soft",
    hoverBg: "hover:bg-fill_muted",
    text: "text-content",
  },
  rising: {
    border: "border-delta_positive_text/25",
    bg: "bg-delta_positive_bg",
    hoverBg: "hover:bg-delta_positive_text/10",
    text: "text-delta_positive_text",
  },
};

/** The strip's icon, by which way share moved — the same slot the Sub dept
 *  and Top 200 strips give their severity icon. */
export const CTA_ICON: Record<ShareStanding, typeof ArrowTrendingDownIcon> = {
  falling: ArrowTrendingDownIcon,
  consistent: MinusIcon,
  rising: ArrowTrendingUpIcon,
};

/** A percent to one decimal. */
export const pct1 = (n: number) => `${n.toFixed(1)}%`;

/** Why a store is left out of the comparison, in a word or two. */
export const EXCLUDED_LABEL: Record<Excluded, string> = {
  "no-baseline": "No baseline",
  "partial-week": "Short week",
  "nothing-to-compare": "Nothing to compare",
};

/** Whole percent. This reads as a headline above eight stores, and a tenth
 *  of a point on a $1.4M group is noise dressed as precision. */
export const pct0 = (v: number | null) =>
  v === null ? "—" : `${v >= 0 ? "+" : ""}${Math.round(v)}%`;
