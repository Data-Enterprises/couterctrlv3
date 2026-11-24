// Utils
import { NAVY_OUTLINE_BTN, SHOW_SQL_BUTTON } from "../utils";

interface ExportActionsProps {
  /** This session's builds, for the Previous builds button. */
  buildCount: number;
  /** Why the export cannot run, or null. */
  blocked: string | null;
  loadingSql: boolean;
  onBuilds: () => void;
  onSaved: () => void;
  onShowSql: () => void;
  onBuild: () => void;
}

/** The bar's buttons: Previous builds, Saved, Show SQL (hidden for now) and
 *  Build export, with the reason it is off right under it. */
const ExportActions = ({
  buildCount,
  blocked,
  loadingSql,
  onBuilds,
  onSaved,
  onShowSql,
  onBuild,
}: ExportActionsProps) => (
  <>
    {buildCount > 0 && (
      <button type="button" onClick={onBuilds} className={NAVY_OUTLINE_BTN}>
        Previous builds ({buildCount})
      </button>
    )}
    <button type="button" onClick={onSaved} className={NAVY_OUTLINE_BTN}>
      Saved
    </button>
    {SHOW_SQL_BUTTON && (
      <button
        type="button"
        onClick={onShowSql}
        disabled={blocked !== null || loadingSql}
        className={`${NAVY_OUTLINE_BTN} disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {loadingSql ? "Reading..." : "Show SQL"}
      </button>
    )}
    {/* The reason sits with the button: a greyed button with its explanation
        elsewhere is a button nobody knows how to un-grey. */}
    <div className="flex flex-col items-end gap-1 flex-shrink-0">
      <button
        type="button"
        onClick={onBuild}
        disabled={blocked !== null}
        title={blocked ?? undefined}
        className="bg-custom-white text-brand_navy text-[13px] font-semibold px-5 py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Build export
      </button>
      {blocked && (
        <span className="text-[11px] text-severity_watch_bg text-right max-w-[34ch]">
          {blocked}
        </span>
      )}
    </div>
  </>
);

export default ExportActions;
