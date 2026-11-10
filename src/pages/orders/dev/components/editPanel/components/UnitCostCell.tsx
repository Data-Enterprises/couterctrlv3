// Utils
import { perCase, unitCostOf } from "../../../utils/orderEdit";

// Interfaces
import type { DraftLine } from "../../../interfaces";

interface UnitCostCellProps {
  line: DraftLine;
  tint: string;
  resetNonce: number;
  disabled: boolean;
  onUnitCost: (lineNumber: number, unit: number) => void;
}

/**
 * Unit cost — typed here, stored as the case cost it implies.
 *
 * Money, so two decimals like every other price on the row. What is stored is
 * the case cost the typed unit implies, so a unit of $2.19 on a case of 12 is
 * a case of $26.28 — the case column shows exactly what will be sent.
 *
 * A line with no case size has nothing to divide by, so unit and case are the
 * same number — it is still typable, it just writes the same value through.
 */
const UnitCostCell = ({ line, tint, resetNonce, disabled, onUnitCost }: UnitCostCellProps) => {
  const original = line.original;
  const changed = original !== null && line.base_cost !== original.base_cost;
  const value = unitCostOf(line).toFixed(2);
  const wasUnit =
    original === null
      ? null
      : (original.base_cost ?? 0) / perCase(line);

  return (
    <td
      className={`px-2 py-1 align-top border-r border-brand_line ${tint || "bg-severity_watch_bg/[0.18]"}`}
    >
      <input
        key={`${line.line_number}-unit_cost-${resetNonce}`}
        type="number"
        min={0}
        step={0.01}
        defaultValue={value}
        disabled={disabled}
        aria-label={`Unit cost on line ${line.line_number}`}
        title={
          line.casesize > 0
            ? `Case of ${line.casesize}`
            : "No case size — unit and case cost are the same"
        }
        onChange={(e) => {
          const next = e.target.value === "" ? 0 : Number(e.target.value);
          if (!Number.isFinite(next) || next < 0) return;
          onUnitCost(line.line_number, next);
        }}
        className={`w-full rounded-[5px] border px-1.5 py-0.5 text-right tabular-nums text-[11px] transition-colors disabled:border-transparent disabled:bg-transparent disabled:text-content ${
          changed
            ? "border-severity_watch_text bg-custom-white font-bold text-severity_watch_text"
            : "border-brand_line_2 bg-custom-white text-content hover:border-severity_watch_text/60"
        }`}
        style={{ outline: "none" }}
      />
      <span className="block h-[11px] text-right text-[9px] leading-[11px] tabular-nums text-severity_watch_text overflow-hidden">
        {changed && wasUnit !== null ? `was ${wasUnit.toFixed(2)}` : ""}
      </span>
    </td>
  );
};

export default UnitCostCell;
