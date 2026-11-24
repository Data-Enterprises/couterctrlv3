// Hooks
import { useMemo, useState } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useCategoriesCtx } from "../hooks";
import { useHourRows } from "./hooks";

// Redux
import {
  setSelectedDay,
  setThreshold,
  CATEGORY_THRESHOLD_DEFAULT,
  ITEM_THRESHOLD_DEFAULT,
} from "../../../../features/categoriesSlice";

// Utils
import { applyStoreNumberToName } from "../../../../utils/storeIdentity";
import { type Severity } from "../../../../utils/severity";
import { fmtRangeLabel } from "../../../../utils/dateLabels";
import { gradeBasis, isCompleteCoverage } from "../../../../utils/grading";
import { getTier, headerBg } from "../utils";
import {
  dayCardsFor,
  fmtDetail,
  hourList,
  hourReport,
  kpiFigures,
  periodLabels,
  weekDeltas,
} from "./utils";

// Interfaces
import type { Tab } from "../interfaces";

// Components
import DayCardStrip from "../../../../components/DayCardStrip";
import CategoryExportModal from "./export/CategoryExportModal";
import CategoryItemsTable from "./components/CategoryItemsTable";
import DetailTitleBar from "./components/DetailTitleBar";
import DetailKpiStrip from "./components/DetailKpiStrip";
import DetailTabs from "./components/DetailTabs";
import HourChips from "./components/HourChips";
import HourRowButton from "./components/HourRowButton";
import HourReport from "./components/HourReport";

interface CategoryDetailPanelProps {
  onLoadHourly: () => void;
}

/** The Categories detail panel for the selected category: header with export, KPI figures, the week's day cards,
 *  and Items and Hours tabs (the hourly data loads on first open of Hours). */
