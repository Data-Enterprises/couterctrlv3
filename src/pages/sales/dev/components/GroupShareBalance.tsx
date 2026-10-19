import { useMemo, useState } from "react";
import { formatBigNumber, formatCurrencyCompact } from "../../../../utils";
import { applyStoreNumberToName } from "../shared/ledgerUtils";
import {
  shareBalanceOf,
  shareRowsOf,
  SHARE_BAND_PCT,
  type ShareRow,
  type ShareStanding,
} from "../shared/shareBalance";
import { shareDaysOf, storeKeyOf } from "../shared/shareByDay";
import GroupShareStoreDetail from "./GroupShareStoreDetail";
import type { ComparisonRow } from "../shared/storeComparison";
import type { LedgerRowData } from "./LedgerRow";
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";

/**
 * Each store's share of group sales, as a balance.
 *
 * Sits below the day cards and owns nothing above them. Everything it draws
 * comes off `ComparisonRow`s the panel already has, so it costs no fetch and
 * cannot disagree with the day cards beside it.
 *
 * The point of the view is that shares total 100%: a store only gains weight
 * by taking it from the others, so a fall always has a matching rise and the
 * panel can name it. `shareBalance` holds that arithmetic; this file is the
 * drawing, and the rail on the right reads one store out of it.
 */

/** Share bars read 0–25% of the group. Above a quarter the bar is full and
 *  the number beside it carries the rest — a scale set by the biggest store
 *  would squash every other row flat in a fifty-store group. */
const BAR_CEILING_PCT = 25;

/**
 * Tone, not grade: these say WHICH WAY share moved, the same distinction the
 * grid's standing pills make with the same tokens. The severity family is for
 * grading a figure against a threshold, which is a different question and
 * belongs to the dots.
 */
const TONE: Record<
  ShareStanding,
  { pill: string; text: string; bar: string; rule: string }
> = {
  falling: {
    pill: "bg-delta_negative_bg text-delta_negative_text",
    text: "text-delta_negative_text",
    bar: "bg-delta_negative_text",
    rule: "border-delta_negative_bg",
  },
  consistent: {
    pill: "bg-gray-100 text-content/85",
    text: "text-content",
    bar: "bg-brand_navy",
    rule: "border-gray-200",
  },
  rising: {
    pill: "bg-delta_positive_bg text-delta_positive_text",
    text: "text-delta_positive_text",
    bar: "bg-delta_positive_text",
    rule: "border-delta_positive_bg",
  },
};

const BAND_WHY: Record<ShareStanding, string> = {
  falling: `lost more than ${SHARE_BAND_PCT}% of the group`,
  consistent: `within ${SHARE_BAND_PCT}% of usual`,
  rising: `gained more than ${SHARE_BAND_PCT}% of the group`,
};

const BAND_LABEL: Record<ShareStanding, string> = {
  falling: "Falling",
  consistent: "Consistent",
  rising: "Rising",
};

const stores = (n: number) => `${n} store${n === 1 ? "" : "s"}`;

const ORDER: ShareStanding[] = ["falling", "consistent", "rising"];

/** Points of the group, written as a percentage because that is what the
 *  column beside it is. */
