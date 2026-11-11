// Interfaces
import type { StoreWithGroupStatus } from "../../../../interfaces";

// Components
import TextFilter from "../../../../components-dev/filters/TextFilter";

interface StoreColumnProps {
  kind: "unassigned" | "assigned";
  readOnly: boolean;
  pending: Set<number>;
  filter: string;
  setFilter: (value: string) => void;
  stores: StoreWithGroupStatus[];
  handleToggle: (storeid: number, type: "unassigned" | "assigned") => void;
}

/** One column of stores in a group's detail, searchable and counted: Unassigned (+ adds a store) or Assigned (− removes it). Buttons are hidden when read-only. */
const StoreColumn = ({
  kind,
  readOnly,
  filter,
  setFilter,
  pending,
  stores,
  handleToggle,
}: StoreColumnProps) => {
  const title = kind === "unassigned" ? "Unassigned" : "Assigned";
  const placeHolder = `Search ${title.toLowerCase()}…`;
  const adds = kind === "unassigned";

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0">
      <div className="mb-1.5">
        <TextFilter
          value={filter}
          onChange={setFilter}
          placeholder={placeHolder}
        />
      </div>
      <div className="px-2.5 py-1.5 text-[9px] cc-caps-strong bg-fill_soft">
        {title} ({stores.length})
      </div>
      <div className="cc-scroll border border-t-0 border-line_hair">
        {stores.map((s) => (
          <div
            key={s.storeid}
            className={`flex items-center justify-between gap-2 px-2.5 py-2 text-[12px] text-content border-b border-line_hair ${
              pending.has(s.storeid) ? "opacity-40" : ""
            }`}
          >
            <span className="truncate">{s.store_name}</span>
            {!readOnly && (
              <button
                onClick={() => handleToggle(s.storeid, kind)}
                disabled={pending.has(s.storeid)}
                className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded text-[13px] font-semibold ${
                  adds ? "text-brand_navy" : "text-brand_danger"
                } border border-line_field hover:bg-fill_soft disabled:cursor-not-allowed transition-colors`}
              >
                {adds ? "+" : "−"}
              </button>
            )}
          </div>
        ))}
        {stores.length === 0 && (
          <div className="flex items-center justify-center py-8 text-[12px] text-content">
            No stores found
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreColumn;
