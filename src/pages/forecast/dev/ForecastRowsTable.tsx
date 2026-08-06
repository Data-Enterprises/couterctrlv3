import { useMemo, useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import {
  setSelectedUpc,
  setBatchAdDaysRows,
  setBatchPriceRows,
  setBatchNotesRows,
} from "../../../features/forecastDevSlice";
import type { ForecastOutlierRow } from "../../../features/forecastSlice";
import { formatCurrency2 } from "../../../utils";
import { useTriStateSort } from "../../../utils/useTriStateSort";
import SortHeader, { PERF_SORT_HEADER } from "../../../components/SortHeader";

/**
 * The forecast grid.
 *
 * Rows are a CSS grid on a shared column template, the same construction
 * `AssociationItemsTable` uses — sticky uppercase header, `even:bg-row_stripe`,
 * `border-[#1e2a4a]/15` rules. No table element and no grid library: the rows
 * are a flat list with one tri-state sort, which `useTriStateSort` already
 * does for every other Performance list.
 *
 * Detail lives in the calculator popup on double-click, so there are no tabs
 * and no expanding rows here. Notes are set two ways: in bulk from the toolbar
 * across every ticked row, or per item in that popup.
 */

/** Item | notes | qty | active | at price | forecast | ad days | price | fcst | total | markdown */
const COLS =
  "1fr 120px 66px 58px 58px 62px 58px 66px 58px 82px 82px";

const HEAD =
  "sticky top-0 z-10 bg-custom-white grid gap-1.5 px-2 py-1.5 border-b border-[#1e2a4a]/15";

type SortCol =
  | "qtySold"
  | "adFcst"
  | "fcstTotal"
  | "markdownDollars"
  | "fcstPrice";

const sortValue = (row: ForecastOutlierRow, col: SortCol) => row[col];

/** One list drives the header row so every cell — sortable or not — is built
 *  from the same class, in the same order as the row beneath it. */
const HEAD_CELLS: { col?: SortCol; label: string }[] = [
  { label: "Item" },
  { label: "Notes" },
  { col: "qtySold", label: "Qty sold" },
  { label: "Active" },
  { label: "At price" },
  { label: "Forecast" },
  { label: "Ad days" },
  { col: "fcstPrice", label: "Price" },
  { col: "adFcst", label: "Ad fcst" },
  { col: "fcstTotal", label: "Total" },
  { col: "markdownDollars", label: "Markdown" },
];

const ForecastRowsTable = ({
  onExportClick,
}: {
  onExportClick: () => void;
}) => {
  const dispatch = useAppDispatch();
  const {
    rowData,
    checkedUpcs,
    isLoadingMore,
    notFoundUpcs,
    adListRows,
    forecastResults,
  } = useAppSelector((s) => s.forecastDev);
  const singleDate = useAppSelector((s) => s.search.singleDate);

  const [batchAdDays, setBatchAdDays] = useState("");
  const [batchPrice, setBatchPrice] = useState("");
  const [batchNotes, setBatchNotes] = useState("");
  const [notFoundOpen, setNotFoundOpen] = useState(false);
  const { sort, handleSort, applySort } = useTriStateSort<SortCol>();

  /** The item panel decides what this covers — the grid never filters itself. */
  const rows = useMemo(
    () => rowData.filter((r) => checkedUpcs.includes(r.upc)),
    [rowData, checkedUpcs],
  );
  const sorted = useMemo(
    () => applySort(rows, sortValue),
    [rows, sort],
  );

  /**
   * UPCs whose applied price was typed rather than drawn from history.
   *
   * Both Qty sold and At price are meaningless for those rows and worse than
   * blank: applying a custom price sets `qtySold` to 0 — which reads as "sold
   * none" when it means "never sold at this price" — and `daysAtPrice` to an
   * estimate. The figures still drive the forecast; they just stop being
   * reported as history.
   */
  const customPriced = useMemo(() => {
    const set = new Set<string>();
    for (const row of rowData) {
      const hist = forecastResults.find((r) => r.upc === row.upc);
      if (!hist) continue;
      const known = hist.price_history.some(
        (ph) => Math.abs(parseFloat(ph.price) - row.fcstPrice) < 0.001,
      );
      if (!known) set.add(row.upc);
    }
    return set;
  }, [rowData, forecastResults]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          units: acc.units + r.adFcst,
          total: acc.total + r.fcstTotal,
          markdown: acc.markdown + Math.max(0, r.markdownDollars),
        }),
        { units: 0, total: 0, markdown: 0 },
      ),
    [rows],
  );

  /** Writes to every ticked row. Single-price rows are excluded, as in legacy —
   *  one price point can't be refitted to a new one. */
  const handleSetBatch = () => {
    const upcs = rows.filter((r) => !r.singlePrice).map((r) => r.upc);
    if (!upcs.length) return;
    const days = parseInt(batchAdDays);
    const price = parseFloat(batchPrice);
    if (!isNaN(days) && days > 0)
      dispatch(setBatchAdDaysRows({ upcs, adDays: days }));
    if (!isNaN(price) && price > 0)
      dispatch(setBatchPriceRows({ upcs, price }));
    // Notes go to every ticked row, single-price included — see the reducer.
    if (batchNotes.trim())
      dispatch(
        setBatchNotesRows({
          upcs: rows.map((r) => r.upc),
          notes: batchNotes.trim(),
        }),
      );
  };

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="bg-custom-white rounded-xl overflow-hidden flex flex-col h-full">
        {/* 1-row navy header */}
        <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between bg-[#1e2a4a]">
          <div className="text-[13px] font-semibold text-custom-white leading-tight">
            Last 90 days ending {singleDate}
          </div>
          <button
            className="text-custom-white transition-colors"
            onClick={onExportClick}
            title="Export"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-4 divide-x divide-[#1e2a4a]/15 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          {[
            ["Items", String(rows.length)],
            ["Ad fcst units", totals.units.toLocaleString()],
            ["Fcst total", formatCurrency2(totals.total)],
            ["Markdown", formatCurrency2(totals.markdown)],
          ].map(([label, value]) => (
            <div key={label} className="px-4 pt-2.5 pb-2.5 text-center min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wide text-content">
                {label}
              </div>
              <div className="text-[13px] font-bold text-content truncate">
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* batch setter — writes to every ticked row, so the count is named */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-content/85">
            Set for {rows.length} selected
          </span>
          <input
            type="number"
            min={1}
            step={1}
            max={7}
            placeholder="Ad days"
            value={batchAdDays}
            onChange={(e) => setBatchAdDays(e.target.value)}
            className="text-[11px] rounded px-2 py-1 border border-gray-200 bg-custom-white w-20"
            style={{ outline: "none", boxShadow: "none" }}
          />
          <input
            type="number"
            min={0.01}
            step={0.01}
            placeholder="Price"
            value={batchPrice}
            onChange={(e) => setBatchPrice(e.target.value)}
            className="text-[11px] rounded px-2 py-1 border border-gray-200 bg-custom-white w-20"
            style={{ outline: "none", boxShadow: "none" }}
          />
          <input
            type="text"
            placeholder="Note"
            value={batchNotes}
            onChange={(e) => setBatchNotes(e.target.value)}
            className="text-[11px] rounded px-2 py-1 border border-gray-200 bg-custom-white w-32"
            style={{ outline: "none", boxShadow: "none" }}
          />
          <button
            onClick={handleSetBatch}
            disabled={
              !rows.length ||
              (!batchAdDays && !batchPrice && !batchNotes.trim())
            }
            className="text-[11px] font-semibold px-2.5 py-1 rounded bg-[#1e2a4a] text-custom-white hover:bg-[#2a3a63] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Apply
          </button>
          <span className="text-[10.5px] text-content/85 ml-auto">
            Double-click a row for the calculator
          </span>
        </div>

        {isLoadingMore && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border-b border-blue-100 flex-shrink-0">
            <div className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin shrink-0" />
            <span className="text-[11px] text-blue-600 font-medium">
              Loading more items…
            </span>
          </div>
        )}

        {notFoundUpcs.length > 0 && !isLoadingMore && (
          <div className="flex-shrink-0 border-b border-amber-200 relative">
            <button
              className="w-full flex items-center justify-between px-3 py-1 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
              onClick={() => setNotFoundOpen((o) => !o)}
            >
              <span className="text-[11px] text-amber-700 font-medium">
                {notFoundUpcs.length} item{notFoundUpcs.length !== 1 ? "s" : ""}{" "}
                had no sales history at the selected stores
              </span>
              <span className="text-[10px] text-amber-500 ml-2 shrink-0">
                {notFoundOpen ? "hide" : "show"}
              </span>
            </button>
            {notFoundOpen && (
              <div className="absolute left-0 right-0 top-full z-20 max-h-96 overflow-y-auto thin-scrollbar bg-amber-50 border border-amber-200 shadow-lg rounded-b-md px-3 pb-2">
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 pt-1">
                  {notFoundUpcs.map((upc) => (
                    <div key={upc} className="contents">
                      <span className="text-[11px] font-medium text-content tabular-nums">
                        {upc}
                      </span>
                      <span className="text-[11px] font-medium text-content/85 truncate">
                        {adListRows[upc]?.featureDescription ||
                          adListRows[upc]?.pageName ||
                          "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* rows */}
        <div className="flex-1 overflow-y-auto thin-scrollbar min-h-0">
          <div className={HEAD} style={{ gridTemplateColumns: COLS }}>
            {HEAD_CELLS.map((cell, i) =>
              cell.col ? (
                <SortHeader
                  key={cell.label}
                  col={cell.col}
                  label={cell.label}
                  sort={sort}
                  onSort={handleSort}
                  className={`${PERF_SORT_HEADER} justify-end`}
                />
              ) : (
                <span
                  key={cell.label}
                  className={`${PERF_SORT_HEADER} ${i < 2 ? "" : "text-right"}`}
                >
                  {cell.label}
                </span>
              ),
            )}
          </div>

          {sorted.length === 0 ? (
            <div className="text-[12px] text-content/85 py-6 text-center">
              Nothing selected — tick items in the list on the left.
            </div>
          ) : (
            sorted.map((row) => (
              <div
                key={row.upc}
                onDoubleClick={() =>
                  !row.singlePrice && dispatch(setSelectedUpc(row.upc))
                }
                title={
                  row.singlePrice
                    ? "Only one price point — nothing to model"
                    : "Double-click for the calculator"
                }
                className={`grid gap-1.5 items-center px-2 py-[7px] border-b border-[#1e2a4a]/15 last:border-b-0 even:bg-row_stripe hover:bg-gray-50 ${
                  row.singlePrice ? "" : "cursor-pointer"
                }`}
                style={{ gridTemplateColumns: COLS }}
              >
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-content truncate flex items-center gap-1">
                    <span className="truncate">{row.description}</span>
                    {row.adListData && (
                      <span className="shrink-0 text-[9px] bg-blue-500 text-custom-white rounded px-0.5 font-medium">
                        AD
                      </span>
                    )}
                    {row.singlePrice && (
                      <span className="shrink-0 text-[9px] bg-yellow-200 text-yellow-700 rounded px-0.5 font-medium">
                        1pt
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-medium text-content/85 tabular-nums">
                    {row.upc}
                  </div>
                </div>
                <span
                  className="text-[11px] font-medium text-content/85 truncate"
                  title={row.notes || ""}
                >
                  {row.notes || ""}
                </span>
                <span className="text-right text-[12px] font-medium tabular-nums text-content">
                  {customPriced.has(row.upc)
                    ? "—"
                    : row.qtySold.toLocaleString()}
                </span>
                <span className="text-right text-[12px] font-medium tabular-nums text-content/85">
                  {row.daysActive}/90
                </span>
                <span className="text-right text-[12px] font-medium tabular-nums text-content/85">
                  {customPriced.has(row.upc)
                    ? "—"
                    : `${row.daysAtPrice}/${row.daysActive}`}
                </span>
                <span className="text-right text-[12px] font-medium tabular-nums text-content/85">
                  {row.forecastWindow}
                </span>
                <span className="text-right text-[12px] font-medium tabular-nums text-content">
                  {row.adDays === 0 ? "—" : row.adDays}
                </span>
                <span className="text-right text-[12px] font-medium tabular-nums text-content">
                  {formatCurrency2(row.fcstPrice)}
                </span>
                <span className="text-right text-[12px] font-medium tabular-nums text-content">
                  {row.adFcst.toLocaleString()}
                </span>
                <span className="text-right text-[13px] font-bold tabular-nums text-content">
                  {formatCurrency2(row.fcstTotal)}
                </span>
                <span className="text-right text-[12px] font-medium tabular-nums text-content">
                  {formatCurrency2(Math.max(0, row.markdownDollars))}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ForecastRowsTable;
