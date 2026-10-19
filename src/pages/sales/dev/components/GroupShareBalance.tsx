import { useMemo, useState } from "react";
import { formatCurrency2 } from "../../../../utils";
import {
  balanceSegments,
  shareBalanceOf,
  shareRowsOf,
  shareStandingCounts,
  SHARE_BAND_PCT,
  type BalanceSegment,
  type ShareRow,
  type ShareStanding,
} from "../shared/shareBalance";
import type { ComparisonRow } from "../shared/storeComparison";

/**
 * Each store's share of group sales, as a balance.
 *
 * Sits below the day cards and owns nothing above them. Everything it draws
 * comes off `ComparisonRow`s the panel already has, so it costs no fetch and
 * cannot disagree with the grid beside it.
 *
 * The point of the view is that shares total 100%: a store only gains weight
 * by taking it from the others, so a fall always has a matching rise and the
 * panel can name it. `shareBalance` holds that arithmetic; this file is the
 * drawing.
 */

/** Share bars read 0–25% of the group. Above a quarter the bar is full and
 *  the number beside it carries the rest — a scale set by the biggest store
 *  would squash every other row flat in a fifty-store group. */
const BAR_CEILING_PCT = 25;

const TONE: Record<
  ShareStanding,
  { pill: string; text: string; bar: string; rule: string; seg: string }
> = {
  falling: {
    pill: "bg-severity_critical_bg text-severity_critical_text",
    text: "text-severity_critical_text",
    bar: "bg-severity_critical_text",
    rule: "border-severity_critical_bg",
    seg: "bg-severity_critical_text text-custom-white",
  },
  consistent: {
    pill: "bg-gray-100 text-content/85",
    text: "text-content",
    bar: "bg-brand_navy",
    rule: "border-gray-200",
    seg: "bg-gray-300 text-content",
  },
  rising: {
    pill: "bg-severity_healthy_bg text-severity_healthy_text",
    text: "text-severity_healthy_text",
    bar: "bg-severity_healthy_text",
    rule: "border-severity_healthy_bg",
    seg: "bg-severity_healthy_text text-custom-white",
  },
};

const BAND_WHY: Record<ShareStanding, string> = {
  falling: `lost more than ${SHARE_BAND_PCT}% of the group`,
  consistent: `within ${SHARE_BAND_PCT}% of usual — too small to act on`,
  rising: `gained more than ${SHARE_BAND_PCT}% of the group`,
};

const ORDER: ShareStanding[] = ["falling", "consistent", "rising"];

/** Points of the group, written as a percentage because that is what the
 *  column beside it is. */
const changeText = (n: number) =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}%`;

const moneyText = (n: number) =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${formatCurrency2(Math.abs(n))}`;

const widthOf = (pct: number) =>
  `${Math.min(100, Math.max(0, (pct / BAR_CEILING_PCT) * 100))}%`;

const Segments = ({
  segments,
  align,
}: {
  segments: BalanceSegment[];
  align: "end" | "start";
}) => (
  <div
    className={`flex-1 flex h-6 ${align === "end" ? "justify-end" : "justify-start"}`}
  >
    {segments.map((s) => (
      <div
        key={s.key}
        style={{ width: s.width }}
        title={`${s.label} · ${moneyText(s.money)}`}
        className={`flex items-center justify-center border-r-2 border-custom-white overflow-hidden ${TONE[s.standing].seg}`}
      >
        <span className="text-[10.5px] font-semibold whitespace-nowrap px-1">
          {s.label}
        </span>
      </div>
    ))}
  </div>
);

