import { useEffect, useState, useRef, useMemo } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { useSubMarginCtx } from "../../hooks";
import { useAppDispatch } from "../../../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { calculateCogs } from "../..";
import { formatCurrency2 } from "../../../../utils";
import { setMenuPosition, setSMClipboardText } from "../../../../features/ctxMenuSlice";
import type { SubDeptMargin } from "../../../../interfaces";

type FlagReason = "no_case_size" | "no_cost" | "outlier_margin" | null;

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
  flagReason: FlagReason;
}

type SortCol = "description" | "upc" | "grossSales" | "qty" | "tax" | "cogs" | "costFees" | "tyMargin";

const COLS = "0.55fr minmax(0,1.8fr) 0.55fr 0.4fr 0.45fr 0.55fr 0.45fr 0.42fr 0.22fr";

const FLAG_DOT: Record<NonNullable<FlagReason>, { color: string; title: string }> = {
  no_case_size: { color: "#ef4444", title: "No case size — COGS = $0" },
  no_cost: { color: "#ef4444", title: "No cost catalogued — COGS = $0" },
  outlier_margin: { color: "#f59e0b", title: "Suspiciously high margin (> 85%)" },
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 11,
  border: "1px solid rgba(30,42,74,0.15)",
  borderRadius: 4,
  padding: "4px 7px",
  outline: "none",
  color: "var(--color-text-primary)",
  background: "rgba(30,42,74,0.03)",
};

