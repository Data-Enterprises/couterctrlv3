// Hooks
import { useMemo, useState } from "react";

// Utils
import { rowsToCsv, downloadCsv } from "../../../../../../utils/csvExport";
import {
  batchCell,
  buildBatchRows,
  buildSaleTypeRows,
  COLS,
  dailyCell,
  defaultsFor,
  saleTypeCell,
} from "../../utils";

// Interfaces
import type { DayBucket } from "../../../interfaces";
import type {
  BatchColKey,
  DailyColKey,
  ModalMode,
  Preset,
  SaleTypeColKey,
} from "../../interfaces";
import type { QueueItem } from "../../../../../../features/itemLookupSlice";

interface LookupExportInput {
  queue: QueueItem[];
  selectedDescription: string;
  buckets: DayBucket[];
  selectedSaleType: string;
  weighed: boolean;
  onClose: () => void;
}

/**
 * The export pop-up's state: the preset or custom source and its columns, the
 * three tables (batch summary, the current item's days, by sale type), which
 * of them have data, and the download.
 */
export const useLookupExport = ({
  queue,
  selectedDescription,
  buckets,
  selectedSaleType,
  weighed,
  onClose,
}: LookupExportInput) => {
  const [mode, setMode] = useState<ModalMode>("presets");
  const [preset, setPreset] = useState<Preset>("batch");
  const [source, setSource] = useState<Preset>("batch");
  const [chosenCols, setChosenCols] = useState<Record<Preset, Set<string>>>(
    () => ({
      batch: defaultsFor("batch"),
      daily: defaultsFor("daily"),
      saleTypes: defaultsFor("saleTypes"),
    }),
  );

  const batchRows = useMemo(() => buildBatchRows(queue), [queue]);
  const saleTypeRows = useMemo(() => buildSaleTypeRows(queue), [queue]);
  const hasSelectedItem = buckets.length > 0;
  // Nothing but Sale — every response from an endpoint without sale_type.
  const hasSaleTypes = saleTypeRows.some((r) => r.saleType !== "Sale");
  const timelineName =
    selectedSaleType === "Sale" ? "sales" : selectedSaleType.toLowerCase();

  const available: Record<Preset, boolean> = {
    batch: batchRows.length > 0,
    daily: hasSelectedItem,
    saleTypes: hasSaleTypes,
  };

  const fileName: Record<Preset, string> = {
    batch: "item-lookup-batch-summary.csv",
    daily: `item-lookup-daily-${timelineName}.csv`,
    saleTypes: "item-lookup-sale-types.csv",
  };

  /** Header and rows for a source, limited to `only` when given. */
  const tableFor = (src: Preset, only?: Set<string>) => {
    const cols = COLS[src].filter((c) => !only || only.has(c.key));
    const rows =
      src === "batch"
        ? batchRows.map((r) =>
            cols.map((c) => batchCell(r, c.key as BatchColKey)),
          )
        : src === "daily"
          ? buckets.map((b) =>
              cols.map((c) =>
                dailyCell(b, c.key as DailyColKey, selectedSaleType, weighed),
              ),
            )
          : saleTypeRows.map((r) =>
              cols.map((c) => saleTypeCell(r, c.key as SaleTypeColKey)),
            );
    return { cols, rows };
  };

  const toggleCol = (src: Preset, key: string) => {
    setChosenCols((prev) => {
      const next = new Set(prev[src]);
      next.has(key) ? next.delete(key) : next.add(key);
      return { ...prev, [src]: next };
    });
  };

  const custom = tableFor(source, chosenCols[source]);

  const handleDownload = () => {
    const src = mode === "presets" ? preset : source;
    const { cols, rows } =
      mode === "presets" ? tableFor(src) : tableFor(src, chosenCols[src]);
    downloadCsv(
      rowsToCsv(
        cols.map((c) => c.label),
        rows,
      ),
      fileName[src],
    );
    onClose();
  };

  const canDownload =
    mode === "presets"
      ? available[preset]
      : available[source] && custom.cols.length > 0;

  const presetOptions: { key: Preset; title: string; detail: string }[] = [
    {
      key: "batch",
      title: "All items — batch summary",
      detail: `One row per loaded item (${batchRows.length})`,
    },
    {
      key: "daily",
      title: "Current item — daily breakdown",
      detail: hasSelectedItem
        ? `${selectedDescription} · ${timelineName} · one row per day`
        : "Select an item first",
    },
    {
      key: "saleTypes",
      title: "All items — by sale type",
      detail: hasSaleTypes
        ? "One row per loaded item per sale type — Sale, Backup, Cancelled, Voided"
        : "No sale types other than Sale in this batch",
    },
  ];

  return {
    mode,
    setMode,
    preset,
    setPreset,
    source,
    setSource,
    chosenCols,
    toggleCol,
    available,
    custom,
    canDownload,
    handleDownload,
    presetOptions,
  };
};
