// Utils
import { QUERY_ACTION } from "../utils";

// Interfaces
import type { SavedQuery } from "../../../../../api/savedQueries";

// Components
import { ChevronLeftIcon } from "@heroicons/react/20/solid";

interface QueryToolbarProps {
  configOpen: boolean;
  onToggleConfig: () => void;
  /** The saved query that is open, if any. */
  current: SavedQuery | null;
  edited: boolean;
  queryCount: number;
  /** There is text to save that is not saved already. */
  somethingNew: boolean;
  /** A saved query with exactly this text, if one exists. */
  twin: SavedQuery | null;
  onCloseCurrent: () => void;
  onLibrary: () => void;
  onUpdate: () => void;
  onSaveNew: () => void;
  onRename: () => void;
  onDelete: () => void;
}

/** The query box's title row: the configuration toggle, the open query's chip,
 *  the edited badge, and Queries, Update, Save as new, Rename and Delete. */
const QueryToolbar = ({
  configOpen,
  onToggleConfig,
  current,
  edited,
  queryCount,
  somethingNew,
  twin,
  onCloseCurrent,
  onLibrary,
  onUpdate,
  onSaveNew,
  onRename,
  onDelete,
}: QueryToolbarProps) => (
  <div className="flex items-center gap-2 px-3 py-2 bg-custom-white border-b border-brand_line flex-wrap">
    {/* Here rather than on the panel itself: a control that hides something
        cannot live inside the thing it hides. */}
    <button
      type="button"
      onClick={onToggleConfig}
      aria-expanded={configOpen}
      title={configOpen ? "Hide the configuration" : "Show the configuration"}
      className="flex-shrink-0 w-[22px] h-[22px] flex items-center justify-center rounded border border-brand_line_2 text-content/95 hover:border-brand_slate transition-colors"
    >
      <ChevronLeftIcon
        className={`w-3.5 h-3.5 transition-transform duration-300 motion-reduce:transition-none ${
          configOpen ? "" : "rotate-180"
        }`}
      />
    </button>
    <span className="text-[11px] cc-caps">The configuration, as a query</span>
    {current && (
      <span className="flex items-center gap-1 text-[11.5px] font-semibold bg-filter_active border border-brand_line_2 rounded pl-1.5 pr-0.5 py-0.5">
        <span className="max-w-[24ch] truncate">{current.name}</span>
        <button
          type="button"
          onClick={onCloseCurrent}
          aria-label={`Close ${current.name}`}
          title="Close this query — the box and the configuration stay as they are"
          className="w-[16px] h-[16px] rounded cc-muted-link"
        >
          ×
        </button>
      </span>
    )}
    {edited ? (
      <span className="text-[11px] text-severity_watch_text bg-severity_watch_bg border border-severity_watch_text/20 rounded px-1.5 py-0.5">
        Edited — the file below is still the configuration's
      </span>
    ) : null}
    <div className="flex-1" />

    {/* The four things you can do to a saved query, always here so the row
        does not change shape; the ones that need a query open are off rather
        than gone. */}
    <button type="button" onClick={onLibrary} className={QUERY_ACTION}>
      Queries ({queryCount})
    </button>
    <button
      type="button"
      onClick={onUpdate}
      disabled={!current}
      title={
        current
          ? `Replace "${current.name}" with what is in the box`
          : "Open a saved query first, or use Save as new"
      }
      className={QUERY_ACTION}
    >
      Update
    </button>
    <button
      type="button"
      onClick={onSaveNew}
      disabled={!somethingNew}
      title={
        somethingNew
          ? "Keep this as another saved query"
          : twin
            ? `This is already saved as "${twin.name}"`
            : "Nothing to save yet"
      }
      className={QUERY_ACTION}
    >
      Save as new
    </button>
    <button
      type="button"
      onClick={onRename}
      disabled={!current}
      title={current ? undefined : "Nothing open to rename"}
      className={QUERY_ACTION}
    >
      Rename
    </button>
    <button
      type="button"
      onClick={onDelete}
      disabled={!current}
      title={current ? undefined : "Nothing open to delete"}
      className={QUERY_ACTION}
    >
      Delete
    </button>
  </div>
);

export default QueryToolbar;