const changeText = (n: number) =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}%`;

const widthOf = (pct: number) =>
  `${Math.min(100, Math.max(0, (pct / BAR_CEILING_PCT) * 100))}%`;

/** Co-located stores share one storeid, so neither half identifies a store on
 *  its own — the same key the day shares are gathered under. */
const keyOf = (r: { storeid: number; storeNumber: string }) =>
  storeKeyOf({ storeid: r.storeid, store_number: r.storeNumber });

interface Props {
  /** The comparison the panel is already showing, scoped the same way. */
  rows: ComparisonRow[];
  /** The same stores unreduced, for the selected store's day strip. Scoped to
   *  a day upstream it carries one day, and the strip stands itself down. */
  ledgerRows: LedgerRowData[];
  /** The group's total on the active metric, for pricing a share point. */
  groupTotal: number;
  gradingMetric: GradingMetric;
  /** Opens the store's own report — the panel the ledger row opens. */
  onOpenStore: (storeid: number) => void;
}

const GroupShareBalance = ({
  rows,
  ledgerRows,
  groupTotal,
  gradingMetric,
  onOpenStore,
}: Props) => {
  const [pickedKey, setPickedKey] = useState<string | null>(null);

  const isQty = gradingMetric === "qty";
  const plain = (n: number) =>
    isQty
      ? formatBigNumber(Math.abs(n), 0)
      : formatCurrencyCompact(Math.abs(n));
  const money = (n: number) =>
    `${n > 0 ? "+" : n < 0 ? "−" : ""}${
      isQty
        ? formatBigNumber(Math.abs(n), 0)
        : formatCurrencyCompact(Math.abs(n))
    }`;

  const shareRows = useMemo(() => shareRowsOf(rows), [rows]);
  const balance = useMemo(() => shareBalanceOf(shareRows), [shareRows]);

  const banded = useMemo(() => {
    const by: Record<ShareStanding, ShareRow[]> = {
      falling: [],
      consistent: [],
      rising: [],
    };
    shareRows.forEach((r) => by[r.standing].push(r));
    return by;
  }, [shareRows]);

  // The store the rail reads. Nothing picked lands on the biggest faller,
  // which is the question the panel exists to answer — not an empty rail
  // asking to be clicked before it says anything.
  const picked = useMemo(() => {
    const byKey = shareRows.find((r) => keyOf(r) === pickedKey);
    return byKey ?? balance.lost[0] ?? shareRows[0] ?? null;
  }, [shareRows, pickedKey, balance.lost]);

  // The denominator has to be the set the weekly share was worked out over,
  // or the day shares will not sit around the weekly one.
  const countedKeys = useMemo(() => new Set(shareRows.map(keyOf)), [shareRows]);

  const days = useMemo(
    () =>
      picked
        ? shareDaysOf(
            ledgerRows,
            countedKeys,
            keyOf(picked),
            picked.usualPct,
            gradingMetric,
          )
        : [],
    [ledgerRows, countedKeys, picked, gradingMetric],
  );

  if (shareRows.length < 2) return null;

  const moved = Math.abs(balance.lostTotal);

  return (
    <div data-help="share-balance" className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-baseline gap-2.5 px-4 py-2 flex-shrink-0">
        <span className="text-[13px] font-semibold text-content flex-shrink-0">
          Each store&rsquo;s share of group sales
        </span>
        <span className="text-[11.5px] text-content/85 leading-snug">
          <span className="font-semibold text-content">{plain(moved)}</span> of
          the group&rsquo;s week moved from {stores(balance.lost.length)} to{" "}
          {stores(balance.gained.length)} that took more than usual.
          {Math.abs(balance.imbalance) > 1 && (
            <span className="text-severity_watch_text font-semibold">
              {" "}
              {plain(Math.abs(balance.imbalance))} of it does not cancel — these
              stores are not all graded on the same period.
            </span>
          )}
        </span>
      </div>

      <div className="px-4 pb-3 flex-1 min-h-0 flex flex-col">
        <div className="flex gap-3 flex-1 min-h-0">
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
              {ORDER.filter((s) => banded[s].length > 0).map((standing) => {
                const band = banded[standing];
                const total = band.reduce((n, r) => n + r.money, 0);
                return (
                  <div key={standing} className="mb-3 last:mb-0">
                    <div
                      className={`flex items-baseline gap-2 pb-1 border-b-2 ${TONE[standing].rule}`}
                    >
                      <span
                        className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full ${TONE[standing].pill}`}
                      >
                        {BAND_LABEL[standing]} ({band.length})
                      </span>
                      <span className="text-[11px] text-content/85">
                        {BAND_WHY[standing]}
                      </span>
                      <span className="flex-1" />
                      <span
                        className={`text-[12px] font-semibold tabular-nums ${TONE[standing].text}`}
                      >
                        {money(total)}
                      </span>
                    </div>

                    {band.map((r) => {
                      const sel = picked !== null && keyOf(picked) === keyOf(r);
                      return (
                        <button
                          key={keyOf(r)}
                          onClick={() => setPickedKey(keyOf(r))}
                          className={`w-full grid items-center gap-2 px-1 py-1.5 border-l-2 border-b border-b-gray-100 text-left transition-colors ${
                            sel
                              ? "bg-row_selected border-row_selected_border"
                              : "border-transparent hover:bg-gray-50"
                          }`}
                          style={{
                            gridTemplateColumns:
                              "minmax(0,164px) minmax(0,1fr) 46px 48px 64px",
                          }}
                        >
                          <span className="min-w-0">
                            {/* Co-located stores share one storeid, so the
                                  name resolves identically for both and only
                                  the NUMBER tells them apart. Without this the
                                  falling store wore its neighbour's name. */}
                            <span className="block text-[12px] font-medium text-content truncate">
                              {applyStoreNumberToName(
                                r.storeName,
                                r.storeNumber,
                                r.storeNumbersForId,
                              )}
                            </span>
                            <span className="block text-[11.5px] text-content/85 tabular-nums">
                              usually {r.usualPct.toFixed(1)}%
                              {r.ownPct !== null &&
                                ` · own ${changeText(r.ownPct)}`}
                            </span>
                          </span>

                          {/* The tick is the slice it usually takes, on the
                                same scale. The gap between bar end and tick IS
                                the change, before anybody reads a number — so
                                the number sits beside the bar rather than on
                                top of it, where the tick used to strike
                                through it. */}
                          <span className="relative h-3.5 rounded bg-bkg block">
                            <span
                              className={`absolute left-0 top-0 bottom-0 rounded-l ${TONE[r.standing].bar}`}
                              style={{ width: widthOf(r.sharePct) }}
                            />
                            <span
                              className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-content"
                              style={{ left: widthOf(r.usualPct) }}
                            />
                          </span>

                          <span className="text-right text-[11.5px] font-semibold text-content tabular-nums">
                            {r.sharePct.toFixed(1)}%
                          </span>
                          <span
                            className={`text-right text-[11.5px] font-semibold tabular-nums ${TONE[r.standing].text}`}
                          >
                            {changeText(r.changePct)}
                          </span>
                          <span
                            className={`text-right text-[11.5px] font-semibold tabular-nums ${TONE[r.standing].text}`}
                          >
                            {money(r.money)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3.5 pt-2 flex-shrink-0 text-[10.5px] text-content/85">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-2 rounded-sm bg-brand_navy" />
                share this week
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-0.5 h-3 bg-content" />
                the slice it usually takes
              </span>
              <span>bars run 0–{BAR_CEILING_PCT}% of group sales</span>
            </div>
          </div>

          {/* One store out of the balance: what its move was worth, who took
                the other side, and which days it happened on. */}
          <GroupShareStoreDetail
            row={picked}
            rows={shareRows}
            groupTotal={groupTotal}
            days={days}
            isQty={isQty}
            onOpenReport={() => picked && onOpenStore(picked.storeid)}
          />
        </div>
      </div>
    </div>
  );
};

export default GroupShareBalance;
