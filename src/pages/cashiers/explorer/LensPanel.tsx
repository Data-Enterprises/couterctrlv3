import type { ExplorerLens } from "../../../features/cashiersSlice";
import { LENSES, type Signal, type SpreadKind } from "./lensUtils";
import { formatCurrency2 } from "../../../utils";
import TextFilter from "../../../components/filters/TextFilter";

interface LensPanelProps {
  lens: ExplorerLens;
  onLensChange: (lens: ExplorerLens) => void;
  signals: Signal[];
  selectedKey: string;
  onSelect: (key: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
}

const LENS_COLUMN_LABEL: Record<ExplorerLens, string> = {
  store: "Store",
  cashier: "Cashier",
  item: "Item",
  terminal: "Terminal",
  hour: "Hour",
};

// A single cashier owning every hit reads as behavior; the same exception
// spread across many reads as an item/lane problem. Colouring only those two
// ends keeps the list from turning into a wall of badges.
const SPREAD_STYLES: Record<SpreadKind, string> = {
  single: "bg-red-50 text-red-700",
  narrow: "bg-red-50 text-red-700",
  wide: "bg-amber-50 text-amber-800",
  unmapped: "bg-amber-50 text-amber-800",
};

const LensPanel = ({
  lens,
  onLensChange,
  signals,
  selectedKey,
  onSelect,
  search,
  onSearchChange,
}: LensPanelProps) => {
  return (
    <div className="w-[42%] flex-shrink-0 flex flex-col min-h-0 border-r border-gray-100">
      <div className="flex gap-1 p-2 border-b border-gray-100 flex-shrink-0">
        {LENSES.map((l) => (
          <button
            key={l.key}
            onClick={() => onLensChange(l.key)}
            className={`text-[11.5px] font-medium px-2.5 py-1 rounded-full transition-colors ${
              lens === l.key
                ? "bg-[#1e2a4a] text-custom-white"
                : "bg-gray-50 text-content hover:bg-gray-100"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="p-2 border-b border-gray-100 flex-shrink-0">
        <TextFilter
          value={search}
          onChange={onSearchChange}
          placeholder={`Search ${signals.length} ${LENS_COLUMN_LABEL[lens].toLowerCase()} groups…`}
        />
      </div>

      <div className="grid grid-cols-[1fr_auto] px-3 py-1.5 bg-gray-50 text-[9px] font-bold uppercase tracking-wide text-content flex-shrink-0">
        <div>{LENS_COLUMN_LABEL[lens]}</div>
        <div>Lines · transactions</div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar divide-y divide-[#1e2a4a]/15">
        {signals.length === 0 && (
          <div className="flex items-center justify-center py-8 text-[12px] text-content">
            No matches
          </div>
        )}
        {signals.map((s) => {
          const isSelected = s.key === selectedKey;
          return (
            <button
              key={s.key}
              onClick={() => onSelect(s.key)}
              className={`w-full text-left px-3 py-2 transition-colors ${
                isSelected ? "bg-blue-50" : "even:bg-row_stripe hover:bg-gray-50"
              }`}
              style={
                isSelected
                  ? { boxShadow: "inset 2px 0 0 #2563eb" }
                  : undefined
              }
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12.5px] font-medium text-content truncate">
                  {s.label}
                </span>
                {/* Two numbers, because they answer different questions: one
                    transaction with 15 voids is not the same story as 15 transactions
                    with one void each. */}
                <span
                  className="text-[12.5px] font-medium text-content flex-shrink-0"
                  title={`${s.count} exception lines across ${s.transactions} transactions`}
                >
                  {s.count}
                  <span className="text-content/70"> · {s.transactions}</span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="text-[10.5px] text-content/70 truncate">
                  {s.sublabel ? `${s.sublabel} · ` : ""}
                  {formatCurrency2(s.amount)}
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${SPREAD_STYLES[s.spread]}`}
                >
                  {s.spreadLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LensPanel;
