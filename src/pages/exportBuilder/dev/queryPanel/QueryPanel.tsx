// Hooks
import { useState } from "react";
import { useExportBuilderCtx } from "../hooks";
import { useQueryText } from "./hooks";

// Redux
import {
  clearSelections,
  setCurrentQuery,
} from "../../../../features/dev/devExportBuilderSlice";

// Components
import ConfirmDelete from "../../../../components-dev/ConfirmDelete";
import NoKeyNotice from "./components/NoKeyNotice";
import QueryToolbar from "./components/QueryToolbar";
import QueryApplyBar from "./components/QueryApplyBar";
import QueryErrorBox from "./components/QueryErrorBox";
import LeftBehindNote from "./components/LeftBehindNote";
import SaveQueryModal from "./components/SaveQueryModal";
import QueryLibraryModal from "./components/QueryLibraryModal";
import DeletedQueryNote from "./components/DeletedQueryNote";

interface QueryPanelProps {
  configOpen: boolean;
  onToggleConfig: () => void;
}

/**
 * The configuration, as a query, above the file it describes. The box is
 * written from the ticks on the left, and editing it and pressing Apply writes
 * it back. Nothing runs here: the text is parsed in this tab, and the export is
 * still built by the endpoint from the configuration.
 */
const QueryPanel = ({ configOpen, onToggleConfig }: QueryPanelProps) => {
  const ctx = useExportBuilderCtx();
  const {
    text,
    edited,
    setEdited,
    error,
    setError,
    plan,
    setPlan,
    onText,
    revert,
    apply,
    undo,
    onKeyDown,
    openSaved,
  } = useQueryText(ctx);

  /** Which of the two the name box is for: a new row, or renaming the open one. */
  const [saving, setSaving] = useState<"new" | "rename" | false>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [library, setLibrary] = useState<boolean>(false);
  /** What the name box opens with. */
  const [draft, setDraft] = useState<{ name: string; note: string }>({
    name: "",
    note: "",
  });

  const current = ctx.queries.find((q) => q.id === ctx.currentQueryId) ?? null;

  // The table takes duplicates, so Save as new is off when this exact text is
  // already saved, whether open or further down the list.
  const twin = ctx.queries.find((q) => q.sql.trim() === text.trim()) ?? null;
  const somethingNew = text.trim().length > 0 && twin === null;

  const closeCurrent = () => ctx.dispatch(setCurrentQuery(null));

  const onUpdate = () =>
    current &&
    ctx.saveQuery(current.name, text, current.id, current.description ?? "");

  const onSaveNew = () => {
    setDraft({ name: "", note: current?.description ?? "" });
    setSaving("new");
  };

  const onRename = () => {
    if (!current) return;
    setDraft({ name: current.name, note: current.description ?? "" });
    setSaving("rename");
  };

  // The button that opened the box decides it, not the name: Rename changes
  // the open row's name and description; Save as new is always a new row.
  const onSave = (name: string, note: string) => {
    if (saving === "rename" && current) {
      ctx.renameQuery(current.id, name, note);
    } else {
      ctx.saveQuery(name, text, null, note);
    }
    setSaving(false);
  };

  // The configuration was the query's, so its picks go with it.
  const onConfirmDelete = () => {
    if (!current) return;
    ctx.removeQuery(current);
    ctx.dispatch(clearSelections());
    setEdited(false);
    setError(null);
    setPlan(null);
    setDeleting(false);
  };

  return (
    <div
      data-help="query"
      className="flex-shrink-0 bg-card_bg border border-brand_line rounded-xl flex flex-col overflow-hidden"
    >
      {ctx.measureItems.length > 0 && ctx.groupBy.length === 0 && (
        <NoKeyNotice />
      )}

      <QueryToolbar
        configOpen={configOpen}
        onToggleConfig={onToggleConfig}
        current={current}
        edited={edited}
        queryCount={ctx.queries.length}
        somethingNew={somethingNew}
        twin={twin}
        onCloseCurrent={closeCurrent}
        onLibrary={() => setLibrary(true)}
        onUpdate={onUpdate}
        onSaveNew={onSaveNew}
        onRename={onRename}
        onDelete={() => setDeleting(true)}
      />

      {/* Capped: dragged past the window, its corner grip goes with it and
          there is no way left to drag it back. */}
      <textarea
        value={text}
        onChange={(e) => onText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={5}
        spellCheck={false}
        aria-label="The configuration, as a query"
        className="w-full border-0 px-3 py-2 text-[12px] font-mono resize-y bg-card_bg"
        style={{ outline: "none", minHeight: 88, maxHeight: "34vh" }}
      />

      <QueryApplyBar
        edited={edited}
        canUndo={!!ctx.preApply}
        queriesError={ctx.queriesError}
        onApply={apply}
        onRevert={revert}
        onUndo={undo}
      />

      {error && <QueryErrorBox message={error.message} hint={error.hint} />}

      {plan && plan.leftBehind.length > 0 && (
        <LeftBehindNote lines={plan.leftBehind} />
      )}

      {saving && (
        <SaveQueryModal
          mode={saving}
          currentName={current?.name ?? null}
          initialName={draft.name}
          initialNote={draft.note}
          onCancel={() => setSaving(false)}
          onSave={onSave}
        />
      )}

      {library && (
        <QueryLibraryModal
          queries={ctx.queries}
          current={current}
          onCloseCurrent={() => {
            closeCurrent();
            setLibrary(false);
          }}
          onOpen={(id) => {
            openSaved(String(id));
            setLibrary(false);
          }}
          onClose={() => setLibrary(false)}
        />
      )}

      {deleting && current && (
        <ConfirmDelete
          what={current.name}
          kind="saved query"
          detail="The picks it made go back to their defaults, and the range you searched stays. Put it back is offered afterwards if it was a mistake."
          onCancel={() => setDeleting(false)}
          onConfirm={onConfirmDelete}
        />
      )}

      {ctx.deletedQuery && (
        <DeletedQueryNote
          name={ctx.deletedQuery.name}
          onUndo={ctx.undoDeleteQuery}
        />
      )}
    </div>
  );
};

export default QueryPanel;
