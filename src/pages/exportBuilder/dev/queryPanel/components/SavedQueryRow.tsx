// Utils
import { savedOn } from "../utils";

// Interfaces
import type { SavedQuery } from "../../../../../api/savedQueries";

interface SavedQueryRowProps {
  query: SavedQuery;
  /** This is the query that is open. */
  open: boolean;
  onOpen: () => void;
}

/** One saved query in the list: its name, description and date; clicking it
 *  opens it, which applies it to the configuration. */
const SavedQueryRow = ({ query, open, onOpen }: SavedQueryRowProps) => (
  <button
    type="button"
    onClick={onOpen}
    className={`text-left border rounded-lg px-3 py-2 transition-colors ${
      open
        ? "border-brand_line_2 bg-filter_active"
        : "border-brand_line bg-custom-white hover:border-brand_slate"
    }`}
  >
    <span className="block text-[13px] font-semibold">{query.name}</span>
    {query.description && (
      <span className="block text-[11.5px] text-content/95 mt-0.5">
        {query.description}
      </span>
    )}
    <span className="block text-[11px] text-content/95 mt-0.5">
      saved {savedOn(query.updated_at || query.created_at)}
    </span>
  </button>
);

export default SavedQueryRow;
