// Hooks
import { useEffect, useState, useRef, useMemo } from "react";
import { useAppDispatch } from "../../../../../hooks";
import { useSubMarginCtx, useSubMarginActions, useSubMarginState } from "../../hooks";

// Utils
import { getLYDate } from "../../../../../utils/dates";
import {
  buildItemRows,
  buildItemDetail,
  buildInsight,
  getItemSeverity,
  sortValue,
  SEV_RANK,
  type RowMetricKey,
  type SortCol,
  type ItemSeverity as Severity,
} from "../../../../../utils/itemMargins";
import { buildReportRows, byDate, getColSortValue, nextColSort } from "./utils";

// Interfaces
import type { SubDeptMargin, ThresholdValue } from "../../../../../interfaces";
import { shiftIso, type Coverage } from "../../../../../utils/grading";
import type { ColSort, SevFilter } from "./interfaces";

// Components
import UpcContextMenu from "../../../../../components-dev/UpcContextMenu";
import ItemListToolbar from "./components/ItemListToolbar";
import ItemListHeader from "./components/ItemListHeader";
import ItemListRow from "./components/ItemListRow";
import ItemReport from "./components/ItemReport";

interface MarginPerfItemsTableProps {
  tyMargins: SubDeptMargin[];
  lwMargins: SubDeptMargin[];
  lyMargins: SubDeptMargin[];
  /** The store's coverage for the week — see utils/grading. */
  coverage?: Coverage;
}

/** The Items tab: the open sub department's items, graded, on the left, and
 *  the picked item's report on the right. */
