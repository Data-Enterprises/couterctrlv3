import { useEffect, useState, useRef, useMemo } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { useAppSelector, useAppDispatch } from "../../../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { setMenuPosition, setSMClipboardText } from "../../../../features/ctxMenuSlice";
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import type { SubDeptCost } from "../../../../interfaces";

// ── Shared filter popover ─────────────────────────────────────────────────────

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

// ── Threshold filter input (operator + value) ─────────────────────────────────

type Operator = ">" | "<" | "=";

interface ThreshInputProps {
  operator: Operator;
  value: string;
  onOperatorChange: (op: Operator) => void;
  onValueChange: (v: string) => void;
  placeholder?: string;
}

const inputStyle: React.CSSProperties = {
  fontSize: 11,
  border: "1px solid rgba(30,42,74,0.15)",
  borderRadius: 4,
  padding: "4px 7px",
  outline: "none",
  color: "var(--color-text-primary)",
  background: "rgba(30,42,74,0.03)",
};

const ThreshInput = ({ operator, value, onOperatorChange, onValueChange, placeholder }: ThreshInputProps) => (
  <div className="flex gap-1">
    <select
      value={operator}
      onChange={(e) => onOperatorChange(e.target.value as Operator)}
      style={{ ...inputStyle, width: 42, padding: "4px 4px" }}
    >
      <option value=">">{">"}</option>
      <option value="<">{"<"}</option>
      <option value="=">{"="}</option>
    </select>
    <input
      autoFocus
      type="number"
      style={{ ...inputStyle, flex: 1 }}
      placeholder={placeholder ?? "Value…"}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    />
  </div>
);

// ── Table ─────────────────────────────────────────────────────────────────────

type SortCol = "description" | "upc" | "unitCost" | "caseCost" | "qty" | "cogs";

const COLS = "minmax(0,2fr) 0.6fr 0.55fr 0.55fr 0.42fr 0.55fr";

