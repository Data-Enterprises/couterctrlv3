// Hooks
import { useTop200View } from "../../hooks";

// Utils
import { LANDING_COLS } from "../../utils";

// Interfaces
import type { DeptRollup } from "../../utils/topItems";

// Components
import DeptShareRow from "./DeptShareRow";

interface DeptShareListProps {
  landing: { shown: DeptRollup[]; top: number; total: number };
}

/** The landing's sub departments, biggest first; a row narrows the list to it. */
const DeptShareList = ({ landing }: DeptShareListProps) => {
  const { dept, setDept } = useTop200View();

  return (
    <>
      <div
        className="grid items-end gap-2 px-3 py-1.5 border-b border-line_hair flex-shrink-0 text-[11px] font-bold uppercase tracking-wide text-content/95"
        style={{ gridTemplateColumns: LANDING_COLS }}
      >
        <span>Sub dept</span>
        <span>Share of top 200</span>
        <span className="text-right">Sales</span>
      </div>

      <div className="cc-scroll">
        {landing.shown.map((d) => (
          <DeptShareRow
            key={d.name}
            dept={d}
            selected={dept === d.name}
            pct={landing.top > 0 ? (d.ty / landing.total) * 100 : 0}
            bar={landing.top > 0 ? Math.max(2, (d.ty / landing.top) * 100) : 0}
            onToggle={() => setDept(dept === d.name ? "" : d.name)}
          />
        ))}

        {landing.shown.length === 0 && (
          <div className="flex items-center justify-center py-8 text-[12px] text-content">
            No departments
          </div>
        )}
      </div>

      <p className="flex-shrink-0 px-3 py-1.5 border-t border-line_hair text-[12px] leading-snug text-content/95">
        Click a sub department to see its items.
      </p>
    </>
  );
};

export default DeptShareList;
