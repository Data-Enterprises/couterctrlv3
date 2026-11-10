// Hooks
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useItemPerfCtx } from "../hooks";

// Redux
import {
  openItemDetail,
  toggleItemPerfDay,
  toggleItemPerfGroup,
} from "../../../features/dev/devItemPerfSlice";

// Utils
import { gradedChange, noLyHistory } from "../utils/itemPerfData";
import { cmpWord, fmtChange } from "../utils";

// Interfaces
import type { MarginRow } from "../utils/itemPerfData";

// Components
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import MobilePerfCard from "../../mobile/MobilePerfCard";
import PerfChange from "../../mobile/perf/PerfChange";
import PerfDayChart from "../../mobile/perf/PerfDayChart";
import { LY_COLOR, TY_SWATCH_BG } from "../../mobile/perf/perfColors";
import MarginSummary from "./MarginSummary";
import RowBars from "./RowBars";

interface GroupCardProps {
  row: MarginRow;
}

/** One department, vendor or category in the list: collapsed it is its
 *  bars and change; open it is its day chart, its margins and a way in. */
const GroupCard = ({ row: r }: GroupCardProps) => {
  const dispatch = useAppDispatch();
  const perf = useAppSelector((s) => s.dev.itemPerf);
  const { measure, chartBasis, weekMatchLw, days, listFor } = useItemPerfCtx();
  const isOpen = perf.openGroup?.key === r.key;
  // Against last year, or last week where last year has nothing: the same
  // rule that colours the TY bar.
  const change = gradedChange(r, measure);
  return (
    <MobilePerfCard
      label={r.label}
      change={<PerfChange pct={change} format={fmtChange} />}
      bars={<RowBars r={r} />}
      open={isOpen}
      minimised={!isOpen && perf.openGroup !== null}
      onToggle={() =>
        dispatch(
          toggleItemPerfGroup({ key: r.key, label: r.label }),
        )
      }
    >
      <div className="border-t border-brand_line">
        <div className="px-3.5 pb-1 pt-3">
          <PerfDayChart
            days={days}
            // The DEFERRED day, not the live one, so the column
            // and the figures it scopes move on one render.
            selected={listFor.day}
            onToggle={(iso) => dispatch(toggleItemPerfDay(iso))}
          />
          <div className="mt-1 flex flex-wrap gap-x-3.5 gap-y-1 px-1 text-[12px] text-content/95">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-3.5 rounded-sm"
                style={{ background: TY_SWATCH_BG }}
              />
              This year
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-3.5 rounded-sm"
                style={{ background: LY_COLOR }}
              />
              {/* Last year, or last week when last year has nothing on
                  file; the legend says which. */}
              {chartBasis === "lw" &&
              (perf.lwMissing || noLyHistory(weekMatchLw, null))
                ? "Last week: no history"
                : cmpWord(chartBasis)}
            </span>
          </div>
          <p className="px-1 pt-1 text-[12px] text-content/95">
            {perf.selectedDay
              ? "Tap the selected day again for the full week."
              : "Tap a day to scope this department to it."}
          </p>
        </div>

        <MarginSummary />

        <div className="px-3.5 pb-3.5">
          <button
            type="button"
            onClick={() => dispatch(openItemDetail(true))}
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-brand_navy py-2.5 text-[12.5px] font-bold text-custom-white active:bg-brand_navy_hover"
          >
            View items
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </MobilePerfCard>
  );
};

export default GroupCard;