const CategoryDetailPanel = ({ onLoadHourly }: CategoryDetailPanelProps) => {
  const dispatch = useAppDispatch();
  const cats = useCategoriesCtx();
  const {
    rows,
    metric,
    threshold,
    selectedCategory,
    selectedDay,
    hourly,
    loadingHourly,
  } = cats;

  const [tab, setTab] = useState<Tab>("items");
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [sevFilter, setSevFilter] = useState<Severity | "all">("all");
  const [exportOpen, setExportOpen] = useState<boolean>(false);

  const row = useMemo(
    () => rows.find((r) => r.category === selectedCategory) ?? null,
    [rows, selectedCategory],
  );
  const hourRows = useHourRows(hourly, metric, selectedDay);

  if (!row) {
    return (
      <div className="flex-1 min-w-0 shadow-lg bg-custom-white rounded-xl flex items-center justify-center">
        <span className="text-[11px] text-content/95">
          Select a category to see its week
        </span>
      </div>
    );
  }

  const activeThreshold = threshold ?? CATEGORY_THRESHOLD_DEFAULT;
  const isQty = metric === "qty";
  const fmt = (n: number) => fmtDetail(isQty, n);

  const tier = getTier(row, activeThreshold, metric);
  const cov = row.coverage;
  const lwComplete = isCompleteCoverage(cov.lwDayCount, cov.dayCount);
  const lyComplete = isCompleteCoverage(cov.lyDayCount, cov.dayCount);
  const basis = gradeBasis(row, cov);

  // The KPI values follow the selected day; the day strip is always the week.
  const activeDay = selectedDay
    ? (row.days.find((d) => d.date === selectedDay) ?? null)
    : null;
  const { twValue, lwValue, lyValue, lwPct, lyPct } = kpiFigures(
    row,
    activeDay,
    isQty,
  );
  const labels = periodLabels(selectedDay, cats.twStart, cats.twEnd);
  const { weekLwPct, weekLyPct } = weekDeltas(row, isQty);

  const list = hourList(hourRows, cov, activeThreshold);
  const shown =
    sevFilter === "all" ? list : list.filter((r) => r.sev === sevFilter);
  const count = (s: Severity) => list.filter((r) => r.sev === s).length;
  const report = hourReport(hourRows, selectedHour, isQty);

  const pick = (key: string) =>
    setSelectedHour(Number(key) === selectedHour ? null : Number(key));

  const openTab = (k: Tab) => {
    setTab(k);
    setSevFilter("all");
    if (k === "hours" && hourly.tw.length === 0 && !loadingHourly)
      onLoadHourly();
  };

  return (
    <div className="flex-1 min-w-0 shadow-lg cc-panel">
      {exportOpen && (
        <CategoryExportModal
          onClose={() => setExportOpen(false)}
          storeName={
            cats.selectedStoreNumber
              ? applyStoreNumberToName(
                  cats.storeName,
                  cats.selectedStoreNumber,
                  cats.availableStoreNumbers,
                )
              : cats.storeName
          }
          categoryName={row.description ?? "Uncategorized"}
          // The week, not twLabel — twLabel narrows to the selected day, and the
          // modal needs the week to label its "All week" option.
          dateRange={fmtRangeLabel(cats.twStart, cats.twEnd)}
          rows={rows}
          items={cats.items}
          hourly={hourly}
          metric={metric}
          threshold={activeThreshold}
          itemThreshold={cats.itemThreshold ?? ITEM_THRESHOLD_DEFAULT}
          weekDates={row.days.map((d) => d.date)}
          selectedDay={selectedDay}
        />
      )}

      <DetailTitleBar
        categoryName={row.description ?? "Uncategorized"}
        periodLabel={labels.twLabel}
        bgClass={headerBg(tier)}
        onExport={() => setExportOpen(true)}
      />

      <DetailKpiStrip
        isQty={isQty}
        labels={labels}
        twText={fmt(twValue)}
        lwText={lwValue === null ? "—" : fmt(lwValue)}
        lyText={lyValue === null ? "—" : fmt(lyValue)}
        lwPct={lwPct}
        lyPct={lyPct}
        lwComplete={!!activeDay || lwComplete}
        lyComplete={!!activeDay || lyComplete}
        lwCoverageNote={
          !activeDay && row.hasLW && !lwComplete
            ? `${cov.lwDayCount} of ${cov.dayCount} days matched`
            : undefined
        }
        lyCoverageNote={
          !activeDay && row.hasLY && !lyComplete
            ? `${cov.lyDayCount} of ${cov.dayCount} days matched`
            : undefined
        }
        threshold={activeThreshold}
      />

      {/* Day strip — the shared Performance-page card strip. Sales/qty rising is
          good here, so higherIsWorse is off; LP and Coupon Sales want the
          opposite and that's exactly what the flag is for. */}
      <DayCardStrip
        days={dayCardsFor(row, isQty)}
        weekValue={fmt(isQty ? row.twQty : row.twNet)}
        weekDelta={
          basis === "LY" ? weekLyPct : basis === "LW" ? weekLwPct : null
        }
        weekDeltaBasis={basis ?? undefined}
        selected={selectedDay ?? ""}
        onSelect={(iso) => dispatch(setSelectedDay(iso === "" ? null : iso))}
        higherIsWorse={false}
      />

      <DetailTabs
        tab={tab}
        onTab={openTab}
        uncategorized={!!row.uncategorized}
      />

      {tab === "items" && <CategoryItemsTable />}

      {/* Two-column: graded list left, report right */}
      <div className={`flex-1 min-h-0 flex ${tab === "items" ? "hidden" : ""}`}>
        <div
          className="flex flex-col border-r border-line_hair min-h-0"
          style={{ width: "36.5%" }}
        >
          <HourChips
            counts={{
              critical: count("critical"),
              watch: count("watch"),
              healthy: count("healthy"),
            }}
            sevFilter={sevFilter}
            onSevFilter={(sev) =>
              setSevFilter((f) => (f === sev ? "all" : sev))
            }
            threshold={threshold}
            onThreshold={(v) => dispatch(setThreshold(v))}
          />

          <div className="overflow-y-auto thin-scrollbar flex-1">
            {loadingHourly ? (
              <div className="flex items-center justify-center gap-2 h-24">
                <div className="cc-spinner border-t-brand_navy" />
                <span className="text-[11px] text-content">Loading hours…</span>
              </div>
            ) : shown.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-[11px] text-content/95">
                No hourly rows
              </div>
            ) : (
              shown.map((r) => (
                <HourRowButton
                  key={r.key}
                  row={r}
                  valueText={fmt(r.value)}
                  threshold={activeThreshold}
                  isSelected={
                    selectedHour !== null && String(selectedHour) === r.key
                  }
                  onPick={() => pick(r.key)}
                />
              ))
            )}
          </div>
        </div>

        <HourReport report={report} />
      </div>
    </div>
  );
};

export default CategoryDetailPanel;
