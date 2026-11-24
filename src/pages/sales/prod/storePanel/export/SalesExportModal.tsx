// Hooks
import { useSalesExport } from "./hooks/exportState";

// Utils
import { PRESET_DATASETS } from "./utils/index";

// Interfaces
import type { DayDot } from "../../../../../interfaces";

// Components
import ResizableModalShell from "../../../../../components/modals/ResizableModalShell";
import ExportModalHeader from "../../../../../components/modals/ExportModalHeader";
import PresetOption from "./components/PresetOption";
import ItemsSoldDates from "./components/ItemsSoldDates";
import FinancialsOptions from "./components/FinancialsOptions";
import FinancialsStorePicker from "./components/FinancialsStorePicker";
import SubDeptItemsOption from "./components/SubDeptItemsOption";
import ExportFooter from "../../../../../components/modals/ExportFooter";
import DataSourcePicker from "./components/DataSourcePicker";
import GroupByPicker from "./components/GroupByPicker";
import MetricsPicker from "./components/MetricsPicker";
import CustomPreview from "./components/CustomPreview";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SalesExportModalProps {
  onClose: () => void;
  storeName: string;
  dateLabel: string;
  days: DayDot[];
  /** The store this popup is about, and the week it is showing. The Financials
   *  option is the only one that fetches, so it is the only one that needs
   *  them. */
  storeId: number;
  /** The location within `storeId`: Items Sold reads that location's items
   *  a day at a time. */
  storeNumber: string;
  startDate: string;
  endDate: string;
  /** The group the ledger searched, when it searched one. Lets Financials
   *  offer the whole chain rather than just the store being looked at. */
  group?: { id: number; name: string } | null;
  /** Every store the ledger returned, so Financials can be narrowed to some
   *  of them. */
  stores?: { storeid: number; store_number: string; store_name: string }[];
}

// ─── Component ────────────────────────────────────────────────────────────────

/** The store popup's Export CSV modal, in two modes: Presets (Weekly Summary, Sub Department, Hourly Breakdown, Items Sold,
 *  Financials and Sub Dept Items, some with their own dates or filters) and Custom (pick a source, group-by dimensions and
 *  metrics with a live preview). Downloads the result as a CSV. */
