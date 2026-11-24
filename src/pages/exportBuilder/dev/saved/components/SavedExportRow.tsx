// Utils
import { savedOn } from "../../utils";

// Interfaces
import type { SavedConfig } from "../../../../../api/savedConfigs";

// Components
import { BookmarkIcon } from "@heroicons/react/24/outline";

interface SavedExportRowProps {
  saved: SavedConfig;
  /** What it holds, in a line. */
  summary: string;
  /** This is the one that is loaded. */
  isCurrent: boolean;
  busy: boolean;
  onLoad: () => void;
  onDelete: () => void;
}

/** One saved export: its name, what it holds and when it was saved, with
 *  Load and Delete. */
const SavedExportRow = ({
  saved,
  summary,
  isCurrent,
  busy,
  onLoad,
  onDelete,
}: SavedExportRowProps) => (
  <div
    className={`flex items-center gap-3 border rounded-xl px-3 py-2.5 ${
      isCurrent
        ? "border-brand_line_2 bg-filter_active"
        : "border-brand_line bg-card_bg"
    }`}
  >
    <div className="w-8 h-8 rounded-lg bg-custom-white border border-brand_line flex items-center justify-center flex-shrink-0">
      <BookmarkIcon className="w-4 h-4 text-content/95" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[13px] font-semibold truncate">{saved.name}</div>
      <div className="text-[11.5px] text-content/95 truncate">{summary}</div>
      <div className="text-[11px] text-content/95 mt-0.5">
        saved {savedOn(saved.updated_at || saved.created_at)}
      </div>
    </div>
    <button
      type="button"
      onClick={onLoad}
      className="bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[12.5px] font-semibold px-4 py-1.5 rounded-lg transition-colors"
    >
      Load
    </button>
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      aria-label={`Delete ${saved.name}`}
      className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors disabled:opacity-40"
    >
      Delete
    </button>
  </div>
);

export default SavedExportRow;
