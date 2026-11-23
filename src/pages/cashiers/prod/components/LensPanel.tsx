// Utils
import { LENS_COLUMN_LABEL } from "../utils";

// Interfaces
import type { Signal } from "../interfaces";
import type { ExplorerLens } from "../../../../features/cashiersSlice";

// Components
import TextFilter from "../../../../components/filters/TextFilter";
import LensChips from "./LensChips";
import SignalRow from "./SignalRow";

interface LensPanelProps {
  lens: ExplorerLens;
  onLensChange: (lens: ExplorerLens) => void;
  signals: Signal[];
  selectedKey: string;
  onSelect: (key: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
}

/** The explorer's left list: lens buttons, a search box and the signal rows for the chosen lens, with the picked row highlighted. */
const LensPanel = ({
  lens,
  onLensChange,
  signals,
  selectedKey,
  onSelect,
  search,
  onSearchChange,
}: LensPanelProps) => (
  <div className="w-[42%] flex-shrink-0 flex flex-col min-h-0 border-r border-line_hair">
    <LensChips lens={lens} onLensChange={onLensChange} />

    <div className="p-2 border-b border-line_hair flex-shrink-0">
      <TextFilter
        value={search}
        onChange={onSearchChange}
        placeholder={`Search ${signals.length} ${LENS_COLUMN_LABEL[lens].toLowerCase()} groups…`}
      />
    </div>

    <div className="grid grid-cols-[1fr_auto] px-3 py-1.5 bg-fill_soft text-[9px] cc-caps-strong flex-shrink-0">
      <div>{LENS_COLUMN_LABEL[lens]}</div>
      <div>Lines · transactions</div>
    </div>

    <div className="cc-scroll divide-y divide-brand_navy/15">
      {signals.length === 0 && (
        <div className="flex items-center justify-center py-8 text-[12px] text-content">
          No matches
        </div>
      )}
      {signals.map((s) => (
        <SignalRow
          key={s.key}
          signal={s}
          isSelected={s.key === selectedKey}
          onSelect={() => onSelect(s.key)}
        />
      ))}
    </div>
  </div>
);

export default LensPanel;
