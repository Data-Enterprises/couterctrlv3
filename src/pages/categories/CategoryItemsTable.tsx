import { useEffect, useMemo, useRef, useState } from "react";
import { MagnifyingGlassIcon, MinusCircleIcon } from "@heroicons/react/16/solid";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { formatCurrency2 } from "../../utils";
import {
  setItemThreshold,
  ITEM_THRESHOLD_DEFAULT,
} from "../../features/categoriesSlice";
import {
  severityDotClass,
  chipClass,
  CTA_SEVERITY_CLASSES,
} from "../../utils/severity";
import {
  buildItemRows,
  buildItemDetail,
  buildInsight,
  getItemSeverity,
  getRowMetric,
  deltaTextClass,
  fmtDelta,
  dayTrend,
  SEV_RANK,
  SEV_PILL_CLASSES,
  WEEKDAY_ORDER,
  type ItemMarginRow,
  type ItemSeverity,
  type GradedSeverity,
  type RowMetricKey,
} from "../../utils/itemMargins";
import ThresholdFilter from "../../components/filters/ThresholdFilter";
import UpcContextMenu from "../../components/UpcContextMenu";
import SharedSeverityBadge from "../../components/SeverityBadge";
import type { CatItem } from "../../interfaces";
import { LW_OFFSET, LY_OFFSET, shiftIso } from "./categoriesUtils";

/**
 * Item-level report for the open category.
 *
 * The Sub Dept Margins item report, on category data — same maths (shared via
 * src/utils/itemMargins.ts), same two-column anatomy: a graded item list on the
 * left, one item's report on the right.
 *
 * Two things differ from Sub Dept Margins, both because the page differs:
 *  - the metric toggle here is Sales/Qty rather than Margin/Sales, so that is
 *    what items grade on and what leads the report card;
 *  - LY is offset by the page's own LY_OFFSET rather than getLYDate, so the
 *    day-matching agrees with the category totals in the same panel.
 */

type SevFilter = "all" | ItemSeverity;

/** "ungraded" has no shared SeverityBadge equivalent — small local adapter. */
const SeverityBadge = ({ severity }: { severity: ItemSeverity }) =>
  severity === "ungraded" ? (
    <div className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 bg-gray-100">
      <MinusCircleIcon className="w-3 h-3 text-gray-400" />
    </div>
  ) : (
    <SharedSeverityBadge severity={severity} />
  );

interface ColFilterProps {
  label: string;
  active: boolean;
  onApply: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}

