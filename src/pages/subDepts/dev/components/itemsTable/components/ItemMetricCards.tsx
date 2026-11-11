// Utils
import { deltaTextClass, fmtDelta } from "../../../../../../utils/itemMargins";

// Interfaces
import type { ReportRow } from "../interfaces";

// Components
import GradeCell from "./GradeCell";

interface ItemMetricCardsProps {
  reportRows: ReportRow[];
  thresholdAmt: number;
}

/** The graded metric as a lead card, the rest in one table beside it. */
const ItemMetricCards = ({ reportRows, thresholdAmt }: ItemMetricCardsProps) => {
  return (
    <>
    {/* Metric cards. reportRows is already ordered by the active
        grading metric, so [0] is whatever the page is grading on —
        it takes the tinted lead card and the rest support it. A flat
        2x2 gave qty the same weight as margin, which is wrong on a
        page about margin. */}
    <div className="px-4 py-2.5 border-b border-line_hair">
      {/* 40/60 rather than an even split — the supporting table has
          four columns to fit and the lead card only needs room for
          one number. */}
      <div className="grid grid-cols-[40%_1fr] gap-2">
        {reportRows.length > 0 && (
          <div className="rounded-md border border-brand_navy/15 shadow-sm bg-gray-50 p-2.5 text-center flex flex-col justify-center">
            <div className="text-[11px] font-semibold text-content">
              {reportRows[0].label}
            </div>
            <div className="text-[18px] font-semibold text-content leading-tight">
              {reportRows[0].ty}
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-1.5 pt-1.5 border-t border-line_field">
              {(["lw", "ly"] as const).map((side) => (
                <div key={side}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-content">
                    vs {side === "lw" ? "LW" : "LY"}
                  </div>
                  <div className="text-[12px] font-semibold text-content">
                    {(side === "lw"
                      ? reportRows[0].lwDisplay
                      : reportRows[0].lyDisplay) ?? "—"}
                  </div>
                  <div className="flex justify-center mt-0.5">
                    <GradeCell
                      pct={
                        side === "lw"
                          ? reportRows[0].lw
                          : reportRows[0].ly
                      }
                      threshold={thresholdAmt}
                      isPts={reportRows[0].isPts}
                      partial={
                        side === "lw"
                          ? reportRows[0].lwPartial
                          : reportRows[0].lyPartial
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supporting metrics share one set of column headers.
            Three separate tiles repeated "LW"/"LY" six times and
            broke the vertical delta scan the original table had —
            the lead metric earns a self-contained card, these earn
            being comparable to each other. Prior values live in the
            title attribute; the lead card still shows them inline. */}
        <div className="rounded-md border border-brand_navy/15 shadow-sm bg-gray-50 px-2.5 py-1 flex flex-col justify-center">
          <div className="grid grid-cols-[1fr_56px_55px_55px] gap-1.5 pb-0.5 text-[11px] font-semibold uppercase tracking-wide text-content">
            <span />
            <span className="text-right">TY</span>
            <span className="text-right">LW</span>
            <span className="text-right">LY</span>
          </div>
          {reportRows.slice(1).map((row) => (
            <div
              key={row.key}
              className="grid grid-cols-[1fr_56px_55px_55px] gap-1.5 items-center py-1 border-t border-line_field text-[11.5px]"
            >
              <span className="font-semibold text-content truncate">
                {row.label}
              </span>
              <span className="text-[12px] font-semibold text-content text-right">
                {row.ty}
              </span>
              <span
                title={`Last week: ${row.lwDisplay ?? "no data"}`}
                className={`text-[12px] text-right font-semibold ${
                  row.lw !== null && !row.lwPartial
                    ? deltaTextClass(row.lw, thresholdAmt)
                    : "text-content"
                }`}
              >
                {row.lw !== null ? fmtDelta(row.lw, row.isPts) : "—"}
              </span>
              <span
                title={`Last year: ${row.lyDisplay ?? "no data"}`}
                className={`text-[12px] text-right font-semibold ${
                  row.ly !== null && !row.lyPartial
                    ? deltaTextClass(row.ly, thresholdAmt)
                    : "text-content"
                }`}
              >
                {row.ly !== null ? fmtDelta(row.ly, row.isPts) : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="border-t border-brand_navy/15 shadow-sm mx-4" />
    </>
  );
};

export default ItemMetricCards;
