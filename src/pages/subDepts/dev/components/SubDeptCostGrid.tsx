// Hooks
import { useEffect, useState, useMemo } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useSubMarginActions, useSubMarginState } from "../hooks";

// Utils
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import { COLS, inputStyle } from "../utils";

// Interfaces
import type { SubDeptCost } from "../../../../interfaces";
import type { Operator, SortCol } from "../interfaces";

// Components
import UpcContextMenu from "../../../../components-dev/UpcContextMenu";
import ColFilter from "./ColFilter";
import ThreshInput from "./ThreshInput";

const SubDeptCostGrid = () => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const sm = useSubMarginState();

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

/**
 * The number `total_cost` was actually costed on.
 *
 * `calculateCogs` prices a scale item on its weight and everything else on its
 * qty, so this column has to follow the same rule or the row cannot be checked:
 * cost x this = COGS, on every row. Reading `qty` for a weighted item invites
 * the arithmetic that started this — $1.36 x 160 packages = $217.60 against a
 * real $688.19 for 506.03 lb.
 *
 * Rendering, sorting and filtering all go through here so the three cannot
 * disagree about which number the column holds.
 */
const pricedUnits = (d: SubDeptCost) => ((d.weight ?? 0) > 0 ? d.weight! : d.qty);

/** Weighted rows carry a fractional pound count and need the decimals; a ring
 *  count never does. */
const pricedUnitsLabel = (d: SubDeptCost) =>
  (d.weight ?? 0) > 0
    ? `${d.weight!.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lb`
    : formatBigNumber(d.qty, 0);

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
    if (appliedQty.val) data = data.filter((d) => applyThresh(appliedQty.val, appliedQty.op, pricedUnits(d)));
    if (appliedCogs.val) data = data.filter((d) => applyThresh(appliedCogs.val, appliedCogs.op, d.total_cost));

    if (sortCol && sortDir) {
      data.sort((a, b) => {
        let av: number | string, bv: number | string;
        switch (sortCol) {
          case "description": av = a.description; bv = b.description; break;
          case "upc": av = a.product_code; bv = b.product_code; break;
          case "unitCost": av = a.calculated_cost; bv = b.calculated_cost; break;
          case "caseCost": av = a.cost; bv = b.cost; break;
          case "qty": av = pricedUnits(a); bv = pricedUnits(b); break;
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
    if (sortCol !== col || !sortDir) return <span className="text-content"> ↕</span>;
    return <span className="text-brand_navy"> {sortDir === "desc" ? "↓" : "↑"}</span>;
  };

  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; upc: string } | null>(null);
  const openCtxMenu = (e: React.MouseEvent, upc: string) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, upc });
  };
  const allUpcs = useMemo(() => displayData.map((d) => d.product_code), [displayData]);

  const thStyle = "px-3 py-2";

  return (
    <>
    <div
      className="flex-1 min-h-0 overflow-y-auto thin-scrollbar"
      onContextMenu={(e) => openCtxMenu(e, "")}
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
          <button onClick={() => handleSort("unitCost")} className="text-[9px] text-content">{arrow("unitCost")}</button>
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
          <button onClick={() => handleSort("caseCost")} className="text-[9px] text-content">{arrow("caseCost")}</button>
        </div>
        <div className={`${thStyle} flex items-center justify-end gap-1.5`}>
          <ColFilter
            label="Qty / Lb"
            active={!!appliedQty.val}
            align="right"
            onApply={() => setAppliedQty({ op: draftQtyOp, val: draftQtyVal })}
            onClear={() => { setAppliedQty({ op: ">", val: "" }); setDraftQtyVal(""); }}
          >
            <ThreshInput operator={draftQtyOp} value={draftQtyVal} onOperatorChange={setDraftQtyOp} onValueChange={setDraftQtyVal} placeholder="Qty or lb…" />
          </ColFilter>
          <button onClick={() => handleSort("qty")} className="text-[9px] text-content">{arrow("qty")}</button>
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
          <button onClick={() => handleSort("cogs")} className="text-[9px] text-content">{arrow("cogs")}</button>
        </div>
      </div>

      {/* Rows */}
      {displayData.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-[11px] text-content">
          {sm.subDeptCost.length > 0 ? "No items match filters" : "No cost data"}
        </div>
      ) : (
        displayData.map((item, i) => (
          <div
            key={`${item.product_code}-${i}`}
            className="grid border-b border-b-brand_navy/15 hover:bg-gray-50 transition-colors"
            style={{
              gridTemplateColumns: COLS,
              background: i % 2 === 1 ? "rgb(var(--color-brand-navy) / 0.015)" : undefined,
            }}
            onContextMenu={(e) => { e.stopPropagation(); openCtxMenu(e, item.product_code); }}
          >
            <div className="px-3 py-[9px] text-[13px] font-medium text-content truncate">{item.description}</div>
            <div className="px-3 py-[9px] text-[10px] text-content tabular-nums truncate">{item.product_code}</div>
            <div className="px-3 py-[9px] text-[13px] text-right tabular-nums text-content">{formatCurrency2(item.calculated_cost)}</div>
            <div className="px-3 py-[9px] text-[13px] text-right tabular-nums text-content">{formatCurrency2(item.cost)}</div>
            <div className="px-3 py-[9px] text-[13px] text-right tabular-nums text-content">{pricedUnitsLabel(item)}</div>
            <div className="px-3 py-[9px] text-[13px] text-right tabular-nums font-semibold text-brand_navy">{formatCurrency2(item.total_cost)}</div>
          </div>
        ))
      )}
    </div>
    {ctxMenu && (
      <UpcContextMenu
        x={ctxMenu.x}
        y={ctxMenu.y}
        upc={ctxMenu.upc}
        allUpcs={allUpcs}
        onClose={() => setCtxMenu(null)}
      />
    )}
    </>
  );
};

export default SubDeptCostGrid;