const SalesExportModal = ({
  onClose,
  storeName,
  dateLabel,
  days,
  storeId,
  storeNumber,
  startDate,
  endDate,
  group,
  stores,
}: SalesExportModalProps) => {
  const {
    hasItems,
    itemsDates,
    itemsTooLong,
    canFilterStores,
    finTicked,
    toggleItemSev,
    toggleItems,
    searchedAnswers,
    handlePresetDownload,
    handleCustomDownload,
    canCustomDownload,
    mode,
    setMode,
    selected,
    setSelected,
    itemSevs,
    fetching,
    itemsFrom,
    setItemsFrom,
    itemsTo,
    setItemsTo,
    finFrom,
    setFinFrom,
    finTo,
    setFinTo,
    finStores,
    setFinStores,
    subDeptName,
    searchedRows,
    financialsTruncated,
    financialsLoading,
    source,
    switchSource,
    dims,
    mDefs,
    groupBy,
    toggleGroupBy,
    metrics,
    toggleMetric,
    setMetricFn,
    aggRows,
    columns,
  } = useSalesExport({
    onClose,
    storeName,
    dateLabel,
    days,
    storeId,
    storeNumber,
    startDate,
    endDate,
    group,
    stores,
  });

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:sales:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
      {/* Header */}
      <ExportModalHeader
        subtitle={storeName}
        mode={mode}
        onMode={setMode}
        onClose={onClose}
      />

      {/* ── PRESETS MODE ── */}
      {mode === "presets" && (
        <>
          <div className="px-4 pt-4 pb-2 space-y-3">
            <p className="text-[11px] text-content uppercase tracking-wide font-medium">
              Select data to include
            </p>
            {PRESET_DATASETS.map(({ id, label, description }) => (
              <PresetOption
                key={id}
                label={label}
                description={description}
                checked={selected.has(id)}
                onToggle={() =>
                  setSelected((prev) => {
                    const n = new Set(prev);
                    n.has(id) ? n.delete(id) : n.add(id);
                    return n;
                  })
                }
              >
                {/* Financials is the only preset that fetches, so it is the
                      only one that can answer for dates and stores the page is
                      not showing. The controls live under it rather than in
                      the header for exactly that reason — they narrow this
                      one dataset, not the export.

                      Shown whether or not the row is ticked. Revealing them on
                      the tick hid the whole point of the option: somebody
                      looking for a date range does not find it by checking a
                      box to see what happens, they decide the export cannot do
                      it and go back to asking for a query. */}

                {/* Items Sold's dates, laid out as Financials' are: one
                    date (From and To the same) or a range. */}
                {id === "dailyrecap" && (
                  <ItemsSoldDates
                    enabled={selected.has("dailyrecap")}
                    from={itemsFrom}
                    to={itemsTo}
                    onFromChange={setItemsFrom}
                    onToChange={setItemsTo}
                    onThisWeek={() => {
                      setItemsFrom(startDate);
                      setItemsTo(endDate);
                    }}
                    tooLong={itemsTooLong}
                  />
                )}

                {id === "financials" && (
                  <FinancialsOptions
                    loading={financialsLoading}
                    inHand={!!searchedAnswers}
                    recordCount={searchedRows.length}
                    capped={financialsTruncated}
                    from={finFrom}
                    to={finTo}
                    onFromChange={setFinFrom}
                    onToChange={setFinTo}
                    onThisWeek={() => {
                      setFinFrom(startDate);
                      setFinTo(endDate);
                    }}
                  >
                    {canFilterStores && (
                      <FinancialsStorePicker
                        stores={stores!}
                        storeId={storeId}
                        ticked={finStores}
                        setTicked={setFinStores}
                      />
                    )}
                  </FinancialsOptions>
                )}
              </PresetOption>
            ))}

            {hasItems && (
              <SubDeptItemsOption
                checked={selected.has("items")}
                subDeptName={subDeptName}
                sevs={itemSevs}
                onToggle={toggleItems}
                onToggleSev={toggleItemSev}
              />
            )}
          </div>
          <ExportFooter
            spaced
            onCancel={onClose}
            onDownload={() => void handlePresetDownload()}
            disabled={
              selected.size === 0 ||
              fetching ||
              // Financials with nothing ticked would fall back to the one
              // store, which is not what an empty list means.
              (selected.has("financials") &&
                canFilterStores &&
                finTicked.length === 0) ||
              // Items Sold needs a date, and no more days than it reads.
              (selected.has("dailyrecap") &&
                (itemsDates.length === 0 || itemsTooLong))
            }
            label={fetching ? "Reading the data…" : "Download CSV"}
          />
        </>
      )}

      {/* ── CUSTOM MODE ── */}
      {mode === "custom" && (
        <>
          <div className="grid grid-cols-[200px_1fr] divide-x divide-line_hair min-h-[360px] max-h-[calc(100vh-220px)]">
            {/* Left: config panel */}
            <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
              {/* Source */}
              <DataSourcePicker source={source} onChange={switchSource} />

              {/* Group by */}
              <GroupByPicker
                dims={dims}
                groupBy={groupBy}
                onToggle={toggleGroupBy}
              />

              {/* Metrics */}
              <MetricsPicker
                mDefs={mDefs}
                metrics={metrics}
                onToggle={toggleMetric}
                onFnChange={setMetricFn}
              />
            </div>

            {/* Right: preview */}
            <CustomPreview rows={aggRows} columns={columns} />
          </div>

          {/* Footer */}
          <ExportFooter
            onCancel={onClose}
            onDownload={handleCustomDownload}
            disabled={!canCustomDownload}
          />
        </>
      )}
    </ResizableModalShell>
  );
};

export default SalesExportModal;
