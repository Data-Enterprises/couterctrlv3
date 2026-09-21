import { useMemo } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { toggleWeek, setAllWeeksOpen } from "../../../features/dev/devSalesTrackerSlice";
import { formatCurrency2 } from "../../../utils";
import { changeTone, signed, signedPct, orDash } from "./trackerTone";
import WeekCard from "./WeekCard";
import { exportTracker } from "./trackerExport";
import type { SubDeptTotal } from "./trackerTotals";
import type { WindowPlan } from "./trackerWeeks";

interface TrackerDetailProps {
  row: SubDeptTotal;
  plan: WindowPlan;
  scopeLabel: string;
}

/**
 * The selected sub department, week by week.
 *
 * Header and KPI strip follow the Performance panel theme, but the header is
 * navy rather than severity-tinted: nothing on this page is graded, so there is
 * no severity to tint it with.
 */
const TrackerDetail = ({ row, plan, scopeLabel }: TrackerDetailProps) => {
  const dispatch = useAppDispatch();
  const expandedWeeks = useAppSelector((s) => s.dev.salesTracker.expandedWeeks);

  // The panel header formats its dates; the strip underneath was printing them
  // raw, so the same window appeared twice in two different notations.
  const md = (d: string) => {
    const dt = new Date(d + "T12:00:00");
    return `${dt.getMonth() + 1}/${dt.getDate()}`;
  };
  const shortYear = (d: string) =>
    `${md(d)}/${String(new Date(d + "T12:00:00").getFullYear()).slice(2)}`;

  const collisions = useMemo(() => new Set(plan.collisions), [plan.collisions]);
  const allOpen = expandedWeeks.length === row.weeks.length;
  const comparableWeeks = row.weeks.filter((w) => w.salesLy !== null).length;

  return (
    <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 flex-shrink-0 bg-[#1e2a4a]">
        <p className="text-custom-white text-[13px] font-bold leading-tight justify-self-start truncate">
          {row.desc}
        </p>
        <span className="text-custom-white text-[13px] font-bold justify-self-center">
          By week · oldest first
        </span>
        <div className="flex items-center gap-3 justify-self-end">
          <button
            onClick={() => exportTracker({ row, scopeLabel, plan })}
            title="Export CSV"
            className="text-custom-white transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI strip — the window totals for this department */}
      <div className="grid grid-cols-5 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <div className="px-3 pt-2.5 pb-2 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-content">
            TY Sales
          </div>
          <div className="text-[10px] font-bold text-content mb-0.5">
            {md(plan.tyStart)} – {md(plan.tyEnd)}
          </div>
          <div className="text-[14px] font-bold text-content">
            {formatCurrency2(row.salesTy)}
          </div>
        </div>

        <div className="px-3 pt-2.5 pb-2 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-content">
            LY Sales
          </div>
          <div className="text-[10px] font-bold text-content mb-0.5">
            {md(plan.lyStart)} – {shortYear(plan.lyEnd)}
          </div>
          <div className="text-[14px] font-bold text-content">
            {row.salesLy === null ? "—" : formatCurrency2(row.salesLy)}
          </div>
        </div>

        <div className="px-3 pt-2.5 pb-2 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-content">
            ATS Sales
          </div>
          {/* Always the transaction count. This used to read "per department
              only" for the roll-up, which contradicted the totals row beneath
              it now that the roll-up sums transactions like legacy does. */}
          <div className="text-[10px] font-bold text-content mb-0.5">
            {row.trans.toLocaleString()} trans
          </div>
          <div className="text-[14px] font-bold text-content">
            {orDash(row.ats, formatCurrency2)}
          </div>
        </div>

        <div className="px-3 pt-2.5 pb-2 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-content">
            $ vs LY
          </div>
          <div className="text-[10px] font-bold text-content mb-0.5">
            {plan.weeks.length} weeks
          </div>
          <div
            className={`text-[14px] font-bold ${changeTone(row.dollarChange)}`}
          >
            {signed(row.dollarChange, formatCurrency2)}
          </div>
        </div>

        <div className="px-3 pt-2.5 pb-2 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-content">
            % vs LY
          </div>
          {/* Names how many weeks the comparison actually rests on, which is
              not always the window length — weeks with no last-year partner sit
              out of both sides. "day matched" said nothing a reader could use. */}
          <div className="text-[10px] font-bold text-content mb-0.5">
            {comparableWeeks} of {row.weeks.length} compared
          </div>
          <div className={`text-[14px] font-bold ${changeTone(row.pctChange)}`}>
            {signedPct(row.pctChange)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-3.5 py-2 border-b border-gray-100 flex-shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-content">
          {row.weeks.length} weeks · oldest first
        </span>
        <button
          onClick={() =>
            dispatch(
              setAllWeeksOpen(allOpen ? [] : row.weeks.map((w) => w.index)),
            )
          }
          className="text-[11.5px] font-semibold text-[#1e2a4a] hover:underline"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar p-2.5 flex flex-col gap-2.5">
        {row.weeks.map((w) => (
          <WeekCard
            key={w.index}
            week={w}
            label={w.index + 1}
            expanded={expandedWeeks.includes(w.index)}
            onToggle={(i) => dispatch(toggleWeek(i))}
            collisions={collisions}
          />
        ))}
      </div>
    </div>
  );
};

export default TrackerDetail;