const GroupShareBalance = ({
  rows,
  selectedStoreId,
  onSelectStore,
}: {
  rows: ComparisonRow[];
  selectedStoreId: number | null;
  onSelectStore: (storeid: number) => void;
}) => {
  const [open, setOpen] = useState(true);

  const shareRows = useMemo(() => shareRowsOf(rows), [rows]);
  const balance = useMemo(() => shareBalanceOf(shareRows), [shareRows]);
  const counts = useMemo(() => shareStandingCounts(shareRows), [shareRows]);

  const lostSegs = useMemo(
    () => balanceSegments(balance.lost),
    [balance.lost],
  );
  const gainedSegs = useMemo(
    () => balanceSegments(balance.gained),
    [balance.gained],
  );

  const banded = useMemo(() => {
    const by: Record<ShareStanding, ShareRow[]> = {
      falling: [],
      consistent: [],
      rising: [],
    };
    shareRows.forEach((r) => by[r.standing].push(r));
    return by;
  }, [shareRows]);

  if (shareRows.length < 2) return null;

  const moved = Math.abs(balance.lostTotal);

  return (
    <div className="flex-shrink-0 border-b border-gray-100">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-baseline gap-2.5 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-[13px] font-semibold text-content">
          Each store&rsquo;s share of group sales
        </span>
        <span className="text-[11px] text-content/85">
          {counts.falling} falling · {counts.consistent} consistent ·{" "}
          {counts.rising} rising
        </span>
        <span className="flex-1" />
        <span className="text-[11px] font-semibold text-content/85">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-3">
          <p className="text-[11.5px] text-content/85 leading-snug mb-2.5 max-w-[88ch]">
            Measured against the slice each store{" "}
            <span className="font-semibold text-content">usually</span> takes,
            not an even split. Shares total 100%, so whatever one store loses
            the others gain — the two sides are the same money.
          </p>

          {/* The balance. Side says which way, colour says the standing: a
              Consistent store that drifted a tenth of a point sits on the
              losing side in neutral grey rather than being painted red. */}
          <div className="rounded-lg bg-custom-white shadow-card-sm px-3 py-2.5 mb-3">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-content/85">
                {moneyText(moved)} moved between stores
              </span>
              {Math.abs(balance.imbalance) > 1 && (
                <span
                  className="text-[11px] font-semibold text-severity_watch_text"
                  title="Stores graded on different periods do not cancel exactly — last year's shares and last week's each total 100% on their own."
                >
                  {moneyText(balance.imbalance)} unaccounted
                </span>
              )}
            </div>
            <div className="flex items-center">
              <Segments segments={lostSegs} align="end" />
              <div className="w-0.5 h-8 bg-content flex-shrink-0" />
              <Segments segments={gainedSegs} align="start" />
            </div>
            <div className="flex justify-between mt-1.5 text-[11px] font-semibold">
              <span className="text-severity_critical_text">
                {balance.lost.length} lost share {moneyText(balance.lostTotal)}
              </span>
              <span className="text-severity_healthy_text">
                {moneyText(balance.gainedTotal)} gained by{" "}
                {balance.gained.length}
              </span>
            </div>
          </div>

          <div className="max-h-[340px] overflow-y-auto thin-scrollbar">
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
                      {standing === "falling"
                        ? "Falling"
                        : standing === "rising"
                          ? "Rising"
                          : "Consistent"}
                    </span>
                    <span className="text-[11px] text-content/85">
                      {BAND_WHY[standing]}
                    </span>
                    <span className="flex-1" />
                    <span
                      className={`text-[12px] font-semibold tabular-nums ${TONE[standing].text}`}
                    >
                      {moneyText(total)}
                    </span>
                  </div>

                  {band.map((r) => {
                    const sel = selectedStoreId === r.storeid;
                    return (
                      <button
                        key={`${r.storeid}__${r.storeNumber}`}
                        onClick={() => onSelectStore(r.storeid)}
                        className={`w-full grid items-center gap-2.5 px-1 py-1.5 border-l-2 border-b border-b-gray-100 text-left transition-colors ${
                          sel
                            ? "bg-row_selected border-row_selected_border"
                            : "border-transparent hover:bg-gray-50"
                        }`}
                        style={{
                          gridTemplateColumns: "minmax(0,1fr) 42% 58px 84px",
                        }}
                      >
                        <span className="min-w-0">
                          <span className="block text-[12px] font-medium text-content truncate">
                            {r.storeName}
                          </span>
                          <span className="block text-[10.5px] text-content/85 tabular-nums">
                            usually {r.usualPct.toFixed(1)}%
                            {r.ownPct !== null &&
                              ` · own ${changeText(r.ownPct)}`}
                          </span>
                        </span>

                        {/* The tick is the slice it usually takes, on the same
                            scale. The gap between bar end and tick IS the
                            change, before anybody reads a number. */}
                        <span className="relative h-4 rounded bg-bkg block">
                          <span
                            className={`absolute left-0 top-0 bottom-0 rounded-l ${TONE[r.standing].bar}`}
                            style={{ width: widthOf(r.sharePct) }}
                          />
                          <span
                            className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-content"
                            style={{ left: widthOf(r.usualPct) }}
                          />
                          <span className="absolute right-1.5 inset-y-0 flex items-center text-[11px] font-semibold text-content tabular-nums">
                            {r.sharePct.toFixed(1)}%
                          </span>
                        </span>

                        <span
                          className={`text-right text-[12px] font-semibold tabular-nums ${TONE[r.standing].text}`}
                        >
                          {changeText(r.changePct)}
                        </span>
                        <span
                          className={`text-right text-[12px] font-semibold tabular-nums ${TONE[r.standing].text}`}
                        >
                          {moneyText(r.money)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3.5 pt-2 text-[10.5px] text-content/85">
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
      )}
    </div>
  );
};

export default GroupShareBalance;
