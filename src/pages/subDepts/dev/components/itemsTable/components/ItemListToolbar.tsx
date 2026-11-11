// Hooks
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

// Utils
import { chipClass } from "../../../../../../utils/severity";
import {
  presetKey,
  VIEW_PRESETS,
  VIEW_OPTIONS,
  type ItemSeverity as Severity,
  type SortCol,
  type ItemGradingMetric,
} from "../../../../../../utils/itemMargins";

// Interfaces
import type { ThresholdValue } from "../../../../../../interfaces";
import type { SevFilter } from "../interfaces";

// Components
import ThresholdFilter from "../../../../../../components-dev/filters/ThresholdFilter";
import SelectFilter from "../../../../../../components-dev/filters/SelectFilter";

interface ItemListToolbarProps {
  sevFilter: SevFilter;
  setSevFilter: Dispatch<SetStateAction<SevFilter>>;
  sevCounts: Record<Severity, number>;
  thresholdValue: ThresholdValue | null;
  setThresholdValue: (v: ThresholdValue | null) => void;
  gradingMetric: ItemGradingMetric;
  sortCol: SortCol;
  sortDir: "desc" | "asc";
  onPreset: (col: SortCol, dir: "desc" | "asc") => void;
}

/** Above the item list: grade chips with counts, the threshold and the View
 *  sort presets. */
const ItemListToolbar = ({
  sevFilter,
  setSevFilter,
  sevCounts,
  thresholdValue,
  setThresholdValue,
  gradingMetric,
  sortCol,
  sortDir,
  onPreset,
}: ItemListToolbarProps) => {
  const [threshOpen, setThreshOpen] = useState(false);
  const threshBtnRef = useRef<HTMLButtonElement>(null);
  const threshPopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threshOpen) return;
    const close = (e: MouseEvent) => {
      if (
        threshBtnRef.current &&
        !threshBtnRef.current.contains(e.target as Node) &&
        threshPopRef.current &&
        !threshPopRef.current.contains(e.target as Node)
      )
        setThreshOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [threshOpen]);
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-fill_soft border-b border-line_hair flex-shrink-0">
      <button
        onClick={() =>
          setSevFilter((f) => (f === "critical" ? "all" : "critical"))
        }
        className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_critical_bg text-severity_critical_text transition-shadow ${
          sevFilter === "critical"
            ? "ring-2 ring-severity_critical_text/40 shadow-sm"
            : ""
        }`}
      >
        Crit ({sevCounts.critical})
      </button>
      <button
        onClick={() =>
          setSevFilter((f) => (f === "watch" ? "all" : "watch"))
        }
        className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_watch_bg text-severity_watch_text transition-shadow ${
          sevFilter === "watch"
            ? "ring-2 ring-severity_watch_text/40 shadow-sm"
            : ""
        }`}
      >
        Watch ({sevCounts.watch})
      </button>
      <button
        onClick={() =>
          setSevFilter((f) => (f === "healthy" ? "all" : "healthy"))
        }
        className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_healthy_bg text-severity_healthy_text transition-shadow ${
          sevFilter === "healthy"
            ? "ring-2 ring-severity_healthy_text/40 shadow-sm"
            : ""
        }`}
      >
        OK ({sevCounts.healthy})
      </button>

      <div className="relative flex-shrink-0">
        <button
          ref={threshBtnRef}
          onClick={() => setThreshOpen((v) => !v)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(threshOpen)}`}
        >
          Thresh
        </button>
        {threshOpen && (
          <div
            ref={threshPopRef}
            className="absolute top-full left-0 mt-1 p-1.5 rounded-md border border-line_field bg-custom-white shadow-lg z-20"
          >
            <ThresholdFilter
              value={thresholdValue}
              onChange={setThresholdValue}
              showOp={false}
              showClear={false}
              suffix={gradingMetric === "sales" ? "%" : "pts"}
              inputWidth={46}
            />
          </div>
        )}
      </div>

      <SelectFilter
        options={VIEW_OPTIONS}
        value={presetKey(sortCol, sortDir)}
        onChange={(v) => {
          const preset = VIEW_PRESETS.find(
            (p) => presetKey(p.col, p.dir) === v,
          );
          if (preset) onPreset(preset.col, preset.dir);
        }}
        placeholder="View"
        className="w-32"
      />
    </div>
  );
};

export default ItemListToolbar;
