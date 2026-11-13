// Hooks
import { useMemo, useState } from "react";

// Utils
import { rowsToCsv, downloadCsv, fmtNum } from "../../../../utils/csvExport";
import { ACTION_LABEL, ACTION_RANK } from "../utils/verdict";
import { buildPriceEras } from "../utils/priceEras";
import { daysSince } from "../utils/metrics";
import {
  PREVIEW_ROWS,
  ITEM_COLS,
  ERA_COLS,
  RECEIPT_COLS,
  SUMMARY_COLS,
  COLS,
  SOURCE_LABEL,
  PRESETS,
  slug,
} from "./utils";

// Interfaces
import type { ActionKind, SheetRow, ReceiptLine } from "../interfaces";
import type { Col, ModalMode, Row, Source } from "./interfaces";

// Components
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";
import MultiSelectFilter from "../../../../components-dev/filters/MultiSelectFilter";

interface ItemReportExportModalProps {
  onClose: () => void;
  storeName: string;
  dateLabel: string;
  lookbackDays: number;
  rows: SheetRow[];
  receiptsByUpc: Record<string, ReceiptLine[]>;
  receivingComplete: boolean;
}

/**
 * CSV export for Item Actions.
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
const ItemReportExportModal = ({
  onClose,
  storeName,
  dateLabel,
  lookbackDays,
  rows,
  receiptsByUpc,
  receivingComplete,
}: ItemReportExportModalProps) => {
  const [mode, setMode] = useState<ModalMode>("presets");
  const [presetKey, setPresetKey] = useState<string>(PRESETS[0].key);
  const preset = PRESETS.find((p) => p.key === presetKey) ?? PRESETS[0];
  /** Empty means every one — an untouched filter must never quietly empty a
   *  file someone is about to send. Same rule as the other export modals. */
  const [vendorPick, setVendorPick] = useState<string[]>([]);
  const [deptPick, setDeptPick] = useState<string[]>([]);
  /** Custom mode only. Presets each declare their own actions, so offering this
   *  alongside them would be two controls fighting over the same rows. */
  const [actionPick, setActionPick] = useState<string[]>([]);

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

  const vendorOpts = useMemo(
    () =>
      [...new Set(ordered.map((r) => r.item.vendorName).filter(Boolean))]
        .sort()
        .map((v) => ({ label: v, value: v })),
    [ordered],
  );
  /** Only the actions actually present, worst first. Listing empty categories
   *  invites filtering to nothing and wondering why the file is blank. */
  const actionOpts = useMemo(() => {
    const present = new Set(ordered.map((r) => r.verdict.action));
    return [...present]
      .sort((a, b) => ACTION_RANK[a] - ACTION_RANK[b])
      .map((a) => ({ label: ACTION_LABEL[a], value: a }));
  }, [ordered]);

  const deptOpts = useMemo(
    () =>
      [...new Set(ordered.map((r) => r.item.department).filter(Boolean))]
        .sort()
        .map((d) => ({ label: d, value: d })),
    [ordered],
  );

  /**
   * The rows this file will actually contain.
   *
   * Narrowed before anything is built, so every grain below inherits the same
   * scope — the price periods and receipts in a filtered export belong to the
   * same items the item rows do, rather than quietly covering the whole store.
   */
  const scoped = useMemo(
    () =>
      ordered.filter(({ item, verdict }) => {
        const actions =
          mode === "presets"
            ? preset.actions
            : actionPick.length > 0
              ? (actionPick as ActionKind[])
              : undefined;
        if (actions && !actions.includes(verdict.action)) return false;
        if (vendorPick.length > 0 && !vendorPick.includes(item.vendorName))
          return false;
        if (deptPick.length > 0 && !deptPick.includes(item.department))
          return false;
        return true;
      }),
    [ordered, mode, preset, vendorPick, deptPick, actionPick],
  );

  const erasByUpc = useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildPriceEras>>();
    for (const { item } of scoped) {
      map.set(
        item.productCode,
        buildPriceEras(item, receiptsByUpc[item.productCode] ?? []),
      );
    }
    return map;
  }, [scoped, receiptsByUpc]);

  const itemRows = useMemo<Row[]>(
    () =>
      scoped.map(({ item, verdict }) => {
        const receipts = receiptsByUpc[item.productCode] ?? [];
        const last = receipts[0] ?? null;
        return {
          action: ACTION_LABEL[verdict.action],
          evidence: verdict.evidence,
          dept: item.department,
          vendor: item.vendorName,
          upc: item.productCode,
          description: item.description,
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
          receivedUnits: last ? fmtNum(last.sellingUnits) : "",
          moveReceived: item.movement ? item.movement.received : "",
          moveSold: item.movement ? item.movement.sold : "",
          moveNet: item.movement ? item.movement.net : "",
          moveDays: item.movement ? item.movement.days : "",
          unaccounted:
            verdict.unaccounted === null ? "" : fmtNum(verdict.unaccounted),
          intendedRetail: last && last.retail > 0 ? fmtNum(last.retail) : "",
        };
      }),
    [scoped, receiptsByUpc, receivingComplete, lookbackDays],
  );

  const eraRows = useMemo<Row[]>(
    () =>
      scoped.flatMap(({ item }) =>
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
    [scoped, erasByUpc],
  );

  const receiptRows = useMemo<Row[]>(
    () =>
      scoped.flatMap(({ item }) =>
        (receiptsByUpc[item.productCode] ?? []).map((r) => ({
          upc: item.productCode,
          description: item.description,
          date: r.date.slice(0, 10),
          vendor: r.vendorName,
          invoice: r.invoiceId,
          units: fmtNum(r.sellingUnits),
          cases: r.cases,
          billedIn: r.billedIn,
          // Blank on a unit receipt rather than 0 — there is no pack to state,
          // and a zero would read as one.
          caseSize: r.caseSize === null ? "" : r.caseSize,
          unitCost: fmtNum(r.unitCost),
          retail: fmtNum(r.retail),
          free: r.free > 0 ? "Yes" : "No",
          returned: r.returned > 0 ? "Yes" : "No",
        })),
      ),
    [scoped, receiptsByUpc],
  );

  /** One row per department, counted by action. Built from `scoped` like every
   *  other grain, so a narrowed export summarises what it contains rather than
   *  what the store contains. */
  const summaryRows = useMemo<Row[]>(() => {
    const byDept = new Map<
      string,
      {
        items: number;
        counts: Record<ActionKind, number>;
        sales: number;
        units: number;
        lyUnits: number;
        hasLY: boolean;
      }
    >();
    for (const { item, verdict } of scoped) {
      const key = item.department || "—";
      let e = byDept.get(key);
      if (!e) {
        e = {
          items: 0,
          counts: {
            investigate: 0,
            reorder: 0,
            reprice: 0,
            vendor: 0,
            none: 0,
            insufficient: 0,
            pending: 0,
          },
          sales: 0,
          units: 0,
          lyUnits: 0,
          hasLY: false,
        };
        byDept.set(key, e);
      }
      e.items += 1;
      e.counts[verdict.action] += 1;
      e.sales += item.ty.sales;
      e.units += item.ty.units;
      if (item.ly) {
        e.lyUnits += item.ly.units;
        e.hasLY = true;
      }
    }
    return [...byDept.entries()]
      .sort((a, b) => b[1].sales - a[1].sales)
      .map(([dept, e]) => ({
        dept,
        items: e.items,
        investigate: e.counts.investigate,
        reorder: e.counts.reorder,
        reprice: e.counts.reprice,
        vendor: e.counts.vendor,
        none: e.counts.none,
        insufficient: e.counts.insufficient,
        sales: fmtNum(e.sales),
        units: fmtNum(e.units),
        // Blank rather than 0% when there is no last year to compare against —
        // an unknown is not a flat year.
        lyPct:
          e.hasLY && e.lyUnits > 0
            ? fmtNum(((e.units - e.lyUnits) / e.lyUnits) * 100)
            : "",
      }));
  }, [scoped]);

  const rowsOf: Record<Source, Row[]> = {
    items: itemRows,
    eras: eraRows,
    receipts: receiptRows,
    summary: summaryRows,
  };

  const [source, setSource] = useState<Source>("items");
  const [picked, setPicked] = useState<Record<Source, Set<string>>>(() => {
    const seed = (cols: Col[]) =>
      new Set(cols.filter((c) => c.defaultOn).map((c) => c.key));
    return {
      items: seed(ITEM_COLS),
      eras: seed(ERA_COLS),
      receipts: seed(RECEIPT_COLS),
      summary: seed(SUMMARY_COLS),
    };
  });

  const toggleCol = (key: string) =>
    setPicked((prev) => {
      const next = new Set(prev[source]);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, [source]: next };
    });

  /** In presets mode the recipient decides the grain and the columns; in custom
   *  mode the user does. */
  const activeSource = mode === "presets" ? preset.source : source;
  const byKey = new Map(COLS[activeSource].map((c) => [c.key, c]));
  const presetCols = preset.cols
    .map((k) => byKey.get(k))
    .filter((c): c is Col => !!c);
  const activeCols = COLS[source].filter((c) => picked[source].has(c.key));
  const cols = mode === "presets" ? presetCols : activeCols;
  const rowsOut = rowsOf[activeSource];
  const canDownload = rowsOut.length > 0 && cols.length > 0;

  const handleDownload = () => {
    downloadCsv(
      rowsToCsv(
        cols.map((c) => c.label),
        rowsOut.map((r) => cols.map((c) => r[c.key] ?? "")),
      ),
      // Store, week and who it is for. These land in a Downloads folder beside
      // four others from the same week, and "critical-items-items.csv" told the
      // reader none of the three things they need.
      `${slug(storeName)}_${slug(dateLabel)}_${
        mode === "presets" ? preset.key : `custom-${activeSource}`
      }.csv`,
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
      <div className="cc-phone-header">
        <div className="min-w-0">
          <p className="cc-navy-title text-[13px]">
            Export CSV
          </p>
          <p className="text-custom-white/95 text-[12px] truncate">
            {storeName} · {dateLabel}
          </p>
        </div>
        <div className="cc-segment-navy">
          {(["presets", "custom"] as ModalMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`cc-chip-btn text-[11px] ${
                mode === m
                  ? "bg-custom-white text-brand_navy"
                  : "text-custom-white/95 hover:text-custom-white"
              }`}
            >
              {m === "presets" ? "Presets" : "Custom"}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="cc-navy-link justify-self-end"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {!receivingComplete && (
        <div className="px-4 pt-3">
          <div className="cc-notice text-[11.5px] leading-snug">
            Deliveries are still being read. Actions that depend on receivers
            are provisional, and receiving columns will be blank for items the
            walk hasn't reached.
          </div>
        </div>
      )}

      {/* Narrowing, shared by both modes. Only the controls the active preset
          declares are shown — a vendor packet has no use for a department
          picker, and an unexplained control is one more thing to get wrong. */}
      {(mode === "custom" || preset.filters.length > 0) && (
        <div className="px-4 pt-3 flex items-center gap-2 flex-wrap">
          {mode === "custom" && (
            <>
              <span className="text-[11px] text-content">Actions</span>
              <MultiSelectFilter
                options={actionOpts}
                values={actionPick}
                onChange={setActionPick}
                placeholder="All actions"
                noun="actions"
                className="w-[180px]"
              />
            </>
          )}
          {(mode === "custom" || preset.filters.includes("vendor")) && (
            <>
              <span className="text-[11px] text-content">Vendors</span>
              <MultiSelectFilter
                options={vendorOpts}
                values={vendorPick}
                onChange={setVendorPick}
                placeholder="All vendors"
                noun="vendors"
                className="w-[200px]"
              />
            </>
          )}
          {(mode === "custom" || preset.filters.includes("dept")) && (
            <>
              <span className="text-[11px] text-content">Departments</span>
              <MultiSelectFilter
                options={deptOpts}
                values={deptPick}
                onChange={setDeptPick}
                placeholder="All departments"
                noun="departments"
                className="w-[200px]"
              />
            </>
          )}
        </div>
      )}

      {mode === "presets" ? (
        <div className="p-4">
          <p className="text-[11px] text-content/95 uppercase tracking-wide font-medium mb-2">
            Who is this for?
          </p>
          {PRESETS.map((pr) => {
            const count = rowsOf[pr.source].length;
            return (
              <label
                key={pr.key}
                className={`flex items-start gap-2.5 py-2.5 border-b border-line_hair last:border-b-0 cursor-pointer ${
                  presetKey === pr.key || count > 0 ? "" : "opacity-40"
                }`}
              >
                <input
                  type="radio"
                  checked={presetKey === pr.key}
                  onChange={() => setPresetKey(pr.key)}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-content">
                    {pr.title}
                  </p>
                  <p className="text-[11px] text-content/95 mt-0.5">
                    {pr.blurb}
                  </p>
                  {presetKey === pr.key && (
                    <p className="text-[11px] text-content/95 mt-0.5 font-medium">
                      {rowsOut.length} rows · {cols.length} columns
                      {receivingComplete ? "" : " · still reading invoices"}
                    </p>
                  )}
                </div>
              </label>
            );
          })}
          <button
            onClick={handleDownload}
            disabled={!canDownload}
            className="w-full mt-3 flex items-center justify-center gap-1.5 cc-btn-primary text-[12px]"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            Download CSV
          </button>
        </div>
      ) : (
        <div
          className="grid flex-1 min-h-0"
          style={{ gridTemplateColumns: "220px 1fr" }}
        >
          {/* The source list stays put; only the column list scrolls. Twenty-odd
              checkboxes were pushing the download button off the bottom of the
              modal, and the fix has to be here rather than on the whole column
              or the source radios scroll away with them. */}
          <div className="p-3.5 border-r border-line_hair flex flex-col min-h-0">
            <p className="text-[10px] cc-caps mb-2">
              Data source
            </p>
            {SOURCE_LABEL.map(({ key, label }) => (
              <label
                key={key}
                className={`flex items-center gap-1.5 mb-1.5 cursor-pointer ${
                  rowsOf[key].length > 0 ? "" : "opacity-40"
                }`}
              >
                <input
                  type="radio"
                  checked={source === key}
                  onChange={() => setSource(key)}
                  disabled={rowsOf[key].length === 0}
                />
                <span className="text-[11.5px] text-content">{label}</span>
              </label>
            ))}

            <p className="text-[10px] cc-caps mt-3.5 mb-2 flex-shrink-0">
              Columns
            </p>
            <div className="cc-scroll pr-1">
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
          </div>

          <div className="p-3.5 flex flex-col min-h-0">
            <p className="text-[10px] cc-caps mb-2 flex-shrink-0">
              Preview
            </p>
            <div className="border border-line_hair rounded-md overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-fill_soft border-b border-line_hair">
                    {activeCols.map((c) => (
                      <th
                        key={c.key}
                        className="text-left px-2.5 py-1.5 text-content/95 font-semibold whitespace-nowrap"
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowsOut.slice(0, PREVIEW_ROWS).map((r, i) => (
                    <tr key={i} className="border-b border-line_faint">
                      {activeCols.map((c) => (
                        <td
                          key={c.key}
                          className="px-2.5 py-1 text-content/95 whitespace-nowrap max-w-[280px] truncate"
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
                        className="px-2.5 py-1.5 text-[10px] text-content/95"
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
                className="text-[12px] cc-muted-link"
              >
                Cancel
              </button>
              <button
                onClick={handleDownload}
                disabled={!canDownload}
                className="flex items-center gap-1.5 cc-btn-primary text-[12px]"
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
