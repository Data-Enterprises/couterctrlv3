interface CpnStoreFilterProps {
  stores: { name: string; number: string }[];
  selected: Set<string>;
  onToggle: (number: string) => void;
  onAll: () => void;
  onNone: () => void;
}

/** The phone export's store checklist for multi-store data, with All and None. */
const CpnStoreFilter = ({
  stores,
  selected,
  onToggle,
  onAll,
  onNone,
}: CpnStoreFilterProps) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <div className="text-[10px] cc-caps">Stores</div>
      <div className="flex items-center gap-2">
        <button
          onClick={onAll}
          disabled={selected.size === stores.length}
          className="text-[10px] text-brand_navy disabled:text-content/40 transition-colors"
        >
          All
        </button>
        <span className="text-[10px] text-content/95">·</span>
        <button
          onClick={onNone}
          disabled={selected.size === 0}
          className="text-[10px] text-brand_navy disabled:text-content/40 transition-colors"
        >
          None
        </button>
      </div>
    </div>
    <div className="space-y-2.5 max-h-36 overflow-y-auto thin-scrollbar pr-1">
      {stores.map((s) => (
        <label key={s.number} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected.has(s.number)}
            onChange={() => onToggle(s.number)}
            className="cc-checkbox flex-shrink-0"
          />
          <span className="text-[12px] text-content truncate flex-1">
            {s.name}
          </span>
          <span className="text-[10px] text-content/95 flex-shrink-0">
            #{s.number}
          </span>
        </label>
      ))}
    </div>
  </div>
);

export default CpnStoreFilter;