const buildRows = (tyMargins: SubDeptMargin[], selectedDay: string): ItemMarginRow[] => {
  const dayFilter = selectedDay
    ? new Date(selectedDay).toISOString().split("T")[0]
    : "";

  const filtered = tyMargins.filter((m) =>
    dayFilter ? m.sale_date.split("T")[0] === dayFilter : true,
  );

  const byUpc = new Map<string, {
    grossSales: number; tax: number; qty: number; cogs: number; costFees: number;
    desc: string; caseSize: number; netCost: number; cost: number;
  }>();

  for (const m of filtered) {
    const cogs = calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight);
    const ex = byUpc.get(m.product_code);
    if (!ex) {
      byUpc.set(m.product_code, {
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

  const rows: ItemMarginRow[] = [];
  for (const [upc, ty] of byUpc) {
    const netSales = ty.grossSales - ty.tax;
    const tyMarginPct = netSales > 0 ? ((netSales - ty.cogs) / netSales) * 100 : 0;

    let flagReason: FlagReason = null;
    if (ty.caseSize === 0) flagReason = "no_case_size";
    else if (ty.netCost === 0 && ty.cost === 0) flagReason = "no_cost";
    else if (tyMarginPct > 85) flagReason = "outlier_margin";

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
      flagReason,
    });
  }

  return rows;
};

const MarginPerfItemsTable = () => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const ctx = useSubMarginCtx();

  const [sortCol, setSortCol] = useState<SortCol>("grossSales");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [draftDesc, setDraftDesc] = useState("");
  const [appliedDesc, setAppliedDesc] = useState("");
  const [draftUpc, setDraftUpc] = useState("");
  const [appliedUpc, setAppliedUpc] = useState("");

  useEffect(() => {
    setAppliedDesc("");
    setDraftDesc("");
    setAppliedUpc("");
    setDraftUpc("");
  }, [ctx.selectedWeekDay, ctx.selectedWeek]);

  const rawRows = useMemo(
    () => buildRows(ctx.margins, ctx.selectedWeekDay),
    [ctx.margins, ctx.selectedWeekDay],
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

  const displayData = useMemo(() => {
    let data = [...rawRows];
    if (appliedDesc) data = data.filter((d) => d.description.toLowerCase().includes(appliedDesc.toLowerCase()));
    if (appliedUpc) data = data.filter((d) => d.productCode.includes(appliedUpc));

    data.sort((a, b) => {
      let av: number | string, bv: number | string;
      switch (sortCol) {
        case "description": av = a.description; bv = b.description; break;
        case "upc": av = a.productCode; bv = b.productCode; break;
        case "grossSales": av = a.grossSales; bv = b.grossSales; break;
        case "qty": av = a.qty; bv = b.qty; break;
        case "tax": av = a.tax; bv = b.tax; break;
        case "cogs": av = a.cogs; bv = b.cogs; break;
        case "costFees": av = a.costFees; bv = b.costFees; break;
        case "tyMargin": av = a.tyMarginPct; bv = b.tyMarginPct; break;
      }
      if (typeof av === "string") {
        return sortDir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      }
      return sortDir === "asc" ? av - (bv as number) : (bv as number) - av;
    });

    return data;
  }, [rawRows, sortCol, sortDir, appliedDesc, appliedUpc]);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("desc"); }
  };

  const arrow = (col: SortCol) => {
    if (sortCol !== col) return <span className="text-content/20"> ↕</span>;
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

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto thin-scrollbar"
      onContextMenuCapture={(e) => handleCtxMenu(e)}
    >
      <div className="sticky top-0 z-10 grid bg-gray-100 border-b border-gray-100" style={{ gridTemplateColumns: COLS }}>
        <div className={thStyle}>
          <ColFilter label="UPC" active={!!appliedUpc} onApply={() => setAppliedUpc(draftUpc)} onClear={() => { setAppliedUpc(""); setDraftUpc(""); }}>
            <input autoFocus style={inputStyle} placeholder="Search UPC…" value={draftUpc} onChange={(e) => setDraftUpc(e.target.value)} />
          </ColFilter>
        </div>
        <div className={thStyle}>
          <ColFilter label="Description" active={!!appliedDesc} onApply={() => setAppliedDesc(draftDesc)} onClear={() => { setAppliedDesc(""); setDraftDesc(""); }}>
            <input autoFocus style={inputStyle} placeholder="Search description…" value={draftDesc} onChange={(e) => setDraftDesc(e.target.value)} />
          </ColFilter>
        </div>
        <div className={`${thStyle} flex justify-end`}>
          <button onClick={() => handleSort("grossSales")} className={thBtn}>Sales{arrow("grossSales")}</button>
        </div>
        <div className={`${thStyle} flex justify-end`}>
          <button onClick={() => handleSort("qty")} className={thBtn}>Qty{arrow("qty")}</button>
        </div>
        <div className={`${thStyle} flex justify-end`}>
          <button onClick={() => handleSort("tax")} className={thBtn}>Tax{arrow("tax")}</button>
        </div>
        <div className={`${thStyle} flex justify-end`}>
          <button onClick={() => handleSort("tyMargin")} className={thBtn}>TY %{arrow("tyMargin")}</button>
        </div>
        <div className={`${thStyle} flex justify-end`}>
          <button onClick={() => handleSort("cogs")} className={thBtn}>COGS{arrow("cogs")}</button>
        </div>
        <div className={`${thStyle} flex justify-end`}>
          <button onClick={() => handleSort("costFees")} className={thBtn}>Cost Fees{arrow("costFees")}</button>
        </div>
        <div className={thStyle} />
      </div>

      {displayData.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-[11px] text-content/30">
          {rawRows.length > 0 ? "No items match filters" : "No item data"}
        </div>
      ) : (
        displayData.map((item, i) => {
          const hasFlag = item.flagReason !== null;
          const flagInfo = item.flagReason ? FLAG_DOT[item.flagReason] : null;
          return (
            <div
              key={item.productCode}
              className="grid border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
              style={{
                gridTemplateColumns: COLS,
                background: hasFlag ? "#fff7ed" : i % 2 === 1 ? "rgba(30,42,74,0.015)" : undefined,
              }}
              onContextMenuCapture={(e) => handleCtxMenu(e, item.productCode)}
            >
              <div className="px-2 py-[9px] text-[10px] text-content/50 tabular-nums truncate">{item.productCode}</div>
              <div className="px-2 py-[9px] text-[11px] font-medium text-content truncate">{item.description}</div>
              <div className="px-2 py-[9px] text-[11px] text-right tabular-nums text-content/80">{formatCurrency2(item.grossSales)}</div>
              <div className="px-2 py-[9px] text-[11px] text-right tabular-nums text-content/80">{item.qty}</div>
              <div className="px-2 py-[9px] text-[11px] text-right tabular-nums text-content/60">{formatCurrency2(item.tax)}</div>
              <div className="px-2 py-[9px] text-[11px] text-right tabular-nums font-semibold text-[#1e2a4a]">
                {item.tyMarginPct.toFixed(2)}%
              </div>
              <div className="px-2 py-[9px] text-[11px] text-right tabular-nums text-content/80">
                {formatCurrency2(item.cogs)}
              </div>
              <div className="px-2 py-[9px] text-[11px] text-right tabular-nums text-content/60">
                {item.costFees.toFixed(2)}%
              </div>
              <div className="px-2 py-[9px] flex items-center justify-center">
                {flagInfo && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: flagInfo.color }} title={flagInfo.title} />
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default MarginPerfItemsTable;
