import { useEffect, useState, useRef, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  MinusCircleIcon,
} from "@heroicons/react/16/solid";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useSubMarginCtx } from "../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { getLYDate } from "../..";
import { severityDotClass } from "../../../../utils/severity";
import { formatCurrency2, addDays } from "../../../../utils";
import {
  buildItemRows,
  buildItemDetail,
  buildInsight,
  getItemSeverity,
  getRowMetric,
  deltaTextClass,
  fmtDelta,
  dayTrend,
  sortValue,
  presetKey,
  VIEW_PRESETS,
  VIEW_OPTIONS,
  SEV_RANK,
  SEV_PILL_CLASSES,
  WEEKDAY_ORDER,
  type ItemMarginRow,
  type ItemSeverity as Severity,
  type RowMetricKey,
  type SortCol,
  type GradedSeverity,
} from "../../../../utils/itemMargins";
import type { SubDeptMargin } from "../../../../interfaces";
import ThresholdFilter from "../../../../components/filters/ThresholdFilter";
import type { ThresholdValue } from "../../../../components/filters/ThresholdFilter";
import SelectFilter from "../../../../components/filters/SelectFilter";
import UpcContextMenu from "../../../../components/UpcContextMenu";
import SharedSeverityBadge from "../../../../components/SeverityBadge";
import { chipClass, CTA_SEVERITY_CLASSES } from "../../../../utils/severity";

type SevFilter = "all" | Severity;

// "ungraded" has no shared SeverityBadge equivalent — small local adapter.
const SeverityBadge = ({ severity }: { severity: Severity }) =>
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
  align?: "left" | "right";
  onApply: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}