const MarginPerfItemsTable = ({
  tyMargins,
  lwMargins,
  lyMargins,
  coverage,
}: MarginPerfItemsTableProps) => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const ctx = useSubMarginCtx();
  // Same Margin/Sales toggle the left panel grades sub depts against —
  // read directly from the dev slice, matching how MarginPerfLeftPanel and
  // MarginPerfRightPanel already read it (this tab is dev-only).
  const { gradingMetric } = useSubMarginState();

  // The left list's TY/LW/LY figures always reflect the Margin/Sales toggle
  // in the left panel (gradingMetric) — the View dropdown only controls sort
  // order (see displayData below) and must never change what's displayed.
  const activeMetric: RowMetricKey =
    gradingMetric === "margin" ? "margin" : "sales";

  const [sortCol, setSortCol] = useState<SortCol>("marginTrend");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("asc");
  // Clicking a TY/LW/LY column header sorts directly by that figure (same
  // interaction as the store list in dev Sales — click cycles desc → asc →
  // off) and takes priority over the View dropdown's preset sort while set.
  const [colSort, setColSort] = useState<ColSort>(null);
  const [appliedDesc, setAppliedDesc] = useState("");
  const [appliedUpc, setAppliedUpc] = useState("");

  const [thresholdValue, setThresholdValue] = useState<ThresholdValue | null>({
    op: "gt",
    amount: 9,
  });
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");

  // When a single day is selected in the day sidebar, scope all three
  // periods down to that day — TY to the day itself, LW/LY to that same
  // day's mapped date (holiday- and leap-year-aware for LY via getLYDate).
  const dayFilteredMargins = useMemo(() => {
    if (!ctx.selectedWeekDay)
      return { ty: tyMargins, lw: lwMargins, ly: lyMargins };
    const tyDate = ctx.selectedWeekDay;
    const lwDate = shiftIso(tyDate, -7);
    const lyDate = getLYDate(tyDate);
    return {
      ty: byDate(tyMargins, tyDate),
      lw: byDate(lwMargins, lwDate),
      ly: byDate(lyMargins, lyDate),
    };
  }, [ctx.selectedWeekDay, tyMargins, lwMargins, lyMargins]);

  const rawRows = useMemo(
    () =>
      buildItemRows(
        dayFilteredMargins.ty,
        dayFilteredMargins.lw,
        dayFilteredMargins.ly,
        // A single selected day is already one matched day.
        !ctx.selectedWeekDay && coverage
          ? {
              lwOf: (d) => shiftIso(d, -7),
              lyOf: (d) => getLYDate(d),
              coverage,
            }
          : undefined,
      ),
    [dayFilteredMargins, ctx.selectedWeekDay, coverage],
  );

  useEffect(() => {
    dispatch(
      actions.setItemGridData(
        rawRows.map((r) => ({
          sub_department_description: "",
          product_code: r.productCode,
          product_description: r.description,
          cogs: r.cogs,
          cost_fees: r.costFees,
          total_sales: r.grossSales,
          net_sales: r.netSales,
          total_tax: r.tax,
          qty: r.qty,
          margin: r.tyMarginPct,
        })),
      ),
    );
  }, [rawRows]);

  // Grading should never move items around on its own when the threshold
  // input is cleared — keep grading against the last valid amount so
  // severity/sort stays exactly where it was until a new number is typed.
  const thresholdRef = useRef<number>(thresholdValue?.amount ?? 9);
  if (thresholdValue?.amount != null)
    thresholdRef.current = thresholdValue.amount;
  const thresholdAmt = thresholdRef.current;

  const sevCounts = useMemo(() => {
    const counts: Record<Severity, number> = {
      critical: 0,
      watch: 0,
      healthy: 0,
      ungraded: 0,
    };
    for (const row of rawRows)
      counts[getItemSeverity(row, thresholdAmt, gradingMetric)]++;
    return counts;
  }, [rawRows, thresholdAmt, gradingMetric]);

  // Independent of the active severity chip / search filters, so the context
  // menu's "copy critical/watch/healthy" options always mean the same thing.
  const severityUpcs = useMemo(() => {
    const buckets = {
      critical: [] as string[],
      watch: [] as string[],
      healthy: [] as string[],
    };
    for (const row of rawRows) {
      const sev = getItemSeverity(row, thresholdAmt, gradingMetric);
      if (sev === "critical" || sev === "watch" || sev === "healthy")
        buckets[sev].push(row.productCode);
    }
    return buckets;
  }, [rawRows, thresholdAmt, gradingMetric]);

  const allUpcs = useMemo(() => rawRows.map((r) => r.productCode), [rawRows]);

  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    upc: string;
  } | null>(null);
  const [selectedUpc, setSelectedUpc] = useState<string | null>(null);
  const selectedItem = selectedUpc
    ? (rawRows.find((r) => r.productCode === selectedUpc) ?? null)
    : null;

  const selectedDetail = useMemo(
    () =>
      selectedUpc
        ? buildItemDetail(selectedUpc, tyMargins, lwMargins, lyMargins)
        : null,
    [selectedUpc, tyMargins, lwMargins, lyMargins],
  );
  const selectedInsight = useMemo(
    () =>
      selectedItem && selectedDetail
        ? buildInsight(selectedItem, thresholdAmt, gradingMetric)
        : null,
    [selectedItem, selectedDetail, thresholdAmt, gradingMetric],
  );

  const displayData = useMemo(() => {
    let data = [...rawRows];
    if (appliedDesc)
      data = data.filter((d) =>
        d.description.toLowerCase().includes(appliedDesc.toLowerCase()),
      );
    if (appliedUpc)
      data = data.filter((d) => d.productCode.includes(appliedUpc));

    if (sevFilter !== "all") {
      data = data.filter(
        (d) => getItemSeverity(d, thresholdAmt, gradingMetric) === sevFilter,
      );
    }

    data.sort((a, b) => {
      if (colSort) {
        const av = getColSortValue(a, colSort.col, activeMetric);
        const bv = getColSortValue(b, colSort.col, activeMetric);
        return colSort.dir === "asc" ? av - bv : bv - av;
      }
      if (sevFilter === "all") {
        const ra = SEV_RANK[getItemSeverity(a, thresholdAmt, gradingMetric)];
        const rb = SEV_RANK[getItemSeverity(b, thresholdAmt, gradingMetric)];
        if (ra !== rb) return ra - rb;
      }
      const av = sortValue(a, sortCol);
      const bv = sortValue(b, sortCol);
      return sortDir === "asc" ? av - bv : bv - av;
    });

    return data;
  }, [
    rawRows,
    sortCol,
    sortDir,
    colSort,
    activeMetric,
    appliedDesc,
    appliedUpc,
    sevFilter,
    thresholdAmt,
    gradingMetric,
  ]);

  const openCtxMenu = (e: React.MouseEvent, upc: string) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, upc });
  };

  const reportRows = buildReportRows(selectedItem, gradingMetric);

  return (
    <>
      <div
        className="flex-1 min-h-0 flex"
        onContextMenu={(e) => openCtxMenu(e, "")}
      >
        {/* ── Left: item list ── */}
        <div
          className="flex flex-col border-r border-gray-100 min-w-0"
          style={{ width: "47%", flexShrink: 0 }}
        >
          <ItemListToolbar
            sevFilter={sevFilter}
            setSevFilter={setSevFilter}
            sevCounts={sevCounts}
            thresholdValue={thresholdValue}
            setThresholdValue={setThresholdValue}
            gradingMetric={gradingMetric}
            sortCol={sortCol}
            sortDir={sortDir}
            onPreset={(col, dir) => {
              setSortCol(col);
              setSortDir(dir);
              setColSort(null);
            }}
          />

          <ItemListHeader
            appliedUpc={appliedUpc}
            onUpc={setAppliedUpc}
            appliedDesc={appliedDesc}
            onDesc={setAppliedDesc}
            colSort={colSort}
            onColSort={(col) => setColSort((prev) => nextColSort(prev, col))}
          />

          {/* Rows */}
          <div
            className="flex-1 overflow-y-auto thin-scrollbar"
            style={{ scrollbarGutter: "stable" }}
          >
            {displayData.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-[11px] text-content">
                {rawRows.length > 0 ? "No items match filters" : "No item data"}
              </div>
            ) : (
              displayData.map((item) => {
                const isSel = selectedUpc === item.productCode;
                return (
                  <ItemListRow
                    key={item.productCode}
                    item={item}
                    sev={getItemSeverity(item, thresholdAmt, gradingMetric)}
                    isSel={isSel}
                    activeMetric={activeMetric}
                    onSelect={() => setSelectedUpc(isSel ? null : item.productCode)}
                    onMenu={(e) => openCtxMenu(e, item.productCode)}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: item report ── */}
        <ItemReport
          selectedItem={selectedItem}
          selectedInsight={selectedInsight}
          selectedDetail={selectedDetail}
          reportRows={reportRows}
          thresholdAmt={thresholdAmt}
          gradingMetric={gradingMetric}
        />
      </div>
      {ctxMenu && (
        <UpcContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          upc={ctxMenu.upc}
          allUpcs={allUpcs}
          severityUpcs={severityUpcs}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  );
};

export default MarginPerfItemsTable;
