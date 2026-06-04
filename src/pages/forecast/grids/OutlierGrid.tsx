import { useEffect, useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import {
  setCalcNow,
  setBatchAdDaysRows,
  setBatchPriceRows,
  setBatchNotesRows,
} from "../../../features/forecastSlice";

import type { ForecastOutlierRow } from "../../../features/forecastSlice";
import { formatCurrency2 } from "../../../utils";
import CalcModal from "../CalcModal";

const NotesCell = ({
  upc,
  calcNow,
  notes,
  disabled,
}: {
  upc: string;
  calcNow: 0 | 1;
  notes?: string;
  disabled?: boolean;
}) => {
  const dispatch = useAppDispatch();
  return (
    <label
      className={`flex items-center justify-center gap-1 select-none h-full ${disabled ? "opacity-30" : "cursor-pointer"}`}
      title={notes || ""}
    >
      <input
        type="checkbox"
        data-testid={`calc-now-checkbox-${upc}`}
        checked={calcNow === 1}
        disabled={disabled}
        onChange={() =>
          dispatch(setCalcNow({ upc, calcNow: calcNow === 1 ? 0 : 1 }))
        }
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
      />
    </label>
  );
};

// ── Column widths as proportional units (sum = 100) ──────────────────────────
const COL_SIZES = [8, 8, 17, 7, 8, 8, 7, 6, 7, 6, 7, 7];

const columnHelper = createColumnHelper<ForecastOutlierRow>();

// ── Main component ────────────────────────────────────────────────────────────

const OutlierGrid = () => {
  const state = useAppSelector((state) => state.forecast);
  const dispatch = useAppDispatch();

  const [filterText, setFilterText] = useState("");
  const [batchAdDays, setBatchAdDays] = useState("");
  const [batchPrice, setBatchPrice] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [batchNotes, setBatchNotes] = useState("");
  const [notFoundOpen, setNotFoundOpen] = useState(false);
  const adListRows = useAppSelector((s) => s.adList.rows);

  const filteredData = useMemo(
    () =>
      filterText
        ? state.rowData.filter((r) =>
            r.description.toLowerCase().includes(filterText.toLowerCase()),
          )
        : state.rowData,
    [filterText, state.rowData],
  );

  const handleSetBatch = () => {
    const upcs = filteredData.filter((r) => !r.singlePrice).map((r) => r.upc);
    if (!upcs.length) return;
    const days = parseInt(batchAdDays);
    const price = parseFloat(batchPrice);
    if (!isNaN(days) && days > 0)
      dispatch(setBatchAdDaysRows({ upcs, adDays: days }));
    if (!isNaN(price) && price > 0)
      dispatch(setBatchPriceRows({ upcs, price }));
    if (batchNotes.trim())
      dispatch(setBatchNotesRows({ upcs, notes: batchNotes.trim() }));
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "calcNow",
        enableSorting: false,
        header: "Notes",
        cell: ({ row }) => (
          <NotesCell
            upc={row.original.upc}
            calcNow={row.original.calcNow}
            notes={row.original.notes}
            disabled={row.original.singlePrice}
          />
        ),
      }),
      columnHelper.accessor("upc", {
        header: "UPC",
        cell: ({ getValue }) => (
          <div className="text-right truncate">{getValue()}</div>
        ),
      }),
      columnHelper.accessor("description", {
        header: "Description/Notes",
        cell: ({ row, getValue }) => (
          <div className="flex flex-col min-w-0">
            <div className="truncate flex items-center gap-1">
              <span className="truncate">{getValue()}</span>
              {row.original.adListData && (
                <span className="shrink-0 text-[9px] bg-blue-500 text-white rounded px-0.5 font-medium">
                  AD
                </span>
              )}
              {row.original.singlePrice && (
                <span className="shrink-0 text-[9px] bg-yellow-200 text-yellow-700 rounded px-0.5 font-medium">
                  1pt
                </span>
              )}
            </div>
            {row.original.notes && (
              <div className="truncate text-[10px] text-blue-500 italic leading-tight">
                {row.original.notes}
              </div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor("qtySold", {
        header: "Qty Sold",
        cell: ({ getValue }) => <div className="text-right">{getValue()}</div>,
      }),
      columnHelper.accessor("daysActive", {
        enableSorting: false,
        header: "Days Active",
        cell: ({ getValue }) => (
          <div className="text-right">{getValue()}/90</div>
        ),
      }),
      columnHelper.accessor("daysAtPrice", {
        enableSorting: false,
        header: "At Price",
        cell: ({ row }) => (
          <div className="text-right">
            {row.original.daysAtPrice}/{row.original.daysActive}
          </div>
        ),
      }),
      columnHelper.accessor("forecastWindow", {
        enableSorting: false,
        header: "Forecast",
        cell: ({ getValue }) => <div className="text-right">{getValue()}</div>,
      }),
      columnHelper.accessor("adDays", {
        enableSorting: false,
        header: "Ad Days",
        cell: ({ getValue }) => (
          <div className="text-right">
            {getValue() === 0 ? "—" : getValue()}
          </div>
        ),
      }),
      columnHelper.accessor("fcstPrice", {
        enableSorting: false,
        header: "Fcst Price",
        cell: ({ getValue }) => (
          <div className="text-right">{formatCurrency2(getValue())}</div>
        ),
      }),
      columnHelper.accessor("adFcst", {
        header: "Ad Fcst",
        cell: ({ getValue }) => <div className="text-right">{getValue()}</div>,
      }),
      columnHelper.accessor("fcstTotal", {
        header: "Fcst Total",
        cell: ({ getValue }) => (
          <div className="text-right">{formatCurrency2(getValue())}</div>
        ),
      }),
      columnHelper.accessor("markdownDollars", {
        header: "Markdown $",
        cell: ({ getValue }) => (
          <div className="text-right">{formatCurrency2(getValue())}</div>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.upc,
    initialState: { pagination: { pageSize: 25 } },
  });

  // Reset to first page when the underlying row set changes
  useEffect(() => {
    table.setPageIndex(0);
  }, [state.rowData.length]);

  if (state.initialRowData.length === 0) return null;

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = filteredData.length;
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div
      className="animate-windowIn bg-custom-white rounded-lg shadow-lg flex flex-col overflow-hidden"
      style={{ maxHeight: "calc(100vh - 13.2rem)" }}
    >
      <CalcModal />

      {/* Filter + batch setter toolbar */}
      <div className="flex items-center gap-2 px-2 py-1 border-b border-gray-100 shrink-0 flex-wrap">
        {/* Badge legend */}
        <div className="flex items-center gap-2 shrink-0 cursor-default select-none">
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="text-[9px] bg-blue-500 text-white rounded px-0.5 font-medium">
              AD
            </span>
            AD list item
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="text-[9px] bg-yellow-200 text-yellow-700 rounded px-0.5 font-medium">
              1pt
            </span>
            Single price point
          </span>
        </div>
        <div className="w-px h-4 bg-gray-200 shrink-0" />
        <div className="flex items-center gap-1 flex-1 min-w-[180px]">
          <input
            type="text"
            placeholder="Filter by description..."
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              table.setPageIndex(0);
              // This may need to get taken out
              if (e.target.value === "") {
                setBatchAdDays("");
                setBatchPrice("");
                setBatchNotes("");
              }
            }}
            className="basic-input text-xs py-0.5 px-1.5 flex-1"
          />
          {filterText && (
            <>
              <button
                onClick={() => {
                  setFilterText("");
                  setBatchAdDays("");
                  setBatchPrice("");
                  setBatchNotes("");
                }}
                className="text-gray-400 hover:text-gray-600 px-1 text-xs"
              >
                ✕
              </button>
              <span className="text-[11px] text-gray-400 shrink-0">
                {filteredData.length} items
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            step={1}
            max={7}
            placeholder="Ad Days"
            value={batchAdDays}
            onChange={(e) => setBatchAdDays(e.target.value)}
            className="basic-input text-xs py-0.5 px-1.5 w-16"
          />
          <input
            type="number"
            placeholder="Price"
            min={0.01}
            step={0.01}
            value={batchPrice}
            onChange={(e) => setBatchPrice(e.target.value)}
            className="basic-input text-xs py-0.5 px-1.5 w-16"
          />
          <input
            type="text"
            placeholder="Note"
            value={batchNotes}
            onChange={(e) => setBatchNotes(e.target.value)}
            className="basic-input text-xs py-0.5 px-1.5 w-24"
          />
          <button
            onClick={handleSetBatch}
            disabled={
              !filterText || (!batchAdDays && !batchPrice && !batchNotes.trim())
            }
            className="text-xs px-2 py-0.5 btn-themeBlue disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Set Batch
          </button>
        </div>
      </div>

      {/* Batch 2 loading indicator */}
      {state.isLoadingMore && (
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border-b border-blue-100 shrink-0">
          <div className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin shrink-0" />
          <span className="text-[11px] text-blue-600 font-medium">
            Loading more items…
          </span>
        </div>
      )}

      {/* Not-found banner */}
      {state.notFoundUpcs.length > 0 && !state.isLoadingMore && (
        <div className="shrink-0 border-b border-amber-200 relative">
          <button
            className="w-full flex items-center justify-between px-3 py-1 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
            onClick={() => setNotFoundOpen((o) => !o)}
          >
            <span className="text-[11px] text-amber-700 font-medium">
              ⚠ {state.notFoundUpcs.length} item
              {state.notFoundUpcs.length !== 1 ? "s" : ""} from the AD list had
              no sales history at the selected stores
            </span>
            <span className="text-[10px] text-amber-500 ml-2 shrink-0">
              {notFoundOpen ? "▲ hide" : "▼ show"}
            </span>
          </button>
          {notFoundOpen && (
            <div className="absolute left-0 right-0 top-full z-20 max-h-96 overflow-y-auto thin-scrollbar bg-amber-50 border border-amber-200 shadow-lg rounded-b-md px-3 pb-2">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 pt-1">
                {state.notFoundUpcs.map((upc) => {
                  const ad = adListRows[upc];
                  return (
                    <div key={upc} className="contents">
                      <span className="text-[11px] text-gray-500 font-mono">
                        {upc}
                      </span>
                      <span className="text-[11px] text-gray-600 truncate">
                        {ad?.featureDescription || ad?.pageName || "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scrollable table body */}
      <div className="overflow-y-auto flex-1 thin-scrollbar">
        <table className="w-full text-xs border-collapse table-fixed">
          <colgroup>
            {COL_SIZES.map((s, i) => (
              <col key={i} style={{ width: `${s}%` }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="bg-blue-500 text-white" style={{ height: "22px" }}>
              {table.getHeaderGroups()[0].headers.map((header) => (
                <th
                  key={header.id}
                  className={`px-1.5 text-left font-medium border-r border-blue-400 last:border-r-0 whitespace-nowrap overflow-hidden text-ellipsis${header.column.getCanSort() ? " cursor-pointer select-none" : ""}`}
                  onClick={
                    header.column.getCanSort()
                      ? header.column.getToggleSortingHandler()
                      : undefined
                  }
                >
                  <span className="inline-flex items-center gap-0.5">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {header.column.getCanSort() && (
                      <span className="opacity-50 text-[9px]">
                        {{ asc: "▲", desc: "▼" }[
                          header.column.getIsSorted() as string
                        ] ?? "⇅"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className={`border-b border-gray-100 transition-colors hover:bg-blue-50 ${
                  row.original.singlePrice
                    ? "bg-yellow-50"
                    : i % 2 === 0
                      ? "bg-custom-white"
                      : "bg-blue-50"
                }`}
                style={{ height: "30px" }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-1.5 overflow-hidden text-[11px]"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-gray-100 text-xs text-gray-600 shrink-0">
        <div className="flex items-center gap-1">
          <span>Rows per page:</span>
          <select
            className="border border-gray-200 rounded px-1 py-0.5 bg-custom-white text-xs"
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[10, 15, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <span className="text-gray-500">
          {firstRow}–{lastRow} of {totalRows}
        </span>

        <div className="flex items-center gap-1">
          <button
            className="px-2 py-0.5 rounded border border-gray-200 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            «
          </button>
          <button
            className="px-2 py-0.5 rounded border border-gray-200 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            ‹
          </button>
          <span className="px-2">
            {pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <button
            className="px-2 py-0.5 rounded border border-gray-200 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            ›
          </button>
          <button
            className="px-2 py-0.5 rounded border border-gray-200 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutlierGrid;
