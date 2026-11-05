// Hooks
import { useState } from "react";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { useAppSelector } from "../../../../../hooks";
import { useCustomExport, useRecapWeekItems } from "./hooks/index";

// API
import {
  getFinancials,
  type FinancialsResponse,
} from "../../../../../api/financials";

// Utils
import { rowsToCsv, downloadCsv } from "../../../../../utils/csvExport";
import { sellsByWeight } from "../summary/utils/recapDays";
import { dayLabel } from "../summary/utils/recapFormat";
import { mergeItems } from "../summary/utils/recapItemRows";
import { recapCsv } from "./utils/recapCsv";
import {
  MAX_EXPORT_DAYS,
  datesBetween,
  fileDateLabel,
} from "./utils/recapRange";
import {
  buildFinancialsCsv,
  buildSubDeptCsv,
  buildHourlyCsv,
  buildSummaryCsv,
  buildDeptDayGridCsv,
  buildItemsCsv,
  PRESET_DATASETS,
} from "./utils/index";

// Interfaces
import type { SubSale, HourlySale } from "../../../../../interfaces";
import type { ExportSubDeptItem } from "../../../../../features/dev/devSalesLedgerSlice";
import type { DayDot } from "../../components/LedgerRow";
import type { ExportDataset, ItemSev, ModalMode } from "./interfaces/index";

