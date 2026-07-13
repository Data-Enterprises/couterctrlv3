import { useEffect, useState, useRef, useMemo } from "react";
import { MagnifyingGlassIcon, MinusCircleIcon } from "@heroicons/react/16/solid";
import { useAppDispatch } from "../../../../hooks";
import { useSubMarginCtx } from "../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { calculateCogs, getLYDate } from "../..";
import { formatCurrency2, addDays } from "../../../../utils";
import type { SubDeptMargin } from "../../../../interfaces";
import ThresholdFilter from "../../../../components/filters/ThresholdFilter";
import type { ThresholdValue } from "../../../../components/filters/ThresholdFilter";
import UpcContextMenu from "../../../../components/UpcContextMenu";
import SharedSeverityBadge from "../../../../components/SeverityBadge";
import { chipClass } from "../../../../utils/severity";

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

// "ungraded" has no shared SeverityBadge equivalent — small local adapter.
const SeverityBadge = ({ severity }: { severity: Severity }) =>
  severity === "ungraded" ? (
    <div className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 bg-gray-100">
      <MinusCircleIcon className="w-3 h-3 text-gray-400" />
    </div>
  ) : (
    <SharedSeverityBadge severity={severity} />
  );

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
          active ? "text-[#1e2a4a]" : "text-content"
        }`}
      >
        {label}
        {active && <span className="w-1 h-1 rounded-full bg-[#1e2a4a] flex-shrink-0" />}
      </button>
      {open && <div className="fixed inset-0 z-[199]" onClick={() => setOpen(false)} />}
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
              onClick={() => { onApply(); setOpen(false); }}
              className="flex-1 flex items-center justify-center gap-1 rounded py-1 text-[10px] font-medium text-custom-white"
              style={{ background: "#1e2a4a" }}
            >
              <MagnifyingGlassIcon className="w-3 h-3" /> Apply
            </button>
            {onClear && (
              <button
                onClick={() => { onClear(); setOpen(false); }}
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

  const [thresholdValue, setThresholdValue] = useState<ThresholdValue | null>({ op: "gt", amount: 9 });
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [threshOpen, setThreshOpen] = useState(false);
  const threshBtnRef = useRef<HTMLButtonElement>(null);
  const threshPopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threshOpen) return;
    const close = (e: MouseEvent) => {
      if (
        threshBtnRef.current && !threshBtnRef.current.contains(e.target as Node) &&
        threshPopRef.current && !threshPopRef.current.contains(e.target as Node)
      ) setThreshOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [threshOpen]);

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
  const thresholdRef = useRef<number>(thresholdValue?.amount ?? 9);
  if (thresholdValue?.amount != null) thresholdRef.current = thresholdValue.amount;
  const thresholdAmt = thresholdRef.current;

  const sevCounts = useMemo(() => {
    const counts: Record<Severity, number> = { critical: 0, watch: 0, healthy: 0, ungraded: 0 };
    for (const row of rawRows) counts[getItemSeverity(row, thresholdAmt)]++;
    return counts;
  }, [rawRows, thresholdAmt]);

  // Independent of the active severity chip / search filters, so the context
  // menu's "copy critical/watch/healthy" options always mean the same thing.
  const severityUpcs = useMemo(() => {
    const buckets = { critical: [] as string[], watch: [] as string[], healthy: [] as string[] };
    for (const row of rawRows) {
      const sev = getItemSeverity(row, thresholdAmt);
      if (sev === "critical" || sev === "watch" || sev === "healthy") buckets[sev].push(row.productCode);
    }
    return buckets;
  }, [rawRows, thresholdAmt]);

  const allUpcs = useMemo(() => rawRows.map((r) => r.productCode), [rawRows]);

  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; upc: string } | null>(null);

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
    if (sortCol !== col || !sortDir) return <span className="text-content"> ↕</span>;
    return <span className="text-[#1e2a4a]"> {sortDir === "desc" ? "↓" : "↑"}</span>;
  };

  const openCtxMenu = (e: React.MouseEvent, upc: string) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, upc });
  };

  const thStyle = "px-2 py-2";
  const thBtn = "text-[9px] font-semibold uppercase tracking-wide text-content transition-colors";

  const ptsDelta = (ty: number, ref: number | null) => {
    if (ref === null) return null;
    return Math.round((ty - ref) * 10) / 10;
  };

  return (
    <>
    <div
      className="flex-1 min-h-0 overflow-y-auto thin-scrollbar"
      onContextMenu={(e) => openCtxMenu(e, "")}
    >
      {/* ── Control bar ── */}
      <div className="sticky top-0 z-20 flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <button
          onClick={() => setSevFilter((f) => (f === "critical" ? "all" : "critical"))}
          className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_critical_bg text-severity_critical_text transition-shadow ${
            sevFilter === "critical" ? "ring-2 ring-severity_critical_text/40 shadow-sm" : ""
          }`}
        >
          Crit ({sevCounts.critical})
        </button>
        <button
          onClick={() => setSevFilter((f) => (f === "watch" ? "all" : "watch"))}
          className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_watch_bg text-severity_watch_text transition-shadow ${
            sevFilter === "watch" ? "ring-2 ring-severity_watch_text/40 shadow-sm" : ""
          }`}
        >
          Watch ({sevCounts.watch})
        </button>
        <button
          onClick={() => setSevFilter((f) => (f === "healthy" ? "all" : "healthy"))}
          className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_healthy_bg text-severity_healthy_text transition-shadow ${
            sevFilter === "healthy" ? "ring-2 ring-severity_healthy_text/40 shadow-sm" : ""
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
                suffix="pts"
                inputWidth={46}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Column headers ── */}
      <div className="sticky top-[33px] z-10 grid bg-gray-100 border-b border-gray-100" style={{ gridTemplateColumns: COLS }}>
        <div className={`${thStyle} flex items-center gap-2`}>
          <span className="text-[9px] font-semibold uppercase tracking-wide text-content">Item</span>
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
        <div className="flex items-center justify-center h-24 text-[11px] text-content">
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
              className="grid border-b border-b-[#1e2a4a]/15 hover:bg-gray-50/80 transition-colors"
              style={{
                gridTemplateColumns: COLS,
                background: i % 2 === 1 ? "rgba(30,42,74,0.015)" : undefined,
              }}
              onContextMenu={(e) => { e.stopPropagation(); openCtxMenu(e, item.productCode); }}
            >
              <div className="flex items-center gap-2 px-2 py-[7px] min-w-0">
                <SeverityBadge severity={sev} />
                <div className="flex flex-col justify-center min-w-0">
                  <div className="text-[13px] font-medium text-content truncate">{item.description}</div>
                  <div className="text-[10px] text-content tabular-nums truncate">{item.productCode}</div>
                </div>
              </div>
              <div className="px-2 py-[9px] text-[13px] text-right tabular-nums text-content">{formatCurrency2(item.grossSales)}</div>
              <div className="px-2 py-[9px] text-[13px] text-right tabular-nums text-content">{item.qty}</div>
              <div className="px-2 py-[9px] text-[13px] text-right tabular-nums font-semibold text-[#1e2a4a]">
                {item.tyMarginPct.toFixed(2)}%
              </div>
              <div className="px-2 py-[9px] text-right">
                {item.lwMarginPct !== null ? (
                  <>
                    <div className="text-[13px] tabular-nums text-content">{item.lwMarginPct.toFixed(2)}%</div>
                    {lwDelta !== null && (
                      <div className="text-[10px] tabular-nums font-medium" style={{ color: lwDelta > 0 ? "#16a34a" : lwDelta < 0 ? "#ef4444" : "#16a34a" }}>
                        {lwDelta > 0 ? "+" : ""}{lwDelta.toFixed(1)} pts
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-[13px] text-content">—</span>
                )}
              </div>
              <div className="px-2 py-[9px] text-right">
                {item.lyMarginPct !== null ? (
                  <>
                    <div className="text-[13px] tabular-nums text-content">{item.lyMarginPct.toFixed(2)}%</div>
                    {lyDelta !== null && (
                      <div className="text-[10px] tabular-nums font-medium" style={{ color: lyDelta > 0 ? "#16a34a" : lyDelta < 0 ? "#ef4444" : "#16a34a" }}>
                        {lyDelta > 0 ? "+" : ""}{lyDelta.toFixed(1)} pts
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-[13px] text-content">—</span>
                )}
              </div>
              <div className="px-2 py-[9px] text-[13px] text-right tabular-nums text-content">
                {formatCurrency2(item.cogs)}
              </div>
              <div className="px-2 py-[9px] text-[13px] text-right tabular-nums text-content">
                {item.costFees.toFixed(2)}%
              </div>
            </div>
          );
        })
      )}
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
