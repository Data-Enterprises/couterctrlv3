// Hooks
import { useMemo, useState } from "react";
import { useForecastCtx } from "../../hooks";

// Utils
import { exportData } from "../../../../../utils/export";
import { rankRows } from "../../utils/forecastRanking";
import { COLS, NOT_FOUND_HEADERS, withRank } from "../utils";

// Interfaces
import type { ColKey, ModalMode, PresetId } from "../interfaces";
import type { Tier } from "../../interfaces";
import type { ForecastOutlierRow } from "../../../../../features/dev/devForecastDevSlice";

/**
 * The export's choices and what they make: the mode, the tiers in scope, the
 * presets ticked, the Custom rows and columns, and the downloads.
 */
export const useForecastExport = (onClose: () => void) => {
  const { rowData, checkedUpcs, notFoundUpcs, adListRows, tierFilter, search } =
    useForecastCtx();
  const singleDate = search.singleDate;

  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<PresetId>>(
    () => new Set<PresetId>(["selected"]),
  );
  const [cols, setCols] = useState<Set<ColKey>>(
    () => new Set(COLS.map((c) => c.key)),
  );
  const [customScope, setCustomScope] = useState<"selected" | "all">(
    "selected",
  );
  /** Seeded from the grid, then editable here — the download should match what
   *  you were looking at, without being locked to it. */
  const [tiers, setTiers] = useState<Tier[]>(tierFilter);

  const toggleTier = (tier: Tier) =>
    setTiers((prev) =>
      prev.includes(tier) ? prev.filter((x) => x !== tier) : [...prev, tier],
    );

  const ticked = useMemo(
    () => rowData.filter((r) => checkedUpcs.includes(r.upc)),
    [rowData, checkedUpcs],
  );

  /** Ranked over the ticked set, exactly as the grid does, so a tier means the
   *  same thing in both places. */
  const ranks = useMemo(() => rankRows(ticked), [ticked]);

  const inTier = useMemo(
    () => (row: ForecastOutlierRow) => {
      if (tiers.length === 0) return true;
      const tier = ranks.get(row.upc)?.tier;
      return tier ? tiers.includes(tier) : false;
    },
    [ranks, tiers],
  );

  const selectedRows = useMemo(
    () => withRank(ticked.filter(inTier), ranks),
    [ticked, inTier, ranks],
  );

  const allRows = useMemo(() => {
    // Ranked over everything, not over the ticked subset — "All items" is a
    // different population, so a row's band can legitimately differ here.
    const allRanks = rankRows(rowData);
    const inScope =
      tiers.length === 0
        ? rowData
        : rowData.filter((r) => {
            const tier = allRanks.get(r.upc)?.tier;
            return tier ? tiers.includes(tier) : false;
          });
    return withRank(inScope, allRanks);
  }, [rowData, tiers]);

  const tierCountsFor = useMemo(() => {
    const out: Record<Tier, number> = { A: 0, B: 0, C: 0 };
    for (const entry of ranks.values()) out[entry.tier] += 1;
    return out;
  }, [ranks]);

  const togglePreset = (id: PresetId) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const toggleCol = (key: ColKey) =>
    setCols((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  const activeCols = COLS.filter((c) => cols.has(c.key));
  const customRows = customScope === "selected" ? selectedRows : allRows;
  const stamp = singleDate.replace(/\//g, "-");
  const allHeaders = COLS.map((c) => ({ headerName: c.label, field: c.key }));

  const presetDatasets: {
    id: PresetId;
    label: string;
    description: string;
    disabled: boolean;
  }[] = [
    {
      id: "selected",
      label: "Selected items",
      description: `One row per ticked item (${selectedRows.length})`,
      disabled: selectedRows.length === 0,
    },
    {
      id: "all",
      label: "All items",
      description: `Everything the search returned (${allRows.length})`,
      disabled: allRows.length === 0,
    },
    {
      id: "notFound",
      label: "No sales history",
      description:
        notFoundUpcs.length > 0
          ? `UPCs the stores returned nothing for (${notFoundUpcs.length})`
          : "Every UPC came back with history",
      disabled: notFoundUpcs.length === 0,
    },
  ];

  const handlePresetDownload = () => {
    if (selected.has("selected"))
      exportData(selectedRows, allHeaders, `forecast_selected_${stamp}.csv`);
    if (selected.has("all"))
      exportData(allRows, allHeaders, `forecast_all_${stamp}.csv`);
    if (selected.has("notFound"))
      exportData(
        notFoundUpcs.map((upc) => ({
          upc,
          pageName: adListRows[upc]?.pageName ?? "",
          featureDescription: adListRows[upc]?.featureDescription ?? "",
          featureNotes: adListRows[upc]?.featureNotes ?? "",
        })),
        NOT_FOUND_HEADERS,
        `forecast_no_history_${stamp}.csv`,
      );
    onClose();
  };

  const handleCustomDownload = () => {
    exportData(
      customRows,
      activeCols.map((c) => ({ headerName: c.label, field: c.key })),
      `forecast_custom_${stamp}.csv`,
    );
    onClose();
  };

  return {
    mode,
    setMode,
    selected,
    togglePreset,
    cols,
    toggleCol,
    customScope,
    setCustomScope,
    tiers,
    toggleTier,
    tierCountsFor,
    selectedRows,
    allCount: rowData.length,
    presetDatasets,
    activeCols,
    customRows,
    handlePresetDownload,
    handleCustomDownload,
  };
};
