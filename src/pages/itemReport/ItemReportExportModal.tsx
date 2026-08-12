import { useMemo, useState } from "react";
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../components/modals/ResizableModalShell";
import { rowsToCsv, downloadCsv, fmtNum } from "../../utils/csvExport";
import {
  ACTION_LABEL,
  ACTION_RANK,
  buildPriceEras,
  daysSince,
} from "./itemReportMetrics";
import type { SheetRow } from "./ItemReportSheet";
import type { ReceiptLine } from "./itemReportData";

/**
 * CSV export for Item Report.
 *
 * The sheet is the deliverable and this is the same sheet in a file — same
 * rows, same order, same action, same evidence sentence. Anyone comparing the
 * screen against the download should find them identical, because the export is
 * how most of this report is actually read: away from the app, in the tool
 * these people already live in.
 *
 * The evidence column carries the written finding verbatim. A row that says
 * "cost up 6% across the last three deliveries and the shelf price didn't
 * follow" survives being opened a week later by someone who wasn't here;
 * eleven columns of percentages do not.
 *
 * Three grains, kept apart. Items are one row per UPC, price periods one row
 * per price held, receipts one row per delivery — joining them would repeat an
 * item's totals down every period and multiply its sales in a pivot.
 */

type ModalMode = "presets" | "custom";
type Source = "items" | "eras" | "receipts";

interface Props {
  onClose: () => void;
  storeName: string;
  dateLabel: string;
  lookbackDays: number;
  rows: SheetRow[];
  receiptsByUpc: Record<string, ReceiptLine[]>;
  receivingComplete: boolean;
}

type Row = Record<string, string | number>;

interface Col {
  key: string;
  label: string;
  defaultOn: boolean;
}

const PREVIEW_ROWS = 5;

const ITEM_COLS: Col[] = [
  { key: "action", label: "Action", defaultOn: true },
  { key: "evidence", label: "Evidence", defaultOn: true },
  { key: "dept", label: "Sub department", defaultOn: true },
  { key: "vendor", label: "Vendor", defaultOn: true },
  { key: "upc", label: "UPC", defaultOn: true },
  { key: "description", label: "Description", defaultOn: true },
  { key: "source", label: "Source", defaultOn: true },
  { key: "sales", label: "Sales", defaultOn: true },
  { key: "units", label: "Units", defaultOn: true },
  { key: "lwPct", label: "vs LW units %", defaultOn: true },
  { key: "lyPct", label: "vs LY units %", defaultOn: true },
  { key: "lwUnits", label: "LW units", defaultOn: true },
  { key: "lyUnits", label: "LY units", defaultOn: true },
  { key: "lwSales", label: "LW sales", defaultOn: false },
  { key: "lySales", label: "LY sales", defaultOn: false },
  { key: "unitCost", label: "Cost / unit", defaultOn: true },
  { key: "marginPct", label: "GM %", defaultOn: true },
  { key: "daysSold", label: "Days sold", defaultOn: false },
  { key: "lastReceived", label: "Last received", defaultOn: true },
  { key: "daysSinceRecv", label: "Days since received", defaultOn: true },
  { key: "receivedUnits", label: "Units received", defaultOn: true },
  { key: "moveReceived", label: "Received (14d)", defaultOn: true },
  { key: "moveSold", label: "Sold (14d)", defaultOn: true },
  { key: "moveNet", label: "Net units (14d)", defaultOn: true },
  { key: "moveDays", label: "Movement days", defaultOn: false },
  { key: "unaccounted", label: "Unaccounted since delivery", defaultOn: true },
  { key: "intendedRetail", label: "Intended retail", defaultOn: true },
];

