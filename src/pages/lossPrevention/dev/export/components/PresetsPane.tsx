// Utils
import { SEVERITY_CHIPS } from "../utils";

// Interfaces
import type { Dispatch, SetStateAction } from "react";
import type { CashierSeverity } from "../../interfaces";
import type { ExportDataset } from "../interfaces";

interface PresetsPaneProps {
  transactionCount: number;
  cashierCount: number;
  selected: Set<ExportDataset>;
  setSelected: Dispatch<SetStateAction<Set<ExportDataset>>>;
  cashierSevs: Set<CashierSeverity>;
  setCashierSevs: Dispatch<SetStateAction<Set<CashierSeverity>>>;
  toggleCashierSev: (sev: CashierSeverity) => void;
}

/** Presets mode: the transaction list in view, and the cashier summary with
 *  the severities to include. Ticking the summary turns every severity on. */
const PresetsPane = ({
  transactionCount,
  cashierCount,
  selected,
  setSelected,
  cashierSevs,
  setCashierSevs,
  toggleCashierSev,
}: PresetsPaneProps) => (
  <div className="px-4 pt-4 pb-2 space-y-3">
    <p className="text-[11px] text-content/95 uppercase tracking-wide font-medium">
      Select data to include
    </p>

    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={selected.has("transactions")}
        onChange={() =>
          setSelected((p) => {
            const n = new Set(p);
            n.has("transactions")
              ? n.delete("transactions")
              : n.add("transactions");
            return n;
          })
        }
        className="mt-0.5 cc-checkbox border-line_strong cursor-pointer flex-shrink-0"
      />
      <div>
        <p className="text-[13px] cc-row-title">Transaction List</p>
        <p className="text-[11px] text-content/95 mt-0.5">
          {transactionCount} transactions currently in view (filters applied)
        </p>
      </div>
    </label>

    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={selected.has("cashiers")}
        onChange={() => {
          const checking = !selected.has("cashiers");
          if (checking) {
            if (cashierSevs.size === 0)
              setCashierSevs(new Set(["critical", "watch", "ok", "ungraded"]));
          } else {
            setCashierSevs(new Set());
          }
          setSelected((p) => {
            const n = new Set(p);
            checking ? n.add("cashiers") : n.delete("cashiers");
            return n;
          });
        }}
        className="mt-0.5 cc-checkbox border-line_strong cursor-pointer flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-content">Cashier Summary</p>
        <p className="text-[11px] text-content/95 mt-0.5 mb-1.5">
          {cashierCount} cashiers with severity, totals, and avg ticket
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {SEVERITY_CHIPS.map(({ sev, label, activeClass }) => (
            <button
              key={sev}
              onClick={() => toggleCashierSev(sev)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                cashierSevs.has(sev)
                  ? activeClass
                  : "bg-custom-white border-line_field text-content/95"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default PresetsPane;
