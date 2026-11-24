// Hooks
import { useState } from "react";

interface BatchToolbarProps {
  /** Rows on screen, and whether that is the whole selection. */
  shownCount: number;
  isWholeSelection: boolean;
  /** Price or ad days differ from what the search returned. */
  isEdited: boolean;
  hasNotes: boolean;
  onApply: (adDays: string, price: string, notes: string) => void;
  onReset: () => void;
  onClearNotes: () => void;
}

/** The batch setter: ad days, price and a note for every row on screen, with
 *  Apply, Reset and Clear notes. It names how many rows it writes to. */
const BatchToolbar = ({
  shownCount,
  isWholeSelection,
  isEdited,
  hasNotes,
  onApply,
  onReset,
  onClearNotes,
}: BatchToolbarProps) => {
  const [batchAdDays, setBatchAdDays] = useState<string>("");
  const [batchPrice, setBatchPrice] = useState<string>("");
  const [batchNotes, setBatchNotes] = useState<string>("");

  return (
    <div
      data-help="toolbar"
      className="flex items-center gap-1.5 px-3 py-2 bg-fill_soft border-b border-line_hair flex-shrink-0"
    >
      <span className="text-[11px] cc-caps">
        Set for {shownCount}
        {isWholeSelection ? " selected" : " shown"}
      </span>
      <input
        type="number"
        min={1}
        step={1}
        max={7}
        placeholder="Ad days"
        value={batchAdDays}
        onChange={(e) => setBatchAdDays(e.target.value)}
        className="text-[11px] rounded px-2 py-1 border border-line_field bg-custom-white w-20"
        style={{ outline: "none", boxShadow: "none" }}
      />
      <input
        type="number"
        min={0.01}
        step={0.01}
        placeholder="Price"
        value={batchPrice}
        onChange={(e) => setBatchPrice(e.target.value)}
        className="text-[11px] rounded px-2 py-1 border border-line_field bg-custom-white w-20"
        style={{ outline: "none", boxShadow: "none" }}
      />
      <input
        type="text"
        placeholder="Note"
        value={batchNotes}
        onChange={(e) => setBatchNotes(e.target.value)}
        className="text-[11px] rounded px-2 py-1 border border-line_field bg-custom-white w-32"
        style={{ outline: "none", boxShadow: "none" }}
      />
      <button
        onClick={() => onApply(batchAdDays, batchPrice, batchNotes)}
        disabled={
          !shownCount || (!batchAdDays && !batchPrice && !batchNotes.trim())
        }
        className="text-[11px] font-semibold px-2.5 py-1 rounded bg-brand_navy text-custom-white hover:bg-brand_navy_hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Apply
      </button>
      {/* Undoes price and ad days on the same rows Apply writes to, back to
          what the search returned. Notes survive it — see the reducer. */}
      <button
        onClick={() => {
          onReset();
          setBatchAdDays("");
          setBatchPrice("");
        }}
        disabled={!isEdited}
        title="Put price and ad days back to what the search returned"
        className="text-[11px] font-semibold px-2.5 py-1 rounded border border-line_field text-content hover:bg-fill_muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Reset
      </button>
      {/* Notes are outside Reset (authored text shouldn't vanish with a
          price undo); clearing them is its own action. */}
      <button
        onClick={() => {
          onClearNotes();
          setBatchNotes("");
        }}
        disabled={!hasNotes}
        title="Remove the note from every selected row"
        className="text-[11px] font-semibold px-2.5 py-1 rounded border border-line_field text-content hover:bg-fill_muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Clear notes
      </button>
      <span className="text-[10.5px] text-content/95 ml-auto">
        Double-click a row for the calculator
      </span>
    </div>
  );
};

export default BatchToolbar;
