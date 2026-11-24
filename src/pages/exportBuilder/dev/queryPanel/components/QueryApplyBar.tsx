interface QueryApplyBarProps {
  edited: boolean;
  /** The configuration before the last Apply is held, so Undo can be offered. */
  canUndo: boolean;
  queriesError: string | null;
  onApply: () => void;
  onRevert: () => void;
  onUndo: () => void;
}

/** The bar under the query box: Apply, Discard edits, Undo, the shortcut hint
 *  and any saved-query error. */
const QueryApplyBar = ({
  edited,
  canUndo,
  queriesError,
  onApply,
  onRevert,
  onUndo,
}: QueryApplyBarProps) => (
  <div className="flex items-center gap-2 px-3 py-2 border-t border-brand_line flex-wrap">
    <button
      type="button"
      onClick={onApply}
      disabled={!edited}
      title={
        edited
          ? "Turn this query into the configuration on the left"
          : "This query already matches the configuration — there is nothing to apply"
      }
      className="bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[12.5px] font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      Apply to configuration
    </button>
    {edited && (
      <button
        type="button"
        onClick={onRevert}
        className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
      >
        Discard edits
      </button>
    )}
    {canUndo && (
      <button
        type="button"
        onClick={onUndo}
        title="Put the configuration back the way it was before Apply"
        className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
      >
        Undo
      </button>
    )}
    <span className="text-[13.5px] font-semibold text-content/95">
      {edited ? "Ctrl+Enter applies it" : ""}
    </span>
    {queriesError && (
      <span className="text-[11.5px] text-severity_watch_text">
        {queriesError}
      </span>
    )}
  </div>
);

export default QueryApplyBar;
