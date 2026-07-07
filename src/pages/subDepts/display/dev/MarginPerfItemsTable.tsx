import { useEffect, useState, useRef, useMemo } from "react";
import { MagnifyingGlassIcon, ExclamationTriangleIcon, ExclamationCircleIcon, CheckCircleIcon, MinusCircleIcon } from "@heroicons/react/16/solid";
import { useAppDispatch } from "../../../../hooks";
import { useSubMarginCtx } from "../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { calculateCogs, getLYDate } from "../..";
import { formatCurrency2, addDays } from "../../../../utils";
import { setMenuPosition, setSMClipboardText } from "../../../../features/ctxMenuSlice";
import type { SubDeptMargin } from "../../../../interfaces";
import ThresholdFilter from "../../../../components/filters/ThresholdFilter";
import type { ThresholdValue } from "../../../../components/filters/ThresholdFilter";

type Severity = "critical" | "watch" | "healthy" | "ungraded";
type SevFilter = "all" | Severity;

interface ItemMarginRow {
  productCode: string;
  description: string;
  grossSales: number;
  netSales: number;
  tax: number;
  qty: number;
  cogs: number;
  costFees: number;
  tyMarginPct: number;
  lwMarginPct: number | null;
  lyMarginPct: number | null;
}

type SortCol = "description" | "upc" | "grossSales" | "qty" | "cogs" | "costFees" | "tyMargin" | "lwMargin" | "lyMargin";

const COLS = "minmax(0,1.548fr) 0.5fr 0.35fr 0.418fr 0.494fr 0.494fr 0.5fr 0.42fr";

const BADGE_BG: Record<Severity, string> = {
  critical: "#fee2e2",
  watch: "#fef3c7",
  healthy: "#d1fae5",
  ungraded: "#f3f4f6",
};
const BADGE_COLOR: Record<Severity, string> = {
  critical: "#ef4444",
  watch: "#f59e0b",
  healthy: "#10b981",
  ungraded: "#9ca3af",
};

const SeverityBadge = ({ severity }: { severity: Severity }) => (
  <div
    className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0"
    style={{ background: BADGE_BG[severity] }}
  >
    {severity === "critical" && <ExclamationTriangleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[severity] }} />}
    {severity === "watch" && <ExclamationCircleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[severity] }} />}
    {severity === "healthy" && <CheckCircleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[severity] }} />}
    {severity === "ungraded" && <MinusCircleIcon className="w-3 h-3" style={{ color: BADGE_COLOR[severity] }} />}
  </div>
);

const chipClass = (active: boolean, sev: Severity) => {
  const base = "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border";
  if (active) {
    const fill = sev === "critical" ? "bg-red-600 border-red-600 text-white" : sev === "watch" ? "bg-amber-500 border-amber-500 text-white" : "bg-emerald-600 border-emerald-600 text-white";
    return `${base} ${fill}`;
  }
  return `${base} bg-transparent border-gray-200 text-content/40 hover:text-content/60`;
};

const getItemSeverity = (row: ItemMarginRow, threshold: number): Severity => {
  const raw = row.lyMarginPct !== null
    ? row.tyMarginPct - row.lyMarginPct
    : row.lwMarginPct !== null
    ? row.tyMarginPct - row.lwMarginPct
    : null;
  if (raw === null) return "ungraded";
  const delta = Math.round(raw * 10) / 10;
  if (delta < -threshold) return "critical";
  if (delta < 0) return "watch";
  return "healthy";
};

interface ColFilterProps {
  label: string;
  active: boolean;
  align?: "left" | "right";
  onApply: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}