const ColFilter = ({
  label,
  active,
  onApply,
  onClear,
  children,
}: ColFilterProps) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative flex items-center gap-1 min-w-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide transition-colors select-none flex-shrink-0 ${
          active ? "text-[#1e2a4a]" : "text-content"
        }`}
      >
        {label}
        {active && (
          <span className="w-1 h-1 rounded-full bg-[#1e2a4a] flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="fixed inset-0 z-[199]" onClick={() => setOpen(false)} />
      )}
      {open && (
        <div
          className="bg-custom-white"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 200,
            border: "1px solid rgba(30,42,74,0.12)",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            padding: "10px 10px 8px",
            minWidth: 168,
          }}
        >
          {children}
          <div className="flex gap-1.5 mt-2">
            <button
              onClick={() => {
                onApply();
                setOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-1 rounded py-1 text-[10px] font-medium text-custom-white"
              style={{ background: "#1e2a4a" }}
            >
              <MagnifyingGlassIcon className="w-3 h-3" /> Apply
            </button>
            {onClear && (
              <button
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
                className="px-2 rounded py-1 text-[10px] text-content border border-gray-200 hover:text-content transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const colInputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 11,
  border: "1px solid rgba(30,42,74,0.15)",
  borderRadius: 4,
  padding: "4px 7px",
  outline: "none",
  color: "var(--color-text-primary)",
  background: "rgba(30,42,74,0.03)",
};

const GradeCell = ({
  pct,
  threshold,
  isPts,
}: {
  pct: number | null;
  threshold: number;
  isPts: boolean;
}) => {
  if (pct === null)
    return <span className="text-[13px] font-semibold text-gray-400">—</span>;
  return (
    <span
      className={`text-[13px] font-semibold whitespace-nowrap ${deltaTextClass(pct, threshold)}`}
    >
      {`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}${isPts ? "pt" : "%"}`}
    </span>
  );
};

const byDate = (src: CatItem[], dateStr: string) =>
  src.filter((m) => m.sale_date.split("T")[0] === dateStr);

const REPORT_ROW_LABELS: Record<RowMetricKey, string> = {
  margin: "Margin",
  contribution: "Contribution",
  sales: "Sales",
  qty: "Qty",
  cogs: "COGS",
};

const CategoryItemsTable = () => {
  const dispatch = useAppDispatch();
  const { items, metric, selectedDay, loadingItems, itemThreshold } =
    useAppSelector((s) => s.categories);

  // The page's Sales/Qty toggle grades the item list too, same as it grades the
  // category rows in the left panel — one control, one meaning.
  const gradingMetric = metric === "qty" ? "qty" : "sales";

  const [colSort, setColSort] = useState<{
    col: "ty" | "lw" | "ly";
    dir: "desc" | "asc";
  } | null>(null);
  const [draftDesc, setDraftDesc] = useState("");
  const [appliedDesc, setAppliedDesc] = useState("");
  const [draftUpc, setDraftUpc] = useState("");
  const [appliedUpc, setAppliedUpc] = useState("");
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [selectedUpc, setSelectedUpc] = useState<string | null>(null);
  const [insightOpen, setInsightOpen] = useState(false);
  const [threshOpen, setThreshOpen] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    upc: string;
  } | null>(null);
  const threshRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threshOpen) return;
    const close = (e: MouseEvent) => {
      if (threshRef.current && !threshRef.current.contains(e.target as Node))
        setThreshOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [threshOpen]);

  // Clearing the input must not re-grade the list to zero — hold the last valid
  // amount, same rule the category threshold in the left panel follows.
  const lastValidRef = useRef<number>(itemThreshold ?? ITEM_THRESHOLD_DEFAULT);
  if (itemThreshold != null) lastValidRef.current = itemThreshold;
  const thresholdAmt = lastValidRef.current;

  /** When a day is selected in the panel, scope all three periods to that day —
   *  TY to the day itself, LW/LY to the same day shifted by the page's own
   *  offsets, so the items agree with the KPI strip above them. */
  const scoped = useMemo(() => {
    if (!selectedDay) return items;
    return {
      tw: byDate(items.tw, selectedDay),
      lw: byDate(items.lw, shiftIso(selectedDay, LW_OFFSET)),
      ly: byDate(items.ly, shiftIso(selectedDay, LY_OFFSET)),
    };
  }, [items, selectedDay]);

  const rawRows = useMemo(
    () => buildItemRows(scoped.tw, scoped.lw, scoped.ly),
    [scoped],
  );

  const sevCounts = useMemo(() => {
    const counts: Record<ItemSeverity, number> = {
      critical: 0,
      watch: 0,
      healthy: 0,
      ungraded: 0,
    };
    for (const row of rawRows)
      counts[getItemSeverity(row, thresholdAmt, gradingMetric)]++;
    return counts;
  }, [rawRows, thresholdAmt, gradingMetric]);

  // Independent of the active chip and search filters, so the context menu's
  // "copy critical/watch/healthy" always means the same thing.
  const severityUpcs = useMemo(() => {
    const buckets = {
      critical: [] as string[],
      watch: [] as string[],
      healthy: [] as string[],
    };
    for (const row of rawRows) {
      const sev = getItemSeverity(row, thresholdAmt, gradingMetric);
      if (sev !== "ungraded") buckets[sev].push(row.productCode);
    }
    return buckets;
  }, [rawRows, thresholdAmt, gradingMetric]);

  const allUpcs = useMemo(() => rawRows.map((r) => r.productCode), [rawRows]);

  const activeMetric: RowMetricKey = gradingMetric === "qty" ? "qty" : "sales";

  /** The trend the page grades on. 999 parks an ungraded item at the bottom of
   *  a worst-first sort rather than the top, which is where a null would land. */
  const gradedTrend = (r: ItemMarginRow) =>
    (gradingMetric === "qty" ? r.qtyTrendPct : r.salesTrendPct) ?? 999;

  const getColSortValue = (item: ItemMarginRow, col: "ty" | "lw" | "ly") => {
    if (activeMetric === "qty") {
      return col === "ty" ? item.qty : col === "lw" ? (item.lwQty ?? -999) : (item.lyQty ?? -999);
    }
    return col === "ty"
      ? item.grossSales
      : col === "lw"
        ? (item.lwGrossSales ?? -999)
        : (item.lyGrossSales ?? -999);
  };

  const displayData = useMemo(() => {
    let data = [...rawRows];
    if (appliedDesc)
      data = data.filter((d) =>
        d.description.toLowerCase().includes(appliedDesc.toLowerCase()),
      );
    if (appliedUpc) data = data.filter((d) => d.productCode.includes(appliedUpc));
    if (sevFilter !== "all")
      data = data.filter(
        (d) => getItemSeverity(d, thresholdAmt, gradingMetric) === sevFilter,
      );

    data.sort((a, b) => {
      if (colSort) {
        const av = getColSortValue(a, colSort.col);
        const bv = getColSortValue(b, colSort.col);
        return colSort.dir === "asc" ? av - bv : bv - av;
      }
      if (sevFilter === "all") {
        const ra = SEV_RANK[getItemSeverity(a, thresholdAmt, gradingMetric)];
        const rb = SEV_RANK[getItemSeverity(b, thresholdAmt, gradingMetric)];
        if (ra !== rb) return ra - rb;
      }
      // Worst first within each severity band, on whichever trend the page is
      // grading — the same ordering every other list here uses. Items with no
      // baseline sort last: unknown isn't the same as bad.
      return gradedTrend(a) - gradedTrend(b);
    });

    return data;
  }, [
    rawRows,
    colSort,
    activeMetric,
    appliedDesc,
    appliedUpc,
    sevFilter,
    thresholdAmt,
    gradingMetric,
  ]);

  const selectedItem = selectedUpc
    ? (rawRows.find((r) => r.productCode === selectedUpc) ?? null)
    : null;

  // Always the full week, never the selected day — a day-of-week breakdown with
  // one day in it isn't a breakdown.
  const selectedDetail = useMemo(
    () =>
      selectedUpc
        ? buildItemDetail(selectedUpc, items.tw, items.lw, items.ly)
        : null,
    [selectedUpc, items],
  );

  const selectedInsight = useMemo(
    () =>
      selectedItem && selectedDetail
        ? buildInsight(selectedItem, selectedDetail, thresholdAmt, gradingMetric)
        : null,
    [selectedItem, selectedDetail, thresholdAmt, gradingMetric],
  );

  /** Graded metric leads — it's the figure the item's severity comes from — and
   *  the rest support it in a fixed order. */
  const reportRows = !selectedItem
    ? []
    : (
        gradingMetric === "qty"
          ? (["qty", "contribution", "sales", "margin"] as const)
          : (["sales", "contribution", "margin", "qty"] as const)
      ).map((key) => {
        const m = getRowMetric(selectedItem, key);
        return {
          key,
          label: REPORT_ROW_LABELS[key],
          ty: m.tyDisplay,
          lw: m.lwColorPct,
          ly: m.lyColorPct,
          lwDisplay: m.lwDisplay,
          lyDisplay: m.lyDisplay,
          isPts: key === "margin" || key === "contribution",
        };
      });

  const handleColSortClick = (col: "ty" | "lw" | "ly") =>
    setColSort((prev) => {
      if (prev?.col !== col) return { col, dir: "desc" };
      if (prev.dir === "desc") return { col, dir: "asc" };
      return null;
    });

  const openCtxMenu = (e: React.MouseEvent, upc: string) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, upc });
  };

  const sevChip = (sev: GradedSeverity, label: string) => (
    <button
      onClick={() => setSevFilter((f) => (f === sev ? "all" : sev))}
      className={`text-[10px] font-semibold px-2 py-1 rounded-full transition-shadow ${SEV_PILL_CLASSES[sev]} ${
        sevFilter === sev
          ? sev === "critical"
            ? "ring-2 ring-severity_critical_text/40 shadow-sm"
            : sev === "watch"
              ? "ring-2 ring-severity_watch_text/40 shadow-sm"
              : "ring-2 ring-severity_healthy_text/40 shadow-sm"
          : ""
      }`}
    >
      {label} ({sevCounts[sev]})
    </button>
  );

  if (loadingItems) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center gap-2">
        <div className="w-3.5 h-3.5 border-2 border-gray-200 border-t-[#1e2a4a] rounded-full animate-spin" />
        <span className="text-[11px] text-content">Loading items…</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 min-h-0 flex" onContextMenu={(e) => openCtxMenu(e, "")}>
        {/* ── Left: item list ── */}
        <div
          className="flex flex-col border-r border-gray-100 min-w-0"
          style={{ width: "47%", flexShrink: 0 }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex-shrink-0">
            {sevChip("critical", "Crit")}
            {sevChip("watch", "Watch")}
            {sevChip("healthy", "OK")}

            <div className="relative flex-shrink-0" ref={threshRef}>
              <button
                onClick={() => setThreshOpen((v) => !v)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(threshOpen)}`}
              >
                Thresh
              </button>
              {threshOpen && (
                <div className="absolute top-full left-0 mt-1 p-1.5 rounded-md border border-gray-200 bg-custom-white shadow-lg z-20">
                  <ThresholdFilter
                    value={
                      itemThreshold === null
                        ? null
                        : { op: "gt", amount: itemThreshold }
                    }
                    onChange={(v) => dispatch(setItemThreshold(v?.amount ?? null))}
                    showOp={false}
                    showClear={false}
                    suffix="%"
                    inputWidth={46}
                  />
                </div>
              )}
            </div>

          </div>

          {/* Right padding is 4px wider than the rows' — matches the reserved
              scrollbar gutter below so columns line up whether or not the list
              is scrollable. */}
          <div className="flex items-center gap-2.5 pl-3 pr-4 py-1.5 border-b border-gray-100 flex-shrink-0">
            <span className="w-2.5 flex-shrink-0" />
            <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-1 flex items-center gap-2 min-w-0">
              Item
              <ColFilter
                label="UPC"
                active={!!appliedUpc}
                onApply={() => setAppliedUpc(draftUpc)}
                onClear={() => {
                  setAppliedUpc("");
                  setDraftUpc("");
                }}
              >
                <input
                  autoFocus
                  style={colInputStyle}
                  placeholder="Search UPC…"
                  value={draftUpc}
                  onChange={(e) => setDraftUpc(e.target.value)}
                />
              </ColFilter>
              <ColFilter
                label="Desc"
                active={!!appliedDesc}
                onApply={() => setAppliedDesc(draftDesc)}
                onClear={() => {
                  setAppliedDesc("");
                  setDraftDesc("");
                }}
              >
                <input
                  autoFocus
                  style={colInputStyle}
                  placeholder="Search description…"
                  value={draftDesc}
                  onChange={(e) => setDraftDesc(e.target.value)}
                />
              </ColFilter>
            </span>
            <div className="flex items-center gap-[10px]">
              {(["ty", "lw", "ly"] as const).map((col) => (
                <button
                  key={col}
                  onClick={() => handleColSortClick(col)}
                  className="flex items-center justify-center gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0"
                  style={{ width: col === "ty" ? 76 : 68 }}
                >
                  {col.toUpperCase()}
                  {colSort?.col === col &&
                    (colSort.dir === "desc" ? (
                      <ChevronDownIcon className="w-3 h-3" />
                    ) : (
                      <ChevronUpIcon className="w-3 h-3" />
                    ))}
                </button>
              ))}
            </div>
          </div>

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
                const sev = getItemSeverity(item, thresholdAmt, gradingMetric);
                const isSel = selectedUpc === item.productCode;
                const m = getRowMetric(item, activeMetric);
                return (
                  <button
                    key={item.productCode}
                    onClick={() => setSelectedUpc(isSel ? null : item.productCode)}
                    onContextMenu={(e) => {
                      e.stopPropagation();
                      openCtxMenu(e, item.productCode);
                    }}
                    className={`w-full flex items-center gap-2.5 p-3 text-left transition-colors border-l-2 border-b border-b-[#1e2a4a]/15 ${
                      isSel
                        ? "bg-row_selected border-row_selected_border"
                        : "border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <SeverityBadge severity={sev} />
                    <div className="flex flex-col justify-center min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-content truncate">
                        {item.description}
                      </div>
                      <div className="text-[10px] text-content tabular-nums truncate">
                        {item.productCode}
                      </div>
                    </div>
                    <div className="flex items-center gap-[10px]">
                      <span
                        className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${SEV_PILL_CLASSES[sev]}`}
                        style={{ width: 76 }}
                      >
                        {m.tyDisplay}
                      </span>
                      <span
                        className="text-[12px] font-semibold text-content text-center flex-shrink-0 whitespace-nowrap"
                        style={{ width: 68 }}
                      >
                        {m.lwDisplay ?? "—"}
                      </span>
                      <span
                        className="text-[12px] font-semibold text-content text-center flex-shrink-0 whitespace-nowrap"
                        style={{ width: 68 }}
                      >
                        {m.lyDisplay ?? "—"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: item report ── */}
        <div
          className="flex-1 min-w-0 overflow-y-auto thin-scrollbar"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {!selectedItem ? (
            <div className="flex items-center justify-center h-full text-[12px] text-content">
              Select an item to see its report
            </div>
          ) : (
            <>
              {/* Item name doubles as the insight toggle, same as the sub dept
                  CTA strip in dev Sales. */}
              {selectedInsight ? (
                <div
                  className={`relative border-b ${CTA_SEVERITY_CLASSES[selectedInsight.sev].border}`}
                >
                  <button
                    onClick={() => setInsightOpen((v) => !v)}
                    className={`w-full flex items-center gap-1.5 px-4 py-2 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].bg} ${CTA_SEVERITY_CLASSES[selectedInsight.sev].hoverBg} transition-colors`}
                  >
                    {selectedInsight.sev === "critical" && (
                      <ExclamationTriangleIcon
                        className={`w-3.5 h-3.5 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text} flex-shrink-0`}
                      />
                    )}
                    {selectedInsight.sev === "watch" && (
                      <ExclamationCircleIcon
                        className={`w-3.5 h-3.5 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text} flex-shrink-0`}
                      />
                    )}
                    {selectedInsight.sev === "healthy" && (
                      <CheckCircleIcon
                        className={`w-3.5 h-3.5 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text} flex-shrink-0`}
                      />
                    )}
                    <span
                      className={`text-[13px] font-semibold truncate ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text}`}
                    >
                      {selectedItem.description}
                      <span className="ml-2 font-normal text-[11px] tabular-nums">
                        {selectedItem.productCode}
                      </span>
                    </span>
                    <span className="flex-1" />
                    {insightOpen ? (
                      <ChevronUpIcon
                        className={`w-3 h-3 flex-shrink-0 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text}`}
                      />
                    ) : (
                      <ChevronDownIcon
                        className={`w-3 h-3 flex-shrink-0 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text}`}
                      />
                    )}
                  </button>
                  {insightOpen && (
                    <div
                      className={`absolute top-full left-0 right-0 z-20 px-4 py-2.5 border-b shadow-lg ${CTA_SEVERITY_CLASSES[selectedInsight.sev].bg} ${CTA_SEVERITY_CLASSES[selectedInsight.sev].border}`}
                    >
                      <div
                        className={`text-[12.5px] font-medium mb-1 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text}`}
                      >
                        {selectedInsight.headline}
                      </div>
                      <div
                        className={`text-[11px] leading-relaxed ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text}`}
                      >
                        {selectedInsight.detail}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50">
                  <span className="text-[14px] font-medium text-content truncate">
                    {selectedItem.description}
                  </span>
                  <span className="text-[11px] text-content tabular-nums flex-shrink-0">
                    {selectedItem.productCode}
                  </span>
                </div>
              )}

              {/* 40/60 rather than an even split — the supporting table has four
                  columns to fit, the lead card needs room for one number. */}
              <div className="px-4 py-2.5 border-b border-gray-100">
                <div className="grid grid-cols-[40%_1fr] gap-2">
                  {reportRows.length > 0 && (
                    <div className="rounded-md border border-[#1e2a4a]/15 shadow-sm bg-gray-50 p-2.5 text-center flex flex-col justify-center">
                      <div className="text-[11px] font-semibold text-content">
                        {reportRows[0].label}
                      </div>
                      <div className="text-[18px] font-semibold text-content leading-tight">
                        {reportRows[0].ty}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 mt-1.5 pt-1.5 border-t border-gray-200">
                        {(["lw", "ly"] as const).map((side) => (
                          <div key={side}>
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-content">
                              vs {side === "lw" ? "LW" : "LY"}
                            </div>
                            <div className="text-[12px] font-semibold text-content">
                              {(side === "lw"
                                ? reportRows[0].lwDisplay
                                : reportRows[0].lyDisplay) ?? "—"}
                            </div>
                            <div className="flex justify-center mt-0.5">
                              <GradeCell
                                pct={
                                  side === "lw" ? reportRows[0].lw : reportRows[0].ly
                                }
                                threshold={thresholdAmt}
                                isPts={reportRows[0].isPts}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Supporting metrics share one set of column headers so they
                      stay comparable to each other; prior values live in the
                      title attribute. */}
                  <div className="rounded-md border border-[#1e2a4a]/15 shadow-sm bg-gray-50 px-2.5 py-1 flex flex-col justify-center">
                    <div className="grid grid-cols-[1fr_56px_55px_55px] gap-1.5 pb-0.5 text-[11px] font-semibold uppercase tracking-wide text-content">
                      <span />
                      <span className="text-right">TY</span>
                      <span className="text-right">LW</span>
                      <span className="text-right">LY</span>
                    </div>
                    {reportRows.slice(1).map((row) => (
                      <div
                        key={row.key}
                        className="grid grid-cols-[1fr_56px_55px_55px] gap-1.5 items-center py-1 border-t border-gray-200 text-[11.5px]"
                      >
                        <span className="font-semibold text-content truncate">
                          {row.label}
                        </span>
                        <span className="text-[12px] font-semibold text-content text-right">
                          {row.ty}
                        </span>
                        <span
                          title={`Last week: ${row.lwDisplay ?? "no data"}`}
                          className={`text-[12px] text-right font-semibold ${
                            row.lw !== null
                              ? deltaTextClass(row.lw, thresholdAmt)
                              : "text-content"
                          }`}
                        >
                          {row.lw !== null ? fmtDelta(row.lw, row.isPts) : "—"}
                        </span>
                        <span
                          title={`Last year: ${row.lyDisplay ?? "no data"}`}
                          className={`text-[12px] text-right font-semibold ${
                            row.ly !== null
                              ? deltaTextClass(row.ly, thresholdAmt)
                              : "text-content"
                          }`}
                        >
                          {row.ly !== null ? fmtDelta(row.ly, row.isPts) : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border-t border-[#1e2a4a]/15 shadow-sm mx-4" />

              {selectedDetail && (
                <div className="px-4 py-2.5">
                  {/* Day trend, ranked worst-first — the ordering is the answer,
                      which is why there's no "best day / worst day" caption. */}
                  <div className="grid grid-cols-[10px_34px_1fr_58px_68px_68px] gap-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-content">
                    <span />
                    <span>Day</span>
                    <span />
                    <span className="text-right">TY</span>
                    <span className="text-right">vs LW</span>
                    <span className="text-right">vs LY</span>
                  </div>
                  {(() => {
                    const pctOf = (ty: number, ref: number | null) =>
                      ref !== null && ref > 0 ? ((ty - ref) / ref) * 100 : null;

                    const sold = WEEKDAY_ORDER.filter(
                      (wd) => selectedDetail.dayOfWeek[wd].ty !== null,
                    ).map((wd) => {
                      const v = selectedDetail.dayOfWeek[wd];
                      return {
                        wd,
                        ty: v.ty as number,
                        lw: pctOf(v.ty as number, v.lw),
                        ly: pctOf(v.ty as number, v.ly),
                        rank: dayTrend(v),
                      };
                    });
                    const quiet = WEEKDAY_ORDER.filter(
                      (wd) => selectedDetail.dayOfWeek[wd].ty === null,
                    );

                    // Worst first; days with no baseline sort last — unknown
                    // isn't the same as bad.
                    const ranked = [...sold].sort((a, b) => {
                      if (a.rank === null && b.rank === null) return b.ty - a.ty;
                      if (a.rank === null) return 1;
                      if (b.rank === null) return -1;
                      return a.rank - b.rank;
                    });
                    const maxTy = Math.max(...sold.map((d) => d.ty), 0);

                    return (
                      <>
                        {ranked.map((d) => {
                          const sev: GradedSeverity | null =
                            d.rank === null
                              ? null
                              : d.rank < -thresholdAmt
                                ? "critical"
                                : d.rank < 0
                                  ? "watch"
                                  : "healthy";
                          return (
                            <div
                              key={d.wd}
                              className="grid grid-cols-[10px_34px_1fr_58px_68px_68px] gap-2 items-center py-1 border-t border-gray-100"
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  sev === null ? "bg-gray-300" : severityDotClass[sev]
                                }`}
                              />
                              <span className="text-[12px] font-semibold text-content">
                                {d.wd}
                              </span>
                              {/* Neutral track so every row shares a visible
                                  100% reference; the fill stays neutral too —
                                  length carries dollars, the dot carries the
                                  grade. */}
                              <span className="h-[12px] w-full rounded-full bg-[#1e2a4a]/15 block overflow-hidden">
                                <span
                                  className="h-full rounded-full bg-[#1e2a4a]/85 block"
                                  style={{
                                    width: `${maxTy > 0 ? (d.ty / maxTy) * 100 : 0}%`,
                                  }}
                                />
                              </span>
                              <span className="text-[12px] font-semibold text-content text-right">
                                {formatCurrency2(d.ty)}
                              </span>
                              <span className="flex justify-end">
                                <GradeCell
                                  pct={d.lw}
                                  threshold={thresholdAmt}
                                  isPts={false}
                                />
                              </span>
                              <span className="flex justify-end">
                                <GradeCell
                                  pct={d.ly}
                                  threshold={thresholdAmt}
                                  isPts={false}
                                />
                              </span>
                            </div>
                          );
                        })}
                        {quiet.length > 0 && (
                          <div className="py-1.5 border-t border-gray-100 text-[12px] font-medium text-content">
                            {quiet.join(", ")} — no sales
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </div>
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

export default CategoryItemsTable;
