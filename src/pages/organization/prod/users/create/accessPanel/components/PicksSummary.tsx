// Interfaces
import type { AccessPicks, SelectableStore } from "../../../interfaces";
import type {
  BaseGroup,
  CompanyBaseGroup,
} from "../../../../../../../interfaces";

interface PicksSummaryProps {
  /** Groups held, ticked or implied by a picked store. */
  held: number[];
  selectedStores: SelectableStore[];
  mode: AccessPicks["mode"];
  /** Every group loaded so far, by id, to name the held ones. */
  groupsById: Record<number, CompanyBaseGroup>;
  /** Edit: the groups the person holds, named before their company opens. */
  heldGroups: BaseGroup[];
  companyName: (id: number) => string;
  onClearAll: () => void;
}

/** The strip under the panel: how many groups and stores are picked, Clear
 *  all, and each held group by company and name with its store count. */
const PicksSummary = ({
  held,
  selectedStores,
  mode,
  groupsById,
  heldGroups,
  companyName,
  onClearAll,
}: PicksSummaryProps) => (
  <div className="bg-bkg rounded-lg px-3 py-2.5 mt-3 shadow-card-sm">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[12px] font-semibold text-content">
        {/* No company tally: a held group carries its own company. */}
        {held.length} base group
        {held.length === 1 ? "" : "s"}, {selectedStores.length} store
        {selectedStores.length === 1 ? "" : "s"} picked
      </span>
      <button
        onClick={onClearAll}
        className="text-[10.5px] text-brand_navy font-semibold hover:underline"
      >
        Clear all
      </button>
    </div>
    {held.length === 0 ? (
      <div className="text-[11.5px] text-content/95">Nothing selected yet</div>
    ) : (
      <div className="text-[11.5px] text-content/95 leading-relaxed max-h-[60px] overflow-y-auto thin-scrollbar">
        {held.map((id, i) => {
          const group = groupsById[id] ?? heldGroups.find((g) => g.id === id);
          const count = selectedStores.filter(
            (s) => s.base_group === id,
          ).length;
          return (
            <span key={id}>
              {i > 0 && "; "}
              {companyName(group?.company ?? 0)}: {group?.name ?? `#${id}`}{" "}
              {mode === "all" ? "(all)" : `(${count})`}
            </span>
          );
        })}
      </div>
    )}
  </div>
);

export default PicksSummary;
