// Utils
import { severityDotClass } from "../../../../../../utils/severity";
import { formatCurrency2 } from "../../../../../../utils";
import { dayTrend, deltaTextClass, WEEKDAY_ORDER } from "../../../../../../utils/itemMargins";
import { formatPricedUnitsShort } from "../../../../../../utils/pricedUnits";

// Interfaces
import type {
  buildItemDetail,
  DayPeriodValue,
  GradedSeverity,
  ItemGradingMetric,
} from "../../../../../../utils/itemMargins";

interface ItemDayTrendProps {
  selectedDetail: ReturnType<typeof buildItemDetail> | null;
  thresholdAmt: number;
  gradingMetric: ItemGradingMetric;
}

/** The open item's week by weekday, worst first, with TY / LW / LY. */
const ItemDayTrend = ({ selectedDetail, thresholdAmt, gradingMetric }: ItemDayTrendProps) => {
  return (
    <>
    {selectedDetail && (
      <div className="px-4 py-2.5">
        {/* Day trend, ranked worst-first — the same ordering every
            other list on this page uses. Ranking is why there's no
            "best day / worst day" caption underneath any more: the
            order is the answer. Both baselines are shown rather than
            one silently-chosen delta. */}
        <div className="grid grid-cols-[10px_34px_1fr_92px_92px_92px] gap-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-content">
          <span />
          <span>Day</span>
          <span />
          <span className="text-right">TY</span>
          <span className="text-right">LW</span>
          <span className="text-right">LY</span>
        </div>
        {(() => {
          // Actuals, not deltas: every column prints what sold. The
          // comparison survives only as the colour on TY.
          const cell = (v: DayPeriodValue | null) =>
            v === null
              ? "\u2014"
              : `${formatCurrency2(v.sales)} | ${formatPricedUnitsShort(v.qty, v.weight)}`;

          const days = WEEKDAY_ORDER.map((wd) => {
            const v = selectedDetail.dayOfWeek[wd];
            return {
              wd,
              sold: v.ty !== null,
              ty: v.ty === null ? 0 : v.ty.sales,
              tyText: cell(v.ty),
              lwText: cell(v.lw),
              lyText: cell(v.ly),
              rank: dayTrend(v, gradingMetric),
            };
          });

          // Worst first; days with no baseline at all sort last —
          // unknown isn't the same as bad.
          const ranked = [...days].sort((a, b) => {
            if (a.rank === null && b.rank === null)
              return b.ty - a.ty;
            if (a.rank === null) return 1;
            if (b.rank === null) return -1;
            return a.rank - b.rank;
          });
          const maxTy = Math.max(...days.map((d) => d.ty), 0);

          return (
            <>
              {ranked.map((d) => {
                // One grade, read twice: the dot carries it at a
                // glance down the column, the TY colour carries it
                // where the number actually is. No pill, no percentage.
                const sev: GradedSeverity | null =
                  d.rank === null
                    ? null
                    : d.rank < -thresholdAmt
                      ? "critical"
                      : d.rank < 0
                        ? "watch"
                        : "healthy";
                const tyClass =
                  d.rank === null
                    ? "text-content"
                    : deltaTextClass(d.rank, thresholdAmt);
                return (
                  <div
                    key={d.wd}
                    className="grid grid-cols-[10px_34px_1fr_92px_92px_92px] gap-2 items-center py-2 border-t border-brand_navy/15"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        sev === null ? "bg-gray-300" : severityDotClass[sev]
                      }`}
                    />
                    <span className="text-[12px] font-semibold text-content">
                      {d.wd}
                    </span>
                    {/* Neutral track so every row shares a visible
                        100% reference — without it the bars float in
                        an unbounded column and you have to hunt for
                        the longest one to read the scale. The fill
                        stays neutral too: length carries dollars, and
                        the dot is the only thing asserting a grade. */}
                    {d.sold ? (
                      <span className="h-[12px] w-full rounded-full bg-brand_navy/15 block overflow-hidden">
                        <span
                          className="h-full rounded-full bg-brand_navy/85 block"
                          style={{
                            width: `${maxTy > 0 ? (d.ty / maxTy) * 100 : 0}%`,
                          }}
                        />
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium uppercase tracking-wide text-content">
                        no sales
                      </span>
                    )}
                    <span
                      className={`text-[12px] font-semibold text-right tabular-nums ${tyClass}`}
                    >
                      {d.tyText}
                    </span>
                    <span className="text-[12px] font-semibold text-content text-right tabular-nums">
                      {d.lwText}
                    </span>
                    <span className="text-[12px] font-semibold text-content text-right tabular-nums">
                      {d.lyText}
                    </span>
                  </div>
                );
              })}
            </>
          );
        })()}
      </div>
    )}
    </>
  );
};

export default ItemDayTrend;
