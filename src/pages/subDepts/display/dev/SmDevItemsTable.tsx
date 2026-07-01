import { useEffect, useState, useRef, useMemo } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { useSubMarginCtx } from "../../hooks";
import { useAppDispatch } from "../../../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { calculateCogs } from "../..";
import { formatCurrency2 } from "../../../../utils";
import type { ItemRow } from "../widgets";
import { setMenuPosition, setSMClipboardText } from "../../../../features/ctxMenuSlice";

// ── Column filter popover ─────────────────────────────────────────────────────

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

// ── Table ─────────────────────────────────────────────────────────────────────

type SortCol = "description" | "upc" | "sales" | "cogs" | "margin" | "qty";

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

const COLS = "minmax(0,1.8fr) 0.65fr 0.55fr 0.5fr 0.44fr 0.38fr";

const SmDevItemsTable = () => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const ctx = useSubMarginCtx();

  const [gridData, setGridData] = useState<ItemRow[]>([]);
  const [sortCol, setSortCol] = useState<SortCol>("sales");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [draftDesc, setDraftDesc] = useState("");
  const [appliedDesc, setAppliedDesc] = useState("");
  const [draftUpc, setDraftUpc] = useState("");
  const [appliedUpc, setAppliedUpc] = useState("");

  // Data reduction — same logic as original ItemsGrid, same dep array
  useEffect(() => {
    const dateComp = ctx.selectedWeekDay
      ? new Date(ctx.selectedWeekDay).toISOString().split("T")[0]
      : "";

    const filtered = ctx.margins.filter((m) =>
      dateComp ? m.sale_date.split("T")[0] === dateComp : true,
    );

    const reduced = filtered.reduce((acc: ItemRow[], margin) => {
      const found = acc.find((item) => item.product_code === margin.product_code);
      if (!found) {
        acc.push({
          sub_department_description: margin.sub_department_description,
          product_code: margin.product_code,
          product_description: margin.product_description,
          cogs: calculateCogs(
            margin.net_cost,
            margin.cost,
            margin.case_size,
            margin.qty,
            margin.weight,
          ),
          cost_fees: margin.cost_fees,
          total_sales: margin.total_sales - margin.total_tax,
          net_sales: margin.net_sales,
          total_tax: margin.total_tax,
          qty: margin.qty,
          margin: 0,
        });
      } else {
        found.cogs += calculateCogs(
          margin.net_cost,
          margin.cost,
          margin.case_size,
          margin.qty,
          margin.weight,
        );
        found.total_sales += margin.total_sales - margin.total_tax;
        found.net_sales += margin.net_sales;
        found.total_tax += margin.total_tax;
        found.qty += margin.qty;
      }
      return acc;
    }, []);

    const newData = reduced.map((item) => ({
      ...item,
      margin: ((item.total_sales - item.cogs) / item.total_sales) * 100 || 0,
    }));
    dispatch(actions.setItemGridData(newData));
    dispatch(actions.setFilteredItemGridData(newData));
    setGridData(newData);
  }, [ctx.selectedWeekDay]);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("desc"); }
  };

  const arrow = (col: SortCol) => {
    if (sortCol !== col) return <span className="text-content/20"> ↕</span>;
    return <span className="text-[#1e2a4a]"> {sortDir === "desc" ? "↓" : "↑"}</span>;
  };

  const displayData = useMemo(() => {
    let data = [...gridData];
    if (appliedDesc) data = data.filter((d) => d.product_description.toLowerCase().includes(appliedDesc.toLowerCase()));
    if (appliedUpc) data = data.filter((d) => d.product_code.includes(appliedUpc));

    data.sort((a, b) => {
      let av: number | string, bv: number | string;
      switch (sortCol) {
        case "description": av = a.product_description; bv = b.product_description; break;
        case "upc": av = a.product_code; bv = b.product_code; break;
        case "sales": av = a.total_sales; bv = b.total_sales; break;
        case "cogs": av = a.cogs; bv = b.cogs; break;
        case "margin": av = a.margin; bv = b.margin; break;
        case "qty": av = a.qty; bv = b.qty; break;
      }
      if (typeof av === "string") {
        return sortDir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      }
      return sortDir === "asc" ? av - (bv as number) : (bv as number) - av;
    });
    return data;
  }, [gridData, sortCol, sortDir, appliedDesc, appliedUpc]);

  const handleCtxMenu = (e: React.MouseEvent<HTMLDivElement>, item?: ItemRow) => {
    e.preventDefault();
    dispatch(setMenuPosition({ x: e.clientX + 5, y: e.clientY }));
    const allUpc = displayData.map((d) => d.product_code).join(", ");
    dispatch(setSMClipboardText({ upc: item?.product_code ?? "", allUpc }));
  };

  const marginColor = (m: number) => {
    if (m >= 30) return "text-emerald-600";
    if (m >= 15) return "text-content";
    return "text-red-500";
  };

  const thStyle = "px-3 py-2";

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto thin-scrollbar"
      onContextMenuCapture={(e) => handleCtxMenu(e)}
    >
      {/* Sticky column headers */}
      <div
        className="sticky top-0 z-10 grid bg-gray-100 border-b border-gray-100"
        style={{ gridTemplateColumns: COLS }}
      >
        <div className={thStyle}>
          <ColFilter
            label="Description"
            active={!!appliedDesc}
            onApply={() => setAppliedDesc(draftDesc)}
            onClear={() => { setAppliedDesc(""); setDraftDesc(""); }}
          >
            <input
              autoFocus
              style={inputStyle}
              placeholder="Search description…"
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
            />
          </ColFilter>
        </div>
        <div className={thStyle}>
          <ColFilter
            label="UPC"
            active={!!appliedUpc}
            onApply={() => setAppliedUpc(draftUpc)}
            onClear={() => { setAppliedUpc(""); setDraftUpc(""); }}
          >
            <input
              autoFocus
              style={inputStyle}
              placeholder="Search UPC…"
              value={draftUpc}
              onChange={(e) => setDraftUpc(e.target.value)}
            />
          </ColFilter>
        </div>
        <div className={`${thStyle} flex justify-end`}>
          <button
            onClick={() => handleSort("sales")}
            className="text-[9px] font-semibold uppercase tracking-wide text-content/35 hover:text-content/60 transition-colors"
          >
            Net Sales{arrow("sales")}
          </button>
        </div>
        <div className={`${thStyle} flex justify-end`}>
          <button
            onClick={() => handleSort("cogs")}
            className="text-[9px] font-semibold uppercase tracking-wide text-content/35 hover:text-content/60 transition-colors"
          >
            COGS{arrow("cogs")}
          </button>
        </div>
        <div className={`${thStyle} flex justify-end`}>
          <button
            onClick={() => handleSort("margin")}
            className="text-[9px] font-semibold uppercase tracking-wide text-content/35 hover:text-content/60 transition-colors"
          >
            Margin{arrow("margin")}
          </button>
        </div>
        <div className={`${thStyle} flex justify-end`}>
          <button
            onClick={() => handleSort("qty")}
            className="text-[9px] font-semibold uppercase tracking-wide text-content/35 hover:text-content/60 transition-colors"
          >
            Qty{arrow("qty")}
          </button>
        </div>
      </div>

      {/* Rows */}
      {displayData.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-[11px] text-content/30">
          {gridData.length > 0 ? "No items match filters" : "No item data"}
        </div>
      ) : (
        displayData.map((item, i) => (
          <div
            key={item.product_code}
            className="grid border-b border-gray-100 hover:bg-gray-50 transition-colors"
            style={{
              gridTemplateColumns: COLS,
              background: i % 2 === 1 ? "rgba(30,42,74,0.015)" : undefined,
            }}
            onContextMenuCapture={(e) => handleCtxMenu(e, item)}
          >
            <div className="px-3 py-[9px] text-[11px] font-medium text-content truncate">{item.product_description}</div>
            <div className="px-3 py-[9px] text-[10px] text-content/50 tabular-nums truncate">{item.product_code}</div>
            <div className="px-3 py-[9px] text-[11px] text-right tabular-nums font-semibold text-[#1e2a4a]">{formatCurrency2(item.total_sales)}</div>
            <div className="px-3 py-[9px] text-[11px] text-right tabular-nums text-content/70">{formatCurrency2(item.cogs)}</div>
            <div className={`px-3 py-[9px] text-[11px] text-right tabular-nums font-semibold ${marginColor(item.margin)}`}>
              {item.margin.toFixed(1)}%
            </div>
            <div className="px-3 py-[9px] text-[11px] text-right tabular-nums text-content/70">{item.qty.toLocaleString()}</div>
          </div>
        ))
      )}
    </div>
  );
};

export default SmDevItemsTable;
