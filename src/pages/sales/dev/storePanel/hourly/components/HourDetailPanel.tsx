// Hooks
import { useMemo } from "react";
import { useSalesCtx } from "../../../hooks";

// Utils
import { formatCurrency2 } from "../../../../../../utils";
import { basket, buildWeekHourDays, formatHourRange, getCta } from "../utils";

// Interfaces
import type { Coverage } from "../../../utils/ledgerUtils";
import type { Dispatch, SetStateAction } from "react";
import type { HourRow } from "../interfaces";

// Components
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/20/solid";
import InsightToggle from "../../../components/InsightToggle";
import PeriodKpis from "../../../components/PeriodKpis";
import HourCompareBlock from "./HourCompareBlock";
import HourTrendChart from "./HourTrendChart";

interface HourDetailPanelProps {
  /** The open hour, or null when none is picked. */
  selected: HourRow | null;
  coverage: Coverage;
  threshold: number;
  twDateLabel: string;
  lwDateLabel: string;
  lyDateLabel: string;
  ctaOpen: boolean;
  setCtaOpen: Dispatch<SetStateAction<boolean>>;
  chartOpen: boolean;
  setChartOpen: Dispatch<SetStateAction<boolean>>;
}

/** The right panel: the open hour's insight, its figures, transactions,
 *  average basket and its week chart. */
const HourDetailPanel = ({
  selected,
  coverage,
  threshold,
  twDateLabel,
  lwDateLabel,
  lyDateLabel,
  ctaOpen,
  setCtaOpen,
  chartOpen,
  setChartOpen,
}: HourDetailPanelProps) => {
  const { gradingMetric, selectedHour, rawHourly, rawLWHourly, rawLYHourly } =
    useSalesCtx();

  const weekHourDays = useMemo(
    () =>
      selectedHour === null
        ? null
        : buildWeekHourDays(selectedHour, rawHourly, rawLWHourly, rawLYHourly),
    [selectedHour, rawHourly, rawLWHourly, rawLYHourly],
  );
  const hasWeekLW =
    selectedHour !== null && rawLWHourly.some((h) => h.hour === selectedHour);
  const hasWeekLY =
    selectedHour !== null && rawLYHourly.some((h) => h.hour === selectedHour);

  const cta = selected ? getCta(selected, coverage, threshold, gradingMetric) : null;

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {selected && cta && (
        <InsightToggle
          name={formatHourRange(selected.hour)}
          cta={cta}
          open={ctaOpen}
          onToggle={() => setCtaOpen((v) => !v)}
          small
        />
      )}

      {selected ? (
        <div className="flex-1 overflow-y-auto thin-scrollbar leading-snug">
          <PeriodKpis
            row={selected}
            coverage={coverage}
            threshold={threshold}
            twDateLabel={twDateLabel}
            lwDateLabel={lwDateLabel}
            lyDateLabel={lyDateLabel}
          />
          <HourCompareBlock
            label="Transactions"
            ty={selected.trans}
            lw={selected.lwTrans}
            ly={selected.lyTrans}
            format={(v) => v.toLocaleString()}
            threshold={threshold}
          />
          <HourCompareBlock
            label="Avg basket"
            ty={basket(selected.tw, selected.trans)}
            lw={basket(selected.lw, selected.lwTrans)}
            ly={basket(selected.ly, selected.lyTrans)}
            format={formatCurrency2}
            threshold={threshold}
          />

          <div className="border-b border-gray-100">
            <button
              onClick={() => setChartOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2"
            >
              <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-content">
                <PresentationChartLineIcon className="w-3.5 h-3.5 text-content/45" />
                Chart
              </span>
              {chartOpen ? (
                <ChevronUpIcon className="w-3 h-3 text-content/40" />
              ) : (
                <ChevronDownIcon className="w-3 h-3 text-content/40" />
              )}
            </button>
            {chartOpen && weekHourDays && (
              <div className="px-2 pb-3">
                <HourTrendChart days={weekHourDays} hasLW={hasWeekLW} hasLY={hasWeekLY} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-[12px] text-content">
          Select an hour
        </div>
      )}
    </div>
  );
};

export default HourDetailPanel;
