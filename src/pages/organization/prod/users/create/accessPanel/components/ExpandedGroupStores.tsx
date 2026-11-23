// Interfaces
import type { AccessPicks, SelectableStore } from "../../../interfaces";
import type { CompanyBaseGroup, Store } from "../../../../../../../interfaces";

// Components
import Checkbox from "../../../../../../../components/Checkbox";
import GrantModeChip from "../../components/GrantModeChip";

interface ExpandedGroupStoresProps {
  group: CompanyBaseGroup;
  /** The person holds this group, ticked or implied by a picked store. */
  held: boolean;
  /** The person's access type: By group draws a read-only preview. */
  mode: AccessPicks["mode"];
  /** The stores picked in this group. */
  inGroup: SelectableStore[];
  /** The group's roster, undefined while it loads. */
  roster: Store[] | undefined;
  storeSearch: string;
  collapsed: boolean;
  /** This user may give or take the group. */
  canChange: boolean;
  singleStoreOnly: boolean;
  onToggleCollapse: () => void;
  onToggleStore: (store: Store) => void;
  onSelectAll: () => void;
}

/** One open group in the stores column: its header (name, how many are picked,
 *  Select all) over its stores, each with a pick box; a read-only list when the
 *  person is given whole groups. */
const ExpandedGroupStores = ({
  group,
  held,
  mode,
  inGroup,
  roster,
  storeSearch,
  collapsed,
  canChange,
  singleStoreOnly,
  onToggleCollapse,
  onToggleStore,
  onSelectAll,
}: ExpandedGroupStoresProps) => {
  // By group: no store is picked one at a time, so no checkboxes; a held group
  // shows all ticked, one opened to look a plain list.
  const preview = mode === "all";
  const total = roster?.length;
  const stores = (roster ?? []).filter((s) =>
    s.store_name.toLowerCase().includes(storeSearch.toLowerCase()),
  );

  return (
    <div id={`assignments-group-${group.id}`}>
      <button
        onClick={onToggleCollapse}
        className="cc-thead w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left hover:bg-fill_muted transition-colors"
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <span
            className={`text-[10px] text-content/95 flex-shrink-0 transition-transform ${
              collapsed ? "" : "rotate-90"
            }`}
          >
            ▶
          </span>
          <span className="text-[11px] font-semibold text-content truncate">
            {group.name}
            {preview
              ? total !== undefined
                ? held
                  ? ` — all ${total}`
                  : ` — ${total} store${total === 1 ? "" : "s"}`
                : ""
              : ` — ${inGroup.length}${
                  total !== undefined ? ` of ${total}` : ""
                }`}
          </span>
          {held && <GrantModeChip mode={mode} />}
        </span>
        {/* No Select all on a preview: there is nothing to select, and the
            whole group is already the answer. */}
        {!preview && !singleStoreOnly && canChange && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onSelectAll();
            }}
            className="text-[10.5px] text-brand_navy font-semibold flex-shrink-0 hover:underline"
          >
            Select all
          </span>
        )}
      </button>
      {!collapsed && (
        <div className="px-2 divide-y divide-brand_navy/15">
          {preview && (
            <p className="text-[10.5px] text-content/95 leading-snug px-1 py-1.5">
              {held
                ? "Read only — this person has the whole group. Stores added to it later will appear for them automatically."
                : "Viewing only. Tick the group to give them every store in it, or choose By store on the Access type step to pick stores one at a time."}
            </p>
          )}
          {stores.map((s) => {
            const isSelected = inGroup.some((sel) => sel.storeid === s.storeid);
            return preview ? (
              // Held: ticked and disabled, since every store is included. Not
              // held: no box, nothing to tick.
              <div
                key={s.storeid}
                className="flex items-center gap-2 py-1.5 px-1 text-[12px] text-content/95"
              >
                {held && (
                  <Checkbox
                    checked
                    disabled
                    onChange={() => undefined}
                    ariaLabel={`${s.store_name} is included automatically`}
                  />
                )}
                <span className="tabular-nums font-semibold w-[42px] flex-shrink-0">
                  {s.store_number}
                </span>
                <span className="truncate">{s.store_name}</span>
              </div>
            ) : (
              <div
                key={s.storeid}
                className="flex items-center gap-2 py-1.5 px-1 text-[12px] text-content"
              >
                <Checkbox
                  checked={isSelected}
                  disabled={!canChange}
                  onChange={() => onToggleStore(s)}
                  ariaLabel={`Pick ${s.store_name}`}
                />
                <span className="tabular-nums font-semibold w-[42px] flex-shrink-0">
                  {s.store_number}
                </span>
                <span className="truncate">{s.store_name}</span>
              </div>
            );
          })}
          {roster === undefined && (
            <div className="py-3 text-[11px] text-content/95 text-center">
              Loading…
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpandedGroupStores;