const ColFilter = ({ label, active, align = "left", onApply, onClear, children }: ColFilterProps) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative flex items-center gap-1 min-w-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide transition-colors select-none flex-shrink-0 ${
          active ? "text-[#1e2a4a]" : "text-content/35 hover:text-content/60"
        }`}
      >
        {label}
        {active && <span className="w-1 h-1 rounded-full bg-[#1e2a4a] flex-shrink-0" />}
      </button>
      {open && <div className="fixed inset-0 z-[199]" onClick={() => setOpen(false)} />}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            ...(align === "right" ? { right: 0 } : { left: 0 }),
            zIndex: 200,
            background: "white",
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
              onClick={() => { onApply(); setOpen(false); }}
              className="flex-1 flex items-center justify-center gap-1 rounded py-1 text-[10px] font-medium"
              style={{ background: "#1e2a4a", color: "white" }}
            >
              <MagnifyingGlassIcon className="w-3 h-3" /> Apply
            </button>
            {onClear && (
              <button
                onClick={() => { onClear(); setOpen(false); }}
                className="px-2 rounded py-1 text-[10px] text-content/40 border border-gray-200 hover:text-content/60 transition-colors"
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

const aggregateByUpc = (margins: SubDeptMargin[]) => {
  const map = new Map<string, { grossSales: number; tax: number; qty: number; cogs: number; costFees: number; desc: string; caseSize: number; netCost: number; cost: number }>();
  for (const m of margins) {
    const cogs = calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight);
    const ex = map.get(m.product_code);
    if (!ex) {
      map.set(m.product_code, {
        grossSales: m.total_sales, tax: m.total_tax, qty: m.qty,
        cogs, costFees: m.cost_fees,
        desc: m.product_description, caseSize: m.case_size,
        netCost: m.net_cost, cost: m.cost,
      });
    } else {
      ex.grossSales += m.total_sales;
      ex.tax += m.total_tax;
      ex.qty += m.qty;
      ex.cogs += cogs;
      ex.costFees += m.cost_fees;
    }
  }
  return map;
};

const buildRows = (
  tyMargins: SubDeptMargin[],
  lwMargins: SubDeptMargin[],
  lyMargins: SubDeptMargin[],
): ItemMarginRow[] => {
  const tyMap = aggregateByUpc(tyMargins);
  const lwMap = aggregateByUpc(lwMargins);
  const lyMap = aggregateByUpc(lyMargins);

  const rows: ItemMarginRow[] = [];
  for (const [upc, ty] of tyMap) {
    const netSales = ty.grossSales - ty.tax;
    const tyMarginPct = netSales > 0 ? ((netSales - ty.cogs) / netSales) * 100 : 0;

    const lw = lwMap.get(upc);
    const lwNet = lw ? lw.grossSales - lw.tax : 0;
    const lwMarginPct = lw && lwNet > 0 ? ((lwNet - lw.cogs) / lwNet) * 100 : null;

    const ly = lyMap.get(upc);
    const lyNet = ly ? ly.grossSales - ly.tax : 0;
    const lyMarginPct = ly && lyNet > 0 ? ((lyNet - ly.cogs) / lyNet) * 100 : null;

    rows.push({
      productCode: upc,
      description: ty.desc,
      grossSales: ty.grossSales,
      netSales,
      tax: ty.tax,
      qty: ty.qty,
      cogs: ty.cogs,
      costFees: ty.costFees,
      tyMarginPct,
      lwMarginPct,
      lyMarginPct,
    });
  }

  return rows;
};

interface Props {
  tyMargins: SubDeptMargin[];
  lwMargins: SubDeptMargin[];
  lyMargins: SubDeptMargin[];
}

const byDate = (src: SubDeptMargin[], dateStr: string) =>
  src.filter((m) => m.sale_date.split("T")[0] === dateStr);

const MarginPerfItemsTable = ({ tyMargins, lwMargins, lyMargins }: Props) => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const ctx = useSubMarginCtx();

  const [sortCol, setSortCol] = useState<SortCol | null>("grossSales");
  const [sortDir, setSortDir] = useState<"desc" | "asc" | null>("desc");
  const [draftDesc, setDraftDesc] = useState("");
  const [appliedDesc, setAppliedDesc] = useState("");
  const [draftUpc, setDraftUpc] = useState("");
  const [appliedUpc, setAppliedUpc] = useState("");

  const [thresholdValue, setThresholdValue] = useState<ThresholdValue | null>({ op: "gt", amount: 3 });
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");

  // When a single day is selected in the day sidebar, scope all three
  // periods down to that day — TY to the day itself, LW/LY to that same
  // day's mapped date (holiday- and leap-year-aware for LY via getLYDate).
  const dayFilteredMargins = useMemo(() => {
    if (!ctx.selectedWeekDay) return { ty: tyMargins, lw: lwMargins, ly: lyMargins };
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
    () => buildRows(dayFilteredMargins.ty, dayFilteredMargins.lw, dayFilteredMargins.ly),
    [dayFilteredMargins],
  );

  useEffect(() => {
    dispatch(actions.setItemGridData(rawRows.map((r) => ({
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
    }))));
  }, [rawRows]);

  // Grading should never move items around on its own when the threshold
  // input is cleared — keep grading against the last valid amount so
  // severity/sort stays exactly where it was until a new number is typed.
  const thresholdRef = useRef<number>(thresholdValue?.amount ?? 3);
  if (thresholdValue?.amount != null) thresholdRef.current = thresholdValue.amount;
  const thresholdAmt = thresholdRef.current;

  const sevCounts = useMemo(() => {
    const counts: Record<Severity, number> = { critical: 0, watch: 0, healthy: 0, ungraded: 0 };
    for (const row of rawRows) counts[getItemSeverity(row, thresholdAmt)]++;
    return counts;
  }, [rawRows, thresholdAmt]);

  const displayData = useMemo(() => {
    let data = [...rawRows];
    if (appliedDesc) data = data.filter((d) => d.description.toLowerCase().includes(appliedDesc.toLowerCase()));
    if (appliedUpc) data = data.filter((d) => d.productCode.includes(appliedUpc));

    if (sevFilter !== "all") {
      data = data.filter((d) => getItemSeverity(d, thresholdAmt) === sevFilter);
    }

    if (sortCol && sortDir) {
      data.sort((a, b) => {
        let av: number | string, bv: number | string;
        switch (sortCol) {
          case "description": av = a.description; bv = b.description; break;
          case "upc": av = a.productCode; bv = b.productCode; break;
          case "grossSales": av = a.grossSales; bv = b.grossSales; break;
          case "qty": av = a.qty; bv = b.qty; break;
          case "cogs": av = a.cogs; bv = b.cogs; break;
          case "costFees": av = a.costFees; bv = b.costFees; break;
          case "tyMargin": av = a.tyMarginPct; bv = b.tyMarginPct; break;
          case "lwMargin": av = a.lwMarginPct ?? -999; bv = b.lwMarginPct ?? -999; break;
          case "lyMargin": av = a.lyMarginPct ?? -999; bv = b.lyMarginPct ?? -999; break;
        }
        if (typeof av === "string") {
          return sortDir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
        }
        return sortDir === "asc" ? av - (bv as number) : (bv as number) - av;
      });
    }

    return data;
  }, [rawRows, sortCol, sortDir, appliedDesc, appliedUpc, sevFilter, thresholdAmt]);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      if (sortDir === "desc") setSortDir("asc");
      else if (sortDir === "asc") { setSortCol(null); setSortDir(null); }
    } else { setSortCol(col); setSortDir("desc"); }
  };

  const arrow = (col: SortCol) => {
    if (sortCol !== col || !sortDir) return <span className="text-content/20"> ↕</span>;
    return <span className="text-[#1e2a4a]"> {sortDir === "desc" ? "↓" : "↑"}</span>;
  };

  const handleCtxMenu = (e: React.MouseEvent<HTMLDivElement>, upc?: string) => {
    e.preventDefault();
    dispatch(setMenuPosition({ x: e.clientX + 5, y: e.clientY }));
    const allUpc = displayData.map((d) => d.productCode).join(", ");
    dispatch(setSMClipboardText({ upc: upc ?? "", allUpc }));
  };

  const thStyle = "px-2 py-2";
  const thBtn = "text-[9px] font-semibold uppercase tracking-wide text-content/35 hover:text-content/60 transition-colors";

  const ptsDelta = (ty: number, ref: number | null) => {
    if (ref === null) return null;
    return Math.round((ty - ref) * 10) / 10;
  };

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto thin-scrollbar"
      onContextMenuCapture={(e) => handleCtxMenu(e)}
    >
      {/* ── Control bar ── */}
      <div className="sticky top-0 z-20 flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <span className="text-[9px] font-semibold uppercase tracking-wide text-content/45 flex-shrink-0">Item Threshold</span>
        <ThresholdFilter
          value={thresholdValue}
          onChange={setThresholdValue}
          showOp={false}
          showClear={false}
          suffix="pts"
          inputWidth={46}
        />

        <div className="w-px h-4 bg-gray-200 flex-shrink-0 mx-0.5" />

        <button onClick={() => setSevFilter("all")} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${sevFilter === "all" ? "bg-[#1e2a4a] border-[#1e2a4a] text-white" : "bg-transparent border-gray-200 text-content/40 hover:text-content/60"}`}>
          All ({rawRows.length})
        </button>
        <button onClick={() => setSevFilter("critical")} className={chipClass(sevFilter === "critical", "critical")}>
          <ExclamationTriangleIcon className="w-2.5 h-2.5" />Crit ({sevCounts.critical})
        </button>
        <button onClick={() => setSevFilter("watch")} className={chipClass(sevFilter === "watch", "watch")}>
          <ExclamationCircleIcon className="w-2.5 h-2.5" />Watch ({sevCounts.watch})
        </button>
        <button onClick={() => setSevFilter("healthy")} className={chipClass(sevFilter === "healthy", "healthy")}>
          <CheckCircleIcon className="w-2.5 h-2.5" />OK ({sevCounts.healthy})
        </button>
      </div>

      {/* ── Column headers ── */}
      <div className="sticky top-[33px] z-10 grid bg-gray-100 border-b border-gray-100" style={{ gridTemplateColumns: COLS }}>
        <div className={`${thStyle} flex items-center gap-2`}>
          <span className="text-[9px] font-semibold uppercase tracking-wide text-content/35">Item</span>
          <ColFilter label="UPC" active={!!appliedUpc} onApply={() => setAppliedUpc(draftUpc)} onClear={() => { setAppliedUpc(""); setDraftUpc(""); }}>
            <input autoFocus style={colInputStyle} placeholder="Search UPC…" value={draftUpc} onChange={(e) => setDraftUpc(e.target.value)} />
          </ColFilter>
          <ColFilter label="Desc" active={!!appliedDesc} onApply={() => setAppliedDesc(draftDesc)} onClear={() => { setAppliedDesc(""); setDraftDesc(""); }}>
            <input autoFocus style={colInputStyle} placeholder="Search description…" value={draftDesc} onChange={(e) => setDraftDesc(e.target.value)} />
          </ColFilter>
        </div>
        <div className={`${thStyle} flex justify-end`}>
          <button onClick={() => handleSort("grossSales")} className={thBtn}>Sales{arrow("grossSales")}</button>
        </div>
        <div className={`${thStyle} flex justify-end`}>
          <button onClick={() => handleSort("qty")} className={thBtn}>Qty{arrow("qty")}</button>
        </div>
        <div className={`${thStyle} flex justify-end`}>
          <button onClick={() => handleSort("tyMargin")} className={thBtn}>TY %{arrow("tyMargin")}</button>
        </div>
        <div className={`${thStyle} flex justify-end`}>
          <button onClick={() => handleSort("lwMargin")} className={thBtn}>LW %{arrow("lwMargin")}</button>
        </div>
        <div className={`${thStyle} flex justify-end`}>
          <button onClick={() => handleSort("lyMargin")} className={thBtn}>LY %{arrow("lyMargin")}</button>
        </div>
        <div className={`${thStyle} flex justify-end`}>
          <button onClick={() => handleSort("cogs")} className={thBtn}>COGS{arrow("cogs")}</button>
        </div>
        <div className={`${thStyle} flex justify-end`}>
          <button onClick={() => handleSort("costFees")} className={thBtn}>Cost Fees{arrow("costFees")}</button>
        </div>
      </div>

      {displayData.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-[11px] text-content/30">
          {rawRows.length > 0 ? "No items match filters" : "No item data"}
        </div>
      ) : (
        displayData.map((item, i) => {
          const sev = getItemSeverity(item, thresholdAmt);
          const lwDelta = ptsDelta(item.tyMarginPct, item.lwMarginPct);
          const lyDelta = ptsDelta(item.tyMarginPct, item.lyMarginPct);
          return (
            <div
              key={item.productCode}
              className="grid border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
              style={{
                gridTemplateColumns: COLS,
                background: i % 2 === 1 ? "rgba(30,42,74,0.015)" : undefined,
              }}
              onContextMenuCapture={(e) => handleCtxMenu(e, item.productCode)}
            >
              <div className="flex items-center gap-2 px-2 py-[7px] min-w-0">
                <SeverityBadge severity={sev} />
                <div className="flex flex-col justify-center min-w-0">
                  <div className="text-[10px] text-content/50 tabular-nums truncate">{item.productCode}</div>
                  <div className="text-[11px] font-medium text-content truncate">{item.description}</div>
                </div>
              </div>
              <div className="px-2 py-[9px] text-[11px] text-right tabular-nums text-content/80">{formatCurrency2(item.grossSales)}</div>
              <div className="px-2 py-[9px] text-[11px] text-right tabular-nums text-content/80">{item.qty}</div>
              <div className="px-2 py-[9px] text-[11px] text-right tabular-nums font-semibold text-[#1e2a4a]">
                {item.tyMarginPct.toFixed(2)}%
              </div>
              <div className="px-2 py-[9px] text-right">
                {item.lwMarginPct !== null ? (
                  <>
                    <div className="text-[11px] tabular-nums text-content/70">{item.lwMarginPct.toFixed(2)}%</div>
                    {lwDelta !== null && (
                      <div className="text-[9px] tabular-nums font-medium" style={{ color: lwDelta > 0 ? "#16a34a" : lwDelta < 0 ? "#ef4444" : "#16a34a" }}>
                        {lwDelta > 0 ? "+" : ""}{lwDelta.toFixed(1)} pts
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-[11px] text-content/25">—</span>
                )}
              </div>
              <div className="px-2 py-[9px] text-right">
                {item.lyMarginPct !== null ? (
                  <>
                    <div className="text-[11px] tabular-nums text-content/70">{item.lyMarginPct.toFixed(2)}%</div>
                    {lyDelta !== null && (
                      <div className="text-[9px] tabular-nums font-medium" style={{ color: lyDelta > 0 ? "#16a34a" : lyDelta < 0 ? "#ef4444" : "#16a34a" }}>
                        {lyDelta > 0 ? "+" : ""}{lyDelta.toFixed(1)} pts
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-[11px] text-content/25">—</span>
                )}
              </div>
              <div className="px-2 py-[9px] text-[11px] text-right tabular-nums text-content/80">
                {formatCurrency2(item.cogs)}
              </div>
              <div className="px-2 py-[9px] text-[11px] text-right tabular-nums text-content/60">
                {item.costFees.toFixed(2)}%
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default MarginPerfItemsTable;