const SubDeptCostGrid = () => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const sm = useAppSelector((state) => state.subMargin);

  const [sortCol, setSortCol] = useState<SortCol | null>("cogs");
  const [sortDir, setSortDir] = useState<"desc" | "asc" | null>("desc");

  // Text filters
  const [draftDesc, setDraftDesc] = useState("");
  const [appliedDesc, setAppliedDesc] = useState("");
  const [draftUpc, setDraftUpc] = useState("");
  const [appliedUpc, setAppliedUpc] = useState("");

  // Threshold filters
  const [draftUnitCostOp, setDraftUnitCostOp] = useState<Operator>(">");
  const [draftUnitCostVal, setDraftUnitCostVal] = useState("");
  const [appliedUnitCost, setAppliedUnitCost] = useState<{ op: Operator; val: string }>({ op: ">", val: "" });

  const [draftCaseCostOp, setDraftCaseCostOp] = useState<Operator>(">");
  const [draftCaseCostVal, setDraftCaseCostVal] = useState("");
  const [appliedCaseCost, setAppliedCaseCost] = useState<{ op: Operator; val: string }>({ op: ">", val: "" });

  const [draftQtyOp, setDraftQtyOp] = useState<Operator>(">");
  const [draftQtyVal, setDraftQtyVal] = useState("");
  const [appliedQty, setAppliedQty] = useState<{ op: Operator; val: string }>({ op: ">", val: "" });

  const [draftCogsOp, setDraftCogsOp] = useState<Operator>(">");
  const [draftCogsVal, setDraftCogsVal] = useState("");
  const [appliedCogs, setAppliedCogs] = useState<{ op: Operator; val: string }>({ op: ">", val: "" });

  const applyThresh = (val: string, op: Operator, rowVal: number) => {
    const n = parseFloat(val);
    if (isNaN(n)) return true;
    if (op === ">") return rowVal > n;
    if (op === "<") return rowVal < n;
    return rowVal === n;
  };

  const displayData = useMemo(() => {
    let data: SubDeptCost[] = [...sm.subDeptCost];

    const day = sm.selectedWeekDay;
    if (day) data = data.filter((d) => d.date === day);
    if (appliedDesc) data = data.filter((d) => d.description.toLowerCase().includes(appliedDesc.toLowerCase()));
    if (appliedUpc) data = data.filter((d) => d.product_code.includes(appliedUpc));
    if (appliedUnitCost.val) data = data.filter((d) => applyThresh(appliedUnitCost.val, appliedUnitCost.op, d.calculated_cost));
    if (appliedCaseCost.val) data = data.filter((d) => applyThresh(appliedCaseCost.val, appliedCaseCost.op, d.cost));
    if (appliedQty.val) data = data.filter((d) => applyThresh(appliedQty.val, appliedQty.op, d.qty));
    if (appliedCogs.val) data = data.filter((d) => applyThresh(appliedCogs.val, appliedCogs.op, d.total_cost));

    if (sortCol && sortDir) {
      data.sort((a, b) => {
        let av: number | string, bv: number | string;
        switch (sortCol) {
          case "description": av = a.description; bv = b.description; break;
          case "upc": av = a.product_code; bv = b.product_code; break;
          case "unitCost": av = a.calculated_cost; bv = b.calculated_cost; break;
          case "caseCost": av = a.cost; bv = b.cost; break;
          case "qty": av = a.qty; bv = b.qty; break;
          case "cogs": av = a.total_cost; bv = b.total_cost; break;
        }
        if (typeof av === "string") {
          return sortDir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
        }
        return sortDir === "asc" ? av - (bv as number) : (bv as number) - av;
      });
    }

    return data;
  }, [sm.subDeptCost, sm.selectedWeekDay, appliedDesc, appliedUpc, appliedUnitCost, appliedCaseCost, appliedQty, appliedCogs, sortCol, sortDir]);

  useEffect(() => {
    dispatch(actions.setFilteredCostGridData(displayData));
  }, [displayData]);

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

  const handleCtxMenu = (e: React.MouseEvent<HTMLDivElement>, item?: SubDeptCost) => {
    e.preventDefault();
    dispatch(setMenuPosition({ x: e.clientX + 5, y: e.clientY }));
    const allUpc = displayData.map((d) => d.product_code).join(", ");
    dispatch(setSMClipboardText({ upc: item?.product_code ?? "", allUpc }));
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
              style={{ ...inputStyle, width: "100%" }}
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
              style={{ ...inputStyle, width: "100%" }}
              placeholder="Search UPC…"
              value={draftUpc}
              onChange={(e) => setDraftUpc(e.target.value)}
            />
          </ColFilter>
        </div>
        <div className={`${thStyle} flex items-center justify-end gap-1.5`}>
          <ColFilter
            label="Unit Cost"
            active={!!appliedUnitCost.val}
            align="right"
            onApply={() => setAppliedUnitCost({ op: draftUnitCostOp, val: draftUnitCostVal })}
            onClear={() => { setAppliedUnitCost({ op: ">", val: "" }); setDraftUnitCostVal(""); }}
          >
            <ThreshInput operator={draftUnitCostOp} value={draftUnitCostVal} onOperatorChange={setDraftUnitCostOp} onValueChange={setDraftUnitCostVal} placeholder="Amount…" />
          </ColFilter>
          <button onClick={() => handleSort("unitCost")} className="text-[9px] text-content/30 hover:text-content/60">{arrow("unitCost")}</button>
        </div>
        <div className={`${thStyle} flex items-center justify-end gap-1.5`}>
          <ColFilter
            label="Case Cost"
            active={!!appliedCaseCost.val}
            align="right"
            onApply={() => setAppliedCaseCost({ op: draftCaseCostOp, val: draftCaseCostVal })}
            onClear={() => { setAppliedCaseCost({ op: ">", val: "" }); setDraftCaseCostVal(""); }}
          >
            <ThreshInput operator={draftCaseCostOp} value={draftCaseCostVal} onOperatorChange={setDraftCaseCostOp} onValueChange={setDraftCaseCostVal} placeholder="Amount…" />
          </ColFilter>
          <button onClick={() => handleSort("caseCost")} className="text-[9px] text-content/30 hover:text-content/60">{arrow("caseCost")}</button>
        </div>
        <div className={`${thStyle} flex items-center justify-end gap-1.5`}>
          <ColFilter
            label="Qty"
            active={!!appliedQty.val}
            align="right"
            onApply={() => setAppliedQty({ op: draftQtyOp, val: draftQtyVal })}
            onClear={() => { setAppliedQty({ op: ">", val: "" }); setDraftQtyVal(""); }}
          >
            <ThreshInput operator={draftQtyOp} value={draftQtyVal} onOperatorChange={setDraftQtyOp} onValueChange={setDraftQtyVal} placeholder="Qty…" />
          </ColFilter>
          <button onClick={() => handleSort("qty")} className="text-[9px] text-content/30 hover:text-content/60">{arrow("qty")}</button>
        </div>
        <div className={`${thStyle} flex items-center justify-end gap-1.5`}>
          <ColFilter
            label="COGS"
            active={!!appliedCogs.val}
            align="right"
            onApply={() => setAppliedCogs({ op: draftCogsOp, val: draftCogsVal })}
            onClear={() => { setAppliedCogs({ op: ">", val: "" }); setDraftCogsVal(""); }}
          >
            <ThreshInput operator={draftCogsOp} value={draftCogsVal} onOperatorChange={setDraftCogsOp} onValueChange={setDraftCogsVal} placeholder="Amount…" />
          </ColFilter>
          <button onClick={() => handleSort("cogs")} className="text-[9px] text-content/30 hover:text-content/60">{arrow("cogs")}</button>
        </div>
      </div>

      {/* Rows */}
      {displayData.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-[11px] text-content/30">
          {sm.subDeptCost.length > 0 ? "No items match filters" : "No cost data"}
        </div>
      ) : (
        displayData.map((item, i) => (
          <div
            key={`${item.product_code}-${i}`}
            className="grid border-b border-gray-100 hover:bg-gray-50 transition-colors"
            style={{
              gridTemplateColumns: COLS,
              background: i % 2 === 1 ? "rgba(30,42,74,0.015)" : undefined,
            }}
            onContextMenuCapture={(e) => handleCtxMenu(e, item)}
          >
            <div className="px-3 py-[9px] text-[11px] font-medium text-content truncate">{item.description}</div>
            <div className="px-3 py-[9px] text-[10px] text-content/50 tabular-nums truncate">{item.product_code}</div>
            <div className="px-3 py-[9px] text-[11px] text-right tabular-nums text-content/70">{formatCurrency2(item.calculated_cost)}</div>
            <div className="px-3 py-[9px] text-[11px] text-right tabular-nums text-content/70">{formatCurrency2(item.cost)}</div>
            <div className="px-3 py-[9px] text-[11px] text-right tabular-nums text-content/70">{formatBigNumber(item.qty, 0)}</div>
            <div className="px-3 py-[9px] text-[11px] text-right tabular-nums font-semibold text-[#1e2a4a]">{formatCurrency2(item.total_cost)}</div>
          </div>
        ))
      )}
    </div>
  );
};

export default SubDeptCostGrid;
