// Hooks
import { useMemo, useState } from "react";

// Utils
import { rowsToCsv, downloadCsv } from "../../../../../utils/csvExport";
import { ACTION_LABEL, ACTION_RANK } from "../../utils/verdict";
import { buildPriceEras } from "../../utils/priceEras";
import {
  ITEM_COLS,
  ERA_COLS,
  RECEIPT_COLS,
  SUMMARY_COLS,
  COLS,
  PRESETS,
  slug,
} from "../utils";
import {
  buildItemRows,
  buildEraRows,
  buildReceiptRows,
  buildSummaryRows,
} from "../utils/rows";

// Interfaces
import type { ActionKind, SheetRow, ReceiptLine } from "../../interfaces";
import type { Col, ModalMode, Row, Source } from "../interfaces";

interface ItemReportExportInput {
  onClose: () => void;
  storeName: string;
  dateLabel: string;
  lookbackDays: number;
  rows: SheetRow[];
  receiptsByUpc: Record<string, ReceiptLine[]>;
  receivingComplete: boolean;
}

/**
 * The export pop-up's state: the chosen preset or custom source and columns,
 * the vendor, department and action filters, the four sheets built from the
 * narrowed rows, and the download.
 */
export const useItemReportExport = ({
  onClose,
  storeName,
  dateLabel,
  lookbackDays,
  rows,
  receiptsByUpc,
  receivingComplete,
}: ItemReportExportInput) => {
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
    () => buildItemRows(scoped, receiptsByUpc, receivingComplete, lookbackDays),
    [scoped, receiptsByUpc, receivingComplete, lookbackDays],
  );
  const eraRows = useMemo<Row[]>(
    () => buildEraRows(scoped, erasByUpc),
    [scoped, erasByUpc],
  );
  const receiptRows = useMemo<Row[]>(
    () => buildReceiptRows(scoped, receiptsByUpc),
    [scoped, receiptsByUpc],
  );
  const summaryRows = useMemo<Row[]>(() => buildSummaryRows(scoped), [scoped]);

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

  return {
    mode,
    setMode,
    presetKey,
    setPresetKey,
    preset,
    vendorPick,
    setVendorPick,
    deptPick,
    setDeptPick,
    actionPick,
    setActionPick,
    vendorOpts,
    actionOpts,
    deptOpts,
    rowsOf,
    source,
    setSource,
    picked,
    toggleCol,
    activeCols,
    cols,
    rowsOut,
    canDownload,
    handleDownload,
  };
};
