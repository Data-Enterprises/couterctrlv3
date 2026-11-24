interface ListFilterStripProps {
  filter: string;
  onFilter: (v: string) => void;
  onAll: () => void;
  onNone: () => void;
  showSelectedOnly: boolean;
  onToggleOnly: () => void;
}

/** Over the item list: a filter box, then All, None and Only. */
const ListFilterStrip = ({
  filter,
  onFilter,
  onAll,
  onNone,
  showSelectedOnly,
  onToggleOnly,
}: ListFilterStripProps) => (
  <div className="flex-shrink-0 px-2 py-1.5 border-b border-line_hair flex items-center gap-1.5">
    <input
      value={filter}
      onChange={(e) => onFilter(e.target.value)}
      placeholder="Filter…"
      className="flex-1 text-[10px] rounded px-2 py-1 border border-line_field bg-fill_soft min-w-0"
      style={{
        outline: "none",
        WebkitAppearance: "none",
        boxShadow: "none",
      }}
    />
    <div className="flex gap-2 flex-shrink-0">
      <button
        onClick={onAll}
        className="text-[10px] text-brand_navy font-medium hover:underline"
      >
        All
      </button>
      <button
        onClick={onNone}
        className="text-[10px] text-brand_navy hover:text-content/85"
      >
        None
      </button>
      {/* Third control in the same strip rather than its own row —
          another bordered row would double the chrome above the list. */}
      <button
        onClick={onToggleOnly}
        className={`text-[10px] font-medium transition-colors ${
          showSelectedOnly ? "text-brand_navy underline" : "text-content/95"
        }`}
      >
        Only
      </button>
    </div>
  </div>
);

export default ListFilterStrip;