const ColFilter = ({
  label,
  active,
  align = "left",
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
            ...(align === "right" ? { right: 0 } : { left: 0 }),
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

interface Props {
  tyMargins: SubDeptMargin[];
  lwMargins: SubDeptMargin[];
  lyMargins: SubDeptMargin[];
}

const byDate = (src: SubDeptMargin[], dateStr: string) =>
  src.filter((m) => m.sale_date.split("T")[0] === dateStr);

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
      {isPts
        ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}pt`
        : `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`}
    </span>
  );
};

const MarginPerfItemsTable = ({ tyMargins, lwMargins, lyMargins }: Props) => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const ctx = useSubMarginCtx();
  // Same Margin/Sales toggle the left panel grades sub depts against —
  // read directly from the dev slice, matching how MarginPerfLeftPanel and
  // MarginPerfRightPanel already read it (this tab is dev-only).
  const gradingMetric = useAppSelector((s) => s.subMargin.gradingMetric);

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
  const [colSort, setColSort] = useState<{
    col: "ty" | "lw" | "ly";
    dir: "desc" | "asc";
  } | null>(null);
  const handleColSortClick = (col: "ty" | "lw" | "ly") => {
    setColSort((prev) => {
      if (prev?.col !== col) return { col, dir: "desc" };
      if (prev.dir === "desc") return { col, dir: "asc" };
      return null;
    });
  };
  const getColSortValue = (item: ItemMarginRow, col: "ty" | "lw" | "ly") => {
    if (activeMetric === "margin") {
      return col === "ty"
        ? item.tyMarginPct
        : col === "lw"
          ? (item.lwMarginPct ?? -999)
          : (item.lyMarginPct ?? -999);
    }
    return col === "ty"
      ? item.grossSales
      : col === "lw"
        ? (item.lwGrossSales ?? -999)
        : (item.lyGrossSales ?? -999);
  };
  const [draftDesc, setDraftDesc] = useState("");
  const [appliedDesc, setAppliedDesc] = useState("");
  const [draftUpc, setDraftUpc] = useState("");
  const [appliedUpc, setAppliedUpc] = useState("");

  const [thresholdValue, setThresholdValue] = useState<ThresholdValue | null>({
    op: "gt",
    amount: 9,
  });
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [insightOpen, setInsightOpen] = useState(false);
  const [threshOpen, setThreshOpen] = useState(false);
  const threshBtnRef = useRef<HTMLButtonElement>(null);
  const threshPopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threshOpen) return;
    const close = (e: MouseEvent) => {
      if (
        threshBtnRef.current &&
        !threshBtnRef.current.contains(e.target as Node) &&
        threshPopRef.current &&
        !threshPopRef.current.contains(e.target as Node)
      )
        setThreshOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [threshOpen]);

  // When a single day is selected in the day sidebar, scope all three
  // periods down to that day — TY to the day itself, LW/LY to that same
  // day's mapped date (holiday- and leap-year-aware for LY via getLYDate).
  const dayFilteredMargins = useMemo(() => {
    if (!ctx.selectedWeekDay)
      return { ty: tyMargins, lw: lwMargins, ly: lyMargins };
    const tyDate = ctx.selectedWeekDay;
    const lwDate = addDays(tyDate, -7).toISOString().split("T")[0];
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
      ),
    [dayFilteredMargins],
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
        ? buildInsight(
            selectedItem,
            selectedDetail,
            thresholdAmt,
            gradingMetric,
          )
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
        const av = getColSortValue(a, colSort.col);
        const bv = getColSortValue(b, colSort.col);
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

  // Item report row order — the graded metric (Margin or Sales, matching
  // gradingMetric) leads, since that's the figure the item's severity comes
  // from; Contribution/the other metric/Qty follow in a fixed order. Reuses
  // getRowMetric so the raw LW/LY figures shown here (not just the delta
  // pill) stay identical to what the left list would show for that metric.
  const REPORT_ROW_LABELS: Record<
    "margin" | "contribution" | "sales" | "qty",
    string
  > = {
    margin: "Margin",
    contribution: "Contribution",
    sales: "Sales",
    qty: "Qty",
  };
  const reportRows = !selectedItem
    ? []
    : (gradingMetric === "margin"
        ? (["margin", "contribution", "sales", "qty"] as const)
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
          {/* Severity chips + threshold + view */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex-shrink-0">
            <button
              onClick={() =>
                setSevFilter((f) => (f === "critical" ? "all" : "critical"))
              }
              className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_critical_bg text-severity_critical_text transition-shadow ${
                sevFilter === "critical"
                  ? "ring-2 ring-severity_critical_text/40 shadow-sm"
                  : ""
              }`}
            >
              Crit ({sevCounts.critical})
            </button>
            <button
              onClick={() =>
                setSevFilter((f) => (f === "watch" ? "all" : "watch"))
              }
              className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_watch_bg text-severity_watch_text transition-shadow ${
                sevFilter === "watch"
                  ? "ring-2 ring-severity_watch_text/40 shadow-sm"
                  : ""
              }`}
            >
              Watch ({sevCounts.watch})
            </button>
            <button
              onClick={() =>
                setSevFilter((f) => (f === "healthy" ? "all" : "healthy"))
              }
              className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_healthy_bg text-severity_healthy_text transition-shadow ${
                sevFilter === "healthy"
                  ? "ring-2 ring-severity_healthy_text/40 shadow-sm"
                  : ""
              }`}
            >
              OK ({sevCounts.healthy})
            </button>

            <div className="relative flex-shrink-0">
              <button
                ref={threshBtnRef}
                onClick={() => setThreshOpen((v) => !v)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(threshOpen)}`}
              >
                Thresh
              </button>
              {threshOpen && (
                <div
                  ref={threshPopRef}
                  className="absolute top-full left-0 mt-1 p-1.5 rounded-md border border-gray-200 bg-custom-white shadow-lg z-20"
                >
                  <ThresholdFilter
                    value={thresholdValue}
                    onChange={setThresholdValue}
                    showOp={false}
                    showClear={false}
                    suffix={gradingMetric === "sales" ? "%" : "pts"}
                    inputWidth={46}
                  />
                </div>
              )}
            </div>

            <SelectFilter
              options={VIEW_OPTIONS}
              value={presetKey(sortCol, sortDir)}
              onChange={(v) => {
                const preset = VIEW_PRESETS.find(
                  (p) => presetKey(p.col, p.dir) === v,
                );
                if (preset) {
                  setSortCol(preset.col);
                  setSortDir(preset.dir);
                  setColSort(null);
                }
              }}
              placeholder="View"
              className="w-32"
            />
          </div>

          {/* List header — Item / active metric / vs LW / vs LY, same anatomy
            as the sub dept rows in dev Sales. Right padding is 4px wider
            than the rows' — matches the reserved scrollbar-gutter below so
            columns still line up whether or not the list is scrollable. */}
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
              <button
                onClick={() => handleColSortClick("ty")}
                className="flex items-center justify-center gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0"
                style={{ width: 76 }}
              >
                TY
                {colSort?.col === "ty" &&
                  (colSort.dir === "desc" ? (
                    <ChevronDownIcon className="w-3 h-3" />
                  ) : (
                    <ChevronUpIcon className="w-3 h-3" />
                  ))}
              </button>
              <button
                onClick={() => handleColSortClick("lw")}
                className="flex items-center justify-center gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0"
                style={{ width: 68 }}
              >
                LW
                {colSort?.col === "lw" &&
                  (colSort.dir === "desc" ? (
                    <ChevronDownIcon className="w-3 h-3" />
                  ) : (
                    <ChevronUpIcon className="w-3 h-3" />
                  ))}
              </button>
              <button
                onClick={() => handleColSortClick("ly")}
                className="flex items-center justify-center gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0"
                style={{ width: 68 }}
              >
                LY
                {colSort?.col === "ly" &&
                  (colSort.dir === "desc" ? (
                    <ChevronDownIcon className="w-3 h-3" />
                  ) : (
                    <ChevronUpIcon className="w-3 h-3" />
                  ))}
              </button>
            </div>
          </div>

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
                const sev = getItemSeverity(item, thresholdAmt, gradingMetric);
                const isSel = selectedUpc === item.productCode;
                const metric = getRowMetric(item, activeMetric);
                return (
                  <button
                    key={item.productCode}
                    onClick={() =>
                      setSelectedUpc(isSel ? null : item.productCode)
                    }
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
                      <div className="text-[14px] font-medium text-content truncate">
                        {item.description}
                      </div>
                      <div className="text-[11px] text-content tabular-nums truncate">
                        {item.productCode}
                      </div>
                    </div>
                    <div className="flex items-center gap-[10px]">
                      <span
                        className={`text-[14px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${SEV_PILL_CLASSES[sev]}`}
                        style={{ width: 76 }}
                      >
                        {metric.tyDisplay}
                      </span>
                      <span
                        className="text-[13px] font-semibold text-content text-center flex-shrink-0 whitespace-nowrap"
                        style={{ width: 68 }}
                      >
                        {metric.lwDisplay ?? "—"}
                      </span>
                      <span
                        className="text-[13px] font-semibold text-content text-center flex-shrink-0 whitespace-nowrap"
                        style={{ width: 68 }}
                      >
                        {metric.lyDisplay ?? "—"}
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
              {/* Header row: item name — doubles as the CTA insight toggle,
                same styling/behavior as the sub dept CTA strip in dev Sales.
                Severity reflects selectedInsight, which follows the day
                selection below; name/UPC always identify the full item. */}
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

              {/* Metric cards. reportRows is already ordered by the active
                  grading metric, so [0] is whatever the page is grading on —
                  it takes the tinted lead card and the rest support it. A flat
                  2x2 gave qty the same weight as margin, which is wrong on a
                  page about margin. */}
              <div className="px-4 py-2.5 border-b border-gray-100">
                {/* 40/60 rather than an even split — the supporting table has
                    four columns to fit and the lead card only needs room for
                    one number. */}
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
                                  side === "lw"
                                    ? reportRows[0].lw
                                    : reportRows[0].ly
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

                  {/* Supporting metrics share one set of column headers.
                      Three separate tiles repeated "LW"/"LY" six times and
                      broke the vertical delta scan the original table had —
                      the lead metric earns a self-contained card, these earn
                      being comparable to each other. Prior values live in the
                      title attribute; the lead card still shows them inline. */}
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
                  {/* Day trend, ranked worst-first — the same ordering every
                      other list on this page uses. Ranking is why there's no
                      "best day / worst day" caption underneath any more: the
                      order is the answer. Both baselines are shown rather than
                      one silently-chosen delta. */}
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

                    // Worst first; days with no baseline at all sort last —
                    // unknown isn't the same as bad.
                    const ranked = [...sold].sort((a, b) => {
                      if (a.rank === null && b.rank === null)
                        return b.ty - a.ty;
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
                                  sev === null
                                    ? "bg-gray-300"
                                    : severityDotClass[sev]
                                }`}
                              />
                              <span className="text-[12px] font-semibold text-content">
                                {d.wd}
                              </span>
                              {/* Neutral track so every row shares a visible
                                  100% reference — without it the bars float in
                                  an unbounded column and you have to hunt for
                                  the longest one to read the scale. The fill
                                  stays neutral too: length carries dollars, and
                                  the dot is the only thing asserting a grade. */}
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

export default MarginPerfItemsTable;
