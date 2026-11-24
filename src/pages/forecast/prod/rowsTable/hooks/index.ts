// Hooks
import { useMemo, useState } from "react";
import { useTriStateSort } from "../../../../../utils/useTriStateSort";

// Utils
import { rankRows, tierCounts, tierSummary } from "../../utils/forecastRanking";
import { sortValue } from "../../utils";

// Interfaces
import type { SortCol, Tier } from "../../interfaces";
import type { useForecastCtx } from "../../hooks";

/**
 * The grid's rows and what is worked out from them: ranks and tiers across
 * the selection, the tier and column filters, the sort and the tier bands,
 * plus the figures the strip and toolbar show.
 */
export const useForecastGrid = (ctx: ReturnType<typeof useForecastCtx>) => {
  const { rowData, checkedUpcs, forecastResults, tierFilter, initialRowData } =
    ctx;
  const [draftUpc, setDraftUpc] = useState<string>("");
  const [appliedUpc, setAppliedUpc] = useState<string>("");
  const [draftDesc, setDraftDesc] = useState<string>("");
  const [appliedDesc, setAppliedDesc] = useState<string>("");
  const { sort, handleSort, applySort } = useTriStateSort<SortCol>();

  /** The item panel decides what this covers — the grid never filters itself. */
  const rows = useMemo(
    () => rowData.filter((r) => checkedUpcs.includes(r.upc)),
    [rowData, checkedUpcs],
  );
  /** Ranked across the whole selection, not the tier-filtered view — so a
   *  share doesn't change meaning the moment you click a chip. */
  const ranks = useMemo(() => rankRows(rows), [rows]);
  const counts = useMemo(() => tierCounts(ranks), [ranks]);
  const summary = useMemo(() => tierSummary(ranks), [ranks]);

  /** Empty selection means every tier — the chips are additive, not exclusive. */
  const visible = useMemo(
    () =>
      tierFilter.length === 0
        ? rows
        : rows.filter((r) => {
            const tier = ranks.get(r.upc)?.tier;
            return tier ? tierFilter.includes(tier) : false;
          }),
    [rows, ranks, tierFilter],
  );

  /** Column filters narrow what the tier chips left. Ranks are untouched, so a
   *  share still means share-of-the-whole-selection while you're searching. */
  const searched = useMemo(() => {
    if (!appliedUpc && !appliedDesc) return visible;
    const u = appliedUpc.toLowerCase();
    const d = appliedDesc.toLowerCase();
    return visible.filter(
      (r) =>
        (!u || r.upc.toLowerCase().includes(u)) &&
        (!d || r.description.toLowerCase().includes(d)),
    );
  }, [visible, appliedUpc, appliedDesc]);

  /** Contribution order is the default: biggest first, because on a list of any
   *  size the top handful IS the ad. A user sort replaces it entirely. */
  const sorted = useMemo(
    () =>
      sort
        ? applySort(searched, sortValue)
        : [...searched].sort((a, b) => b.fcstTotal - a.fcstTotal),
    [searched, sort],
  );

  /**
   * The row that opens each tier band, shown only in contribution order with
   * no tier filter.
   */
  const bandStarts = useMemo(() => {
    if (sort) return new Map<string, Tier>();
    const out = new Map<string, Tier>();
    const seen = new Set<Tier>();
    for (const row of sorted) {
      const tier = ranks.get(row.upc)?.tier;
      if (!tier || seen.has(tier)) continue;
      seen.add(tier);
      out.set(row.upc, tier);
    }
    return out;
  }, [sorted, ranks, sort]);

  const coverage = useMemo(() => {
    const aRows = rows.filter((r) => ranks.get(r.upc)?.tier === "A");
    const share = aRows.reduce(
      (sum, r) => sum + (ranks.get(r.upc)?.share ?? 0),
      0,
    );
    return { count: aRows.length, share };
  }, [rows, ranks]);

  /**
   * UPCs whose applied price was typed rather than from history: their Qty sold
   * (0) and At price (an estimate) still drive the forecast but are not shown
   * as history.
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

  const hasNotes = useMemo(
    () => searched.some((r) => (r.notes ?? "").trim() !== ""),
    [searched],
  );

  /** Reset only means something once something has been changed. Compared on
   *  the two fields the toolbar writes, so a note doesn't light it up. */
  const isEdited = useMemo(
    () =>
      searched.some((row) => {
        const original = initialRowData.find((r) => r.upc === row.upc);
        if (!original) return false;
        return (
          original.fcstPrice !== row.fcstPrice || original.adDays !== row.adDays
        );
      }),
    [searched, initialRowData],
  );

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

  return {
    draftUpc,
    setDraftUpc,
    appliedUpc,
    setAppliedUpc,
    draftDesc,
    setDraftDesc,
    appliedDesc,
    setAppliedDesc,
    sort,
    handleSort,
    rows,
    ranks,
    counts,
    summary,
    searched,
    sorted,
    bandStarts,
    coverage,
    customPriced,
    hasNotes,
    isEdited,
    totals,
  };
};
