interface StoreFilterProps {
  stores: { name: string; number: string }[];
  selected: Set<string>;
  onToggle: (number: string) => void;
  onAll: () => void;
  onNone: () => void;
}

/** The export's store checklist for multi-store data, with All and None. */
const StoreFilter = ({
  stores,
  selected,
  onToggle,
  onAll,
  onNone,
}: StoreFilterProps) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] cc-caps">Stores</p>
      <div className="flex gap-1.5">
        <button
          onClick={onAll}
          disabled={selected.size === stores.length}
          className="text-[9px] text-brand_navy/95 hover:text-brand_navy disabled:opacity-30 transition-colors"
        >
          All
        </button>
        <span className="text-[9px] text-content/95">·</span>
        <button
          onClick={onNone}
          disabled={selected.size === 0}
          className="text-[9px] text-brand_navy/95 hover:text-brand_navy disabled:opacity-30 transition-colors"
        >
          None
        </button>
      </div>
    </div>
    <div className="space-y-1.5 max-h-36 overflow-y-auto thin-scrollbar pr-1">
      {stores.map((s) => (
        <label
          key={s.number}
          className="flex items-center gap-2 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={selected.has(s.number)}
            onChange={() => onToggle(s.number)}
            className="cc-checkbox flex-shrink-0"
          />
          <span className="text-[12px] text-content truncate">{s.name}</span>
          <span className="text-[10px] text-content/95 flex-shrink-0">
            #{s.number}
          </span>
        </label>
      ))}
    </div>
  </div>
);

export default StoreFilter;