const ERA_COLS: Col[] = [
  { key: "upc", label: "UPC", defaultOn: true },
  { key: "description", label: "Description", defaultOn: true },
  { key: "start", label: "From", defaultOn: true },
  { key: "end", label: "To", defaultOn: true },
  { key: "days", label: "Days", defaultOn: true },
  { key: "price", label: "Price", defaultOn: true },
  { key: "unitCost", label: "Cost / unit", defaultOn: true },
  { key: "marginPct", label: "GM %", defaultOn: true },
  { key: "units", label: "Units", defaultOn: true },
  { key: "unitsPerDay", label: "Units / day", defaultOn: true },
];

const RECEIPT_COLS: Col[] = [
  { key: "upc", label: "UPC", defaultOn: true },
  { key: "description", label: "Description", defaultOn: true },
  { key: "date", label: "Date", defaultOn: true },
  { key: "vendor", label: "Vendor", defaultOn: true },
  { key: "invoice", label: "Invoice", defaultOn: true },
  { key: "units", label: "Units", defaultOn: true },
  { key: "cases", label: "Cases", defaultOn: true },
  { key: "unitCost", label: "Unit cost", defaultOn: true },
  { key: "retail", label: "Intended retail", defaultOn: true },
];

const COLS: Record<Source, Col[]> = {
  items: ITEM_COLS,
  eras: ERA_COLS,
  receipts: RECEIPT_COLS,
};