// Components
import ResizableModalShell from "../../../../../components-dev/modals/ResizableModalShell";
import ExportModalHeader from "./components/ExportModalHeader";
import PresetOption from "./components/PresetOption";
import ItemsSoldDates from "./components/ItemsSoldDates";
import FinancialsOptions from "./components/FinancialsOptions";
import FinancialsStorePicker from "./components/FinancialsStorePicker";
import SubDeptItemsOption from "./components/SubDeptItemsOption";
import ExportFooter from "./components/ExportFooter";
import DataSourcePicker from "./components/DataSourcePicker";
import GroupByPicker from "./components/GroupByPicker";
import MetricsPicker from "./components/MetricsPicker";
import CustomPreview from "./components/CustomPreview";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SalesExportModalProps {
  onClose: () => void;
  storeName: string;
  dateLabel: string;
  rawSubs: SubSale[];
  rawLWSubs: SubSale[];
  rawLYSubs: SubSale[];
  rawHourly: HourlySale[];
  rawLWHourly: HourlySale[];
  rawLYHourly: HourlySale[];
  days: DayDot[];
  subDeptItems?: ExportSubDeptItem[];
  subDeptName?: string;
  /** The store this popup is about, and the week it is showing. The Financials
   *  option is the only one that fetches, so it is the only one that needs
   *  them. */
  storeId: number;
  /** The location within `storeId`: Items Sold reads that location's items
   *  a day at a time. */
  storeNumber: string;
  /** The day picked in the day cards, if any: Items Sold starts on it. */
  selectedDate?: string | null;
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

const SalesExportModal = ({
  onClose,
  storeName,
  dateLabel,
  rawSubs,
  rawLWSubs,
  rawLYSubs,
  rawHourly,
  rawLWHourly,
  rawLYHourly,
  days,
  subDeptItems,
  subDeptName,
  storeId,
  storeNumber,
  selectedDate = null,
  startDate,
  endDate,
  group,
  stores,
}: SalesExportModalProps) => {
  const hasItems = !!subDeptItems && subDeptItems.length > 0;
  const toast = useToast();
  const { url, token } = useAppSelector((state) => state.app);
  const loadRecapWeek = useRecapWeekItems(storeId, storeNumber);
  /** Fetched with the search — see SalesLedger's fetchLedger. */
  const {
    financials: searchedRows,
    financialsWindow,
    financialsTruncated,
    financialsLoading,
  } = useAppSelector((state) => state.dev.salesLedger);

  // ── Preset state — no default selections ──
  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<ExportDataset>>(new Set());
  const [itemSevs, setItemSevs] = useState<Set<ItemSev>>(new Set());
  // Defaults to the store being looked at, even when a group was searched:
  // this popup is about one store, and the wider answer should be asked for
  // rather than assumed.
  const [fetching, setFetching] = useState(false);
  // Its own dates, defaulting to the week on screen. Financials is the only
  // export that can answer for a range the page is not showing, and a month
  // of records is the usual ask.
  // Items Sold's dates: one day or a range. Starts on the day picked in the
  // day cards, as Summary's item grid shows it, else the week.
  const [itemsFrom, setItemsFrom] = useState(selectedDate ?? startDate);
  const [itemsTo, setItemsTo] = useState(selectedDate ?? endDate);
  const itemsDates = datesBetween(itemsFrom, itemsTo);
  const itemsTooLong = itemsDates.length > MAX_EXPORT_DAYS;
  const [finFrom, setFinFrom] = useState(startDate);
  const [finTo, setFinTo] = useState(endDate);
  // Starts on the store being looked at. A whole group's records should be
  // asked for rather than arrive by default.
  const [finStores, setFinStores] = useState<Set<number>>(
    () => new Set([storeId]),
  );

  /** Narrowing by store needs a group to fetch and more than one store in it. */
  const canFilterStores = !!group && !!stores && stores.length > 1;
  const finTicked = [...finStores];

  // Selecting a severity chip activates the "Sub Dept Items" preset (and
  // clearing them all back out deactivates it), so the two stay in sync.
  const toggleItemSev = (sev: ItemSev) => {
    const next = new Set(itemSevs);
    next.has(sev) ? next.delete(sev) : next.add(sev);
    setItemSevs(next);
    setSelected((prev) => {
      const n = new Set(prev);
      if (next.size > 0) n.add("items");
      else n.delete("items");
      return n;
    });
  };

  // Ticking "Sub Dept Items" on its own selects every severity (unless some
  // are already picked); unticking it clears them.
  const toggleItems = () => {
    const checking = !selected.has("items");
    if (checking) {
      if (itemSevs.size === 0)
        setItemSevs(new Set(["critical", "watch", "healthy"]));
    } else {
      setItemSevs(new Set());
    }
    setSelected((prev) => {
      const n = new Set(prev);
      checking ? n.add("items") : n.delete("items");
      return n;
    });
  };

  // Lives here, not in Custom mode, so its picks survive a switch to Presets
  // and back.
  const {
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
  } = useCustomExport({
    rawSubs,
    rawLWSubs,
    rawLYSubs,
    rawHourly,
    rawLWHourly,
    rawLYHourly,
  });

  /**
   * Fetch the financials rows, or null if the call failed.
   *
   * The only part of an export that can fail — the other presets are built
   * from data already on the page.
   */
  /**
   * The rows the search already brought back, when they answer the question
   * being asked. Null when the dates have been moved off the searched week,
   * which is the one case this has to go and ask.
   */
  const searchedAnswers =
    financialsWindow &&
    financialsWindow.start === finFrom &&
    financialsWindow.end === finTo;

  const fetchFinancials = async (): Promise<FinancialsResponse | null> => {
    if (searchedAnswers) {
      return {
        error: 0,
        success: true,
        record_count: searchedRows.length,
        truncated: financialsTruncated,
        maxRows: 0,
        storeids: [],
        data: searchedRows.filter((r) => finStores.has(r.storeid)),
      };
    }
    // The endpoint takes one store OR one group, never an arbitrary set. So a
    // subset is fetched at group scope and cut down here: one call either way,
    // where asking per store would be a call each.
    const asGroup = finTicked.length !== 1 && canFilterStores;
    try {
      const resp = await getFinancials(
        url,
        token,
        finFrom,
        finTo,
        asGroup ? group!.id : (finTicked[0] ?? storeId),
        asGroup ? 1 : 0,
      );
      const j: FinancialsResponse = resp.data;
      if (j.error !== 0) {
        toast.error(j.msg || "Could not read the financials");
        return null;
      }
      return asGroup
        ? { ...j, data: j.data.filter((r) => finStores.has(r.storeid)) }
        : j;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not read the financials",
      );
      return null;
    }
  };

  // ── Preset download ──
  const handlePresetDownload = async () => {
    const sections: string[] = [];
    if (selected.has("summary"))
      sections.push(`Weekly Summary\n${buildSummaryCsv(days)}`);
    if (selected.has("subdept"))
      sections.push(
        `Sub Department\n${buildSubDeptCsv(rawSubs, rawLWSubs, rawLYSubs)}`,
      );
    if (selected.has("deptgrid"))
      sections.push(
        `Sub Dept by Day — This Week\n${buildDeptDayGridCsv(rawSubs, days)}`,
      );
    if (selected.has("hourly"))
      sections.push(
        `Hourly Breakdown\n${buildHourlyCsv(rawHourly, rawLWHourly, rawLYHourly)}`,
      );
    if (selected.has("items") && subDeptItems && itemSevs.size > 0) {
      const label = subDeptName ? `Items — ${subDeptName}` : "Sub Dept Items";
      sections.push(`${label}\n${buildItemsCsv(subDeptItems, itemSevs)}`);
    }
    // Items Sold is Summary's item grid as a file: one row per UPC with its
    // totals over one date or a range (the From and To under the preset),
    // before any search or filter. It takes the days Summary already read
    // from the cache and reads only the rest, a day at a time. A day that
    // fails is left out rather than losing the file, and the warning names
    // it.
    if (selected.has("dailyrecap")) {
      setFetching(true);
      const recapDates = itemsDates;
      const week = await loadRecapWeek(recapDates);
      setFetching(false);
      const missing = week.filter((d) => d.failed).map((d) => d.date);
      const rows = mergeItems(
        week.map((d) => d.items),
        [],
      );
      // No title row: the file opens on its column headings, so it sorts and
      // filters in a spreadsheet as it stands.
      sections.push(
        recapCsv(
          rows,
          sellsByWeight(rawSubs) || rows.some((r) => r.pounds > 0),
        ),
      );
      if (missing.length) {
        toast.warn(
          `Items Sold is missing ${missing.map(dayLabel).join(", ")}: those days could not be read`,
        );
      }
    }
    // Last, and the only one that goes to the network. A failure here must
    // not lose the sections already built, so a null answer simply leaves
    // Financials out of a file that still carries everything else.
    if (selected.has("financials")) {
      setFetching(true);
      const fin = await fetchFinancials();
      setFetching(false);
      if (fin) {
        const scopeLabel =
          finTicked.length === 1 ? storeName : `${finTicked.length} stores`;
        // The caveat belongs IN the file. Somebody opens this a week later
        // with no idea a cap was involved, and a short CSV looks exactly like
        // a complete one.
        const note = fin.truncated
          ? " — INCOMPLETE: the row cap bit, narrow the dates or pick fewer stores"
          : "";
        sections.push(
          `Financials — ${scopeLabel}, ${finFrom} to ${finTo}${note}\n${buildFinancialsCsv(fin.data)}`,
        );
        if (fin.truncated) {
          toast.warn("Financials hit the row cap — the file is incomplete");
        }
        if (fin.data.length === 0) {
          toast.warn("No financials rows for those stores and dates");
        }
      }
    }

    if (!sections.length) return;
    const safeName = storeName.replace(/[^a-z0-9]/gi, "_");
    // With Items Sold ticked the file is named for its date or range, which
    // need not be the week's.
    const fileDates =
      selected.has("dailyrecap") && itemsDates.length
        ? fileDateLabel(itemsDates[0], itemsDates[itemsDates.length - 1])
        : dateLabel;
    downloadCsv(sections.join("\n\n"), `${safeName}_${fileDates}.csv`);
    onClose();
  };

  // ── Custom download ──
  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    const headers = columns.map((c) => c.label);
    const rows = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    const safeName = storeName.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(
      rowsToCsv(headers, rows),
      `${safeName}_custom_${dateLabel}.csv`,
    );
    onClose();
  };

  const canCustomDownload = columns.length > 0 && aggRows.length > 0;

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:sales:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
      {/* Header */}
      <ExportModalHeader
        storeName={storeName}
        mode={mode}
        onModeChange={setMode}
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
          <div className="grid grid-cols-[200px_1fr] divide-x divide-gray-100 min-h-[360px] max-h-[calc(100vh-220px)]">
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
            label="Download CSV"
          />
        </>
      )}
    </ResizableModalShell>
  );
};

export default SalesExportModal;