const ItemReportExportModal = ({
  onClose,
  storeName,
  dateLabel,
  lookbackDays,
  rows,
  receiptsByUpc,
  receivingComplete,
}: Props) => {
  /** The sheet's order, so the file opens the way the screen looked. */
  const ordered = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          ACTION_RANK[a.verdict.action] - ACTION_RANK[b.verdict.action] ||
          b.item.ty.sales - a.item.ty.sales,
      ),
    [rows],
  );

  const erasByUpc = useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildPriceEras>>();
    for (const { item } of ordered) {
      map.set(
        item.productCode,
        buildPriceEras(item, receiptsByUpc[item.productCode] ?? []),
      );
    }
    return map;
  }, [ordered, receiptsByUpc]);

  const itemRows = useMemo<Row[]>(
    () =>
      ordered.map(({ item, verdict }) => {
        const receipts = receiptsByUpc[item.productCode] ?? [];
        const last = receipts[0] ?? null;
        return {
          action: ACTION_LABEL[verdict.action],
          evidence: verdict.evidence,
          dept: item.department,
          vendor: item.vendorName,
          upc: item.productCode,
          description: item.description,
          // Names the rows the upload could not have contained, so nobody
          // wonders why a UPC they never sent is in their own file.
          source: item.discovered ? "Found in receipts" : "Uploaded",
          sales: fmtNum(item.ty.sales),
          units: fmtNum(item.ty.units),
          lwPct: item.lwPct === null ? "" : fmtNum(item.lwPct),
          lyPct: item.lyPct === null ? "" : fmtNum(item.lyPct),
          lwUnits: item.lw ? fmtNum(item.lw.units) : "",
          lyUnits: item.ly ? fmtNum(item.ly.units) : "",
          lwSales: item.lw ? fmtNum(item.lw.sales) : "",
          lySales: item.ly ? fmtNum(item.ly.sales) : "",
          unitCost: item.unitCost === null ? "" : fmtNum(item.unitCost),
          marginPct: item.marginPct === null ? "" : fmtNum(item.marginPct),
          daysSold: item.daysSold,
          // Blank while the walk runs, so an unfinished export can't be read as
          // "nothing was ever delivered".
          lastReceived: last
            ? last.date.slice(0, 10)
            : receivingComplete
              ? `none in ${lookbackDays}d`
              : "",
          daysSinceRecv: last ? (daysSince(last.date) ?? "") : "",
          receivedUnits: last ? fmtNum(last.units) : "",
          moveReceived: item.movement ? item.movement.received : "",
          moveSold: item.movement ? item.movement.sold : "",
          moveNet: item.movement ? item.movement.net : "",
          moveDays: item.movement ? item.movement.days : "",
          unaccounted:
            verdict.unaccounted === null ? "" : fmtNum(verdict.unaccounted),
          intendedRetail: last && last.retail > 0 ? fmtNum(last.retail) : "",
        };
      }),
    [ordered, receiptsByUpc, receivingComplete, lookbackDays],
  );

  const eraRows = useMemo<Row[]>(
    () =>
      ordered.flatMap(({ item }) =>
        (erasByUpc.get(item.productCode) ?? []).map((e) => ({
          upc: item.productCode,
          description: item.description,
          start: e.start,
          end: e.end,
          days: e.days,
          price: fmtNum(e.price),
          unitCost: e.unitCost === null ? "" : fmtNum(e.unitCost),
          marginPct: e.marginPct === null ? "" : fmtNum(e.marginPct),
          units: fmtNum(e.units),
          unitsPerDay: e.unitsPerDay,
        })),
      ),
    [ordered, erasByUpc],
  );

  const receiptRows = useMemo<Row[]>(
    () =>
      ordered.flatMap(({ item }) =>
        (receiptsByUpc[item.productCode] ?? []).map((r) => ({
          upc: item.productCode,
          description: item.description,
          date: r.date.slice(0, 10),
          vendor: r.vendorName,
          invoice: r.invoiceId,
          units: fmtNum(r.units),
          cases: r.cases,
          unitCost: fmtNum(r.unitCost),
          retail: fmtNum(r.retail),
        })),
      ),
    [ordered, receiptsByUpc],
  );

  const rowsOf: Record<Source, Row[]> = {
    items: itemRows,
    eras: eraRows,
    receipts: receiptRows,
  };

  const [mode, setMode] = useState<ModalMode>("presets");
  const [source, setSource] = useState<Source>("items");
  const [picked, setPicked] = useState<Record<Source, Set<string>>>(() => {
    const seed = (cols: Col[]) =>
      new Set(cols.filter((c) => c.defaultOn).map((c) => c.key));
    return {
      items: seed(ITEM_COLS),
      eras: seed(ERA_COLS),
      receipts: seed(RECEIPT_COLS),
    };
  });

  const toggleCol = (key: string) =>
    setPicked((prev) => {
      const next = new Set(prev[source]);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, [source]: next };
    });

  const PRESETS: { source: Source; title: string; caption: string }[] = [
    {
      source: "items",
      title: "The report — one row per item",
      caption: `${itemRows.length} rows · the sheet as you see it, action and evidence included`,
    },
    {
      source: "eras",
      title: "Price periods — one row per price held",
      caption: `${eraRows.length} rows · price against the cost in force, with units a day`,
    },
    {
      source: "receipts",
      title: "Received — one row per delivery",
      caption: receivingComplete
        ? `${receiptRows.length} rows · dated unit costs and intended retail`
        : `${receiptRows.length} so far · invoices are still being read`,
    },
  ];

  const activeCols = COLS[source].filter((c) => picked[source].has(c.key));
  const cols = mode === "presets" ? COLS[source] : activeCols;
  const rowsOut = rowsOf[source];
  const canDownload = rowsOut.length > 0 && cols.length > 0;

  const handleDownload = () => {
    downloadCsv(
      rowsToCsv(
        cols.map((c) => c.label),
        rowsOut.map((r) => cols.map((c) => r[c.key] ?? "")),
      ),
      `critical-items-${source}.csv`,
    );
    onClose();
  };

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:item-report:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-[#1e2a4a]">
        <div className="min-w-0">
          <p className="text-custom-white text-[13px] font-semibold">
            Export CSV
          </p>
          <p className="text-custom-white/85 text-[10px] truncate">
            {storeName} · {dateLabel}
          </p>
        </div>
        <div className="flex items-center gap-0.5 bg-custom-white/10 rounded-md p-0.5">
          {(["presets", "custom"] as ModalMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                mode === m
                  ? "bg-custom-white text-[#1e2a4a]"
                  : "text-custom-white/85 hover:text-custom-white"
              }`}
            >
              {m === "presets" ? "Presets" : "Custom"}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="text-custom-white/85 hover:text-custom-white transition-colors justify-self-end"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {!receivingComplete && (
        <div className="px-4 pt-3">
          <div className="px-2.5 py-2 rounded-lg bg-amber-50 text-[11.5px] text-amber-900 leading-snug">
            Deliveries are still being read. Actions that depend on receipts are
            provisional, and receiving columns will be blank for items the walk
            hasn't reached.
          </div>
        </div>
      )}

      {mode === "presets" ? (
        <div className="p-4">
          <p className="text-[11px] text-content/85 uppercase tracking-wide font-medium mb-2">
            Select data to include
          </p>
          {PRESETS.map((p) => (
            <label
              key={p.source}
              className={`flex items-start gap-2.5 py-2.5 border-b border-gray-100 last:border-b-0 cursor-pointer ${
                rowsOf[p.source].length > 0 ? "" : "opacity-40"
              }`}
            >
              <input
                type="radio"
                checked={source === p.source}
                onChange={() => setSource(p.source)}
                disabled={rowsOf[p.source].length === 0}
                className="mt-0.5"
              />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-content">
                  {p.title}
                </p>
                <p className="text-[11px] text-content/85 mt-0.5">
                  {p.caption}
                </p>
              </div>
            </label>
          ))}
          <button
            onClick={handleDownload}
            disabled={!canDownload}
            className="w-full mt-3 flex items-center justify-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            Download CSV
          </button>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "220px 1fr" }}>
          <div className="p-3.5 border-r border-gray-100">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-content/85 mb-2">
              Data source
            </p>
            {PRESETS.map((p) => (
              <label
                key={p.source}
                className={`flex items-center gap-1.5 mb-1.5 cursor-pointer ${
                  rowsOf[p.source].length > 0 ? "" : "opacity-40"
                }`}
              >
                <input
                  type="radio"
                  checked={source === p.source}
                  onChange={() => setSource(p.source)}
                  disabled={rowsOf[p.source].length === 0}
                />
                <span className="text-[11.5px] text-content">{p.title}</span>
              </label>
            ))}

            <p className="text-[10px] font-semibold uppercase tracking-wide text-content/85 mt-3.5 mb-2">
              Columns
            </p>
            {COLS[source].map((c) => (
              <label
                key={c.key}
                className="flex items-center gap-1.5 mb-1.5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={picked[source].has(c.key)}
                  onChange={() => toggleCol(c.key)}
                />
                <span className="text-[11.5px] text-content">{c.label}</span>
              </label>
            ))}
          </div>

          <div className="p-3.5 flex flex-col">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-content/85 mb-2">
              Preview
            </p>
            <div className="border border-gray-100 rounded-md overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {activeCols.map((c) => (
                      <th
                        key={c.key}
                        className="text-left px-2.5 py-1.5 text-content/85 font-semibold whitespace-nowrap"
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowsOut.slice(0, PREVIEW_ROWS).map((r, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {activeCols.map((c) => (
                        <td
                          key={c.key}
                          className="px-2.5 py-1 text-content/85 whitespace-nowrap max-w-[280px] truncate"
                        >
                          {r[c.key] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {rowsOut.length > PREVIEW_ROWS && (
                    <tr>
                      <td
                        colSpan={Math.max(activeCols.length, 1)}
                        className="px-2.5 py-1.5 text-[10px] text-content/85"
                      >
                        +{rowsOut.length - PREVIEW_ROWS} more rows in download…
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex-1" />
            <div className="flex items-center justify-between mt-3.5">
              <button
                onClick={onClose}
                className="text-[12px] text-content/85 hover:text-content transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDownload}
                disabled={!canDownload}
                className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </ResizableModalShell>
  );
};

export default ItemReportExportModal;
