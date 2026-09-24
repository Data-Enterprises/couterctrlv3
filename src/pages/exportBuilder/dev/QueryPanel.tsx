import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "../../../components-dev/Modal";
import ConfirmDelete from "../../../components-dev/ConfirmDelete";
import TextField from "../../../components-dev/inputs/TextField";
import { useExportBuilderCtx } from "./hooks";
import {
  forgetPreApply,
  rememberBeforeApply,
  setCurrentQuery,
  undoApply,
} from "../../../features/dev/devExportBuilderSlice";
import { parseQuery, QueryError, type Query } from "./query/parseQuery";
import { planApply, type ApplyPlan } from "./query/applyQuery";
import { configToQuery } from "./query/configToQuery";

/**
 * The configuration, as a query, above the file it describes.
 *
 * One view rather than two: the box is written from the ticks on the left, so
 * picking a vendor grows a line in the WHERE, and editing the box and pressing
 * Apply writes it back the other way. Nothing here runs anywhere — the text is
 * parsed in this tab, and the export is still built by the endpoint from the
 * configuration, from values it validates.
 *
 * While the text matches the configuration it is a description of it. The
 * moment someone types, it stops being that and says so: the file below is
 * still the configuration's until Apply makes the two one thing again.
 */
const QueryPanel = () => {
  const ctx = useExportBuilderCtx();

  const generated = useMemo(
    () =>
      configToQuery(
        ctx.config,
        ctx.aggregating,
        ctx.measureItems,
        ctx.orderedColumns.map((c) => c.name),
      ),
    [ctx.config, ctx.aggregating, ctx.measureItems, ctx.orderedColumns],
  );

  const [text, setText] = useState(generated);
  const [edited, setEdited] = useState(false);
  const [error, setError] = useState<{ message: string; hint?: string } | null>(
    null,
  );
  const [plan, setPlan] = useState<ApplyPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [library, setLibrary] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  /**
   * An apply is over the moment the configuration moves again.
   *
   * What it did, and the offer to take it back, both describe one moment. A
   * tick on the left is a new one: the report would then be describing
   * something that is no longer true, and Undo would quietly throw away that
   * tick along with the apply, since the snapshot it holds predates both.
   */
  const justApplied = useRef(false);

  // Untouched, the box follows the ticks. Touched, it is the person's until
  // they apply it or drop it.
  const last = useRef(generated);
  useEffect(() => {
    if (generated === last.current) return;
    last.current = generated;
    if (!edited) setText(generated);

    // The apply's own change to the configuration is not someone moving on
    // from it.
    if (justApplied.current) {
      justApplied.current = false;
      return;
    }
    setPlan(null);
    if (ctx.preApply) ctx.dispatch(forgetPreApply());
  }, [generated, edited, ctx]);

  /**
   * A configuration replaced wholesale wins over an edit in progress.
   *
   * Loading a saved one, reloading a build or undoing an apply all put a
   * different configuration on screen; half-typed text describing the last
   * one is not worth keeping over it.
   */
  const stamp = useRef(ctx.configStamp);
  useEffect(() => {
    if (ctx.configStamp === stamp.current) return;
    stamp.current = ctx.configStamp;
    setText(generated);
    setEdited(false);
    setError(null);
    setPlan(null);
  }, [ctx.configStamp, generated]);

  const onText = (value: string) => {
    setText(value);
    setEdited(value !== generated);
    setPlan(null);
  };

  const revert = () => {
    setText(generated);
    setEdited(false);
    setError(null);
    setPlan(null);
    ctx.dispatch(setCurrentQuery(null));
  };

  const apply = () => {
    try {
      const parsed: Query = parseQuery(text);
      ctx.dispatch(rememberBeforeApply());
      const next = planApply(parsed, ctx.config);
      justApplied.current = true;
      next.actions.forEach((action) => ctx.dispatch(action));
      setPlan(next);
      setError(null);
      setEdited(false);
    } catch (e) {
      setPlan(null);
      setError(
        e instanceof QueryError
          ? { message: e.message, hint: e.hint }
          : { message: e instanceof Error ? e.message : "That did not parse." },
      );
    }
  };

  const undo = () => {
    ctx.dispatch(undoApply());
    setPlan(null);
  };

  /** Ctrl/Cmd+Enter applies, which is the only thing to do with it here. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      apply();
    }
  };

  const openSaved = (id: string) => {
    const query = ctx.queries.find((q) => String(q.id) === id);
    if (!query) return;
    setText(query.sql);
    setEdited(query.sql !== generated);
    setError(null);
    setPlan(null);
    ctx.dispatch(setCurrentQuery(query.id));
  };

  const current = ctx.queries.find((q) => q.id === ctx.currentQueryId) ?? null;

  /**
   * Something to save that is not saved already.
   *
   * The table takes duplicates happily, so this is what stops Save as new
   * from quietly making a second copy of a query nobody changed — whether it
   * is the one that is open or one further down the list. Editing the box or
   * changing a tick on the left both count as changing it, because both
   * change what the box says.
   */
  const twin = ctx.queries.find((q) => q.sql.trim() === text.trim()) ?? null;
  const somethingNew = text.trim().length > 0 && twin === null;

  /** One look for the whole row, so none of them reads as the odd one. */
  const action =
    "text-[11.5px] font-semibold px-2.5 py-1 rounded border border-brand_line_2 hover:border-brand_slate transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  const when = (iso: string) => {
    const at = new Date(iso);
    return Number.isNaN(at.getTime())
      ? ""
      : at.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="flex-shrink-0 bg-card_bg border border-brand_line rounded-xl flex flex-col overflow-hidden">
      {ctx.measureItems.length > 0 && ctx.groupBy.length === 0 && (
        <div className="bg-amber-100 border-b border-amber-300 px-3 py-2">
          <span className="text-[12.5px] font-semibold text-amber-900">
            This summary has no key to group by.
          </span>{" "}
          <span className="text-[12.5px] text-amber-900/85">
            Measures need rows to sit in, so the export refuses a summary
            without at least one. Pick one under <strong>Group By</strong> on
            the left — storeid for one row per store, product_code for one per
            item.
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2 bg-custom-white border-b border-brand_line flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-content/85">
          The configuration, as a query
        </span>
        {current && (
          <span className="flex items-center gap-1 text-[11.5px] font-semibold bg-filter_active border border-brand_line_2 rounded pl-1.5 pr-0.5 py-0.5">
            <span className="max-w-[24ch] truncate">{current.name}</span>
            <button
              type="button"
              onClick={() => ctx.dispatch(setCurrentQuery(null))}
              aria-label={`Close ${current.name}`}
              title="Close this query — the box and the configuration stay as they are"
              className="w-[16px] h-[16px] rounded text-content/85 hover:text-content transition-colors"
            >
              ×
            </button>
          </span>
        )}
        {edited ? (
          <span className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
            Edited — the file below is still the configuration's
          </span>
        ) : (
          <span className="text-[11px] text-content/85">
            follows the panel on the left · runs nowhere
          </span>
        )}
        <div className="flex-1" />

        {/*
          * The four things you can do to a saved query, always here so the
          * row does not change shape as you work — the ones that need a
          * query open say so by being off rather than by vanishing.
          */}
        <button
          type="button"
          onClick={() => setLibrary(true)}
          className={action}
        >
          Queries ({ctx.queries.length})
        </button>
        <button
          type="button"
          onClick={() =>
            current &&
            ctx.saveQuery(current.name, text, current.id, current.description ?? "")
          }
          disabled={!current}
          title={
            current
              ? `Replace "${current.name}" with what is in the box`
              : "Open a saved query first, or use Save as new"
          }
          className={action}
        >
          Update
        </button>
        <button
          type="button"
          onClick={() => {
            setName("");
            setNote(current?.description ?? "");
            setSaving(true);
          }}
          disabled={!somethingNew}
          title={
            somethingNew
              ? "Keep this as another saved query"
              : twin
                ? `This is already saved as "${twin.name}"`
                : "Nothing to save yet"
          }
          className={action}
        >
          Save as new
        </button>
        <button
          type="button"
          onClick={() => {
            if (!current) return;
            setName(current.name);
            setNote(current.description ?? "");
            setSaving(true);
          }}
          disabled={!current}
          title={current ? undefined : "Nothing open to rename"}
          className={action}
        >
          Rename
        </button>
        <button
          type="button"
          onClick={() => setDeleting(true)}
          disabled={!current}
          title={current ? undefined : "Nothing open to delete"}
          className={action}
        >
          Delete
        </button>
      </div>

      {/* Capped: dragged past the window, the grip on its corner goes with
          it and there is no way left to drag it back. */}
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

      <div className="flex items-center gap-2 px-3 py-2 border-t border-brand_line flex-wrap">
        <button
          type="button"
          onClick={apply}
          disabled={!edited}
          title={
            edited
              ? "Turn this query into the configuration on the left"
              : "This query already matches the configuration — there is nothing to apply"
          }
          className="bg-[#1e2a4a] hover:bg-[#2a3a63] text-custom-white text-[12.5px] font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Apply to configuration
        </button>
        {edited && (
          <button
            type="button"
            onClick={revert}
            className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
          >
            Discard edits
          </button>
        )}
        {ctx.preApply && (
          <button
            type="button"
            onClick={undo}
            title="Put the configuration back the way it was before Apply"
            className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
          >
            Undo apply
          </button>
        )}
        <span
          className={`text-[13.5px] font-semibold ${
            edited ? "text-content/85" : "text-content/85"
          }`}
        >
          {edited
            ? "Ctrl+Enter applies it"
            : "Nothing to apply — this box already matches your configuration. Edit it and this button turns on."}
        </span>
        {ctx.queriesError && (
          <span className="text-[11.5px] text-amber-900">
            {ctx.queriesError}
          </span>
        )}
      </div>

      {error && (
        <div className="bg-amber-50 border-t border-amber-200 px-3 py-2">
          <div className="text-[12.5px] font-semibold text-amber-900">
            {error.message}
          </div>
          {error.hint && (
            <div className="text-[11.5px] text-amber-900/85 mt-1">
              {error.hint}
            </div>
          )}
        </div>
      )}

      {plan && (
        <div className="bg-custom-white border-t border-brand_line px-3 py-2">
          <div className="text-[12.5px] font-semibold">
            Applied to the configuration
          </div>
          {plan.applied.map((line, i) => (
            <div key={i} className="text-[11.5px] text-content/85 mt-0.5">
              · {line}
            </div>
          ))}
          {plan.leftBehind.length > 0 && (
            <>
              <div className="text-[11.5px] font-semibold text-amber-900 mt-1.5">
                Not carried over
              </div>
              {plan.leftBehind.map((line, i) => (
                <div key={i} className="text-[11.5px] text-amber-900/85">
                  · {line}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {saving && (
        <Modal
          isOpen
          onClose={() => setSaving(false)}
          modalClassName="bg-card_bg w-[520px] max-w-[92vw]"
        >
          <div className="flex flex-col gap-3 p-4">
            <h2 className="text-[15px] font-semibold">
              {current && name === current.name
                ? `Rename "${current.name}"`
                : "Save this query"}
            </h2>
            <TextField
              label="Name"
              value={name}
              placeholder="Loss and gain by vendor"
              onChange={setName}
            />
            <TextField
              label="Description"
              value={note}
              placeholder="What it answers"
              onChange={setNote}
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setSaving(false)}
                className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // A name that is still the one it had means a rename; a new
                  // one, or none loaded, means another row.
                  const keeping =
                    current && name.trim() === current.name ? current.id : null;
                  ctx.saveQuery(name, text, keeping, note);
                  setSaving(false);
                }}
                disabled={!name.trim()}
                className="bg-[#1e2a4a] hover:bg-[#2a3a63] text-custom-white text-[12.5px] font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40"
              >
                {current && name.trim() === current.name ? "Save changes" : "Save"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {library && (
        <Modal
          isOpen
          onClose={() => setLibrary(false)}
          modalClassName="bg-card_bg w-[560px] max-w-[92vw] max-h-[80vh]"
        >
          <div className="flex flex-col gap-3 p-4 min-h-0">
            <div className="flex items-baseline gap-3 flex-shrink-0">
              <h2 className="text-[15px] font-semibold">Saved queries</h2>
              <span className="text-[11.5px] text-content/85">
                yours, newest first
              </span>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setLibrary(false)}
                className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] text-custom-white transition-colors"
              >
                Close
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar flex flex-col gap-1.5">
              {current && (
                <button
                  type="button"
                  onClick={() => {
                    ctx.dispatch(setCurrentQuery(null));
                    setLibrary(false);
                  }}
                  className="text-left border border-brand_line rounded-lg px-3 py-2 bg-custom-white hover:border-brand_slate transition-colors"
                >
                  <span className="block text-[13px] font-semibold">
                    Close "{current.name}"
                  </span>
                  <span className="block text-[11.5px] text-content/85 mt-0.5">
                    Work without a saved query open. The box and the
                    configuration stay as they are.
                  </span>
                </button>
              )}
              {ctx.queries.map((query) => (
                <button
                  key={query.id}
                  type="button"
                  onClick={() => {
                    openSaved(String(query.id));
                    setLibrary(false);
                  }}
                  className={`text-left border rounded-lg px-3 py-2 transition-colors ${
                    query.id === ctx.currentQueryId
                      ? "border-brand_line_2 bg-filter_active"
                      : "border-brand_line bg-custom-white hover:border-brand_slate"
                  }`}
                >
                  <span className="block text-[13px] font-semibold">
                    {query.name}
                  </span>
                  {query.description && (
                    <span className="block text-[11.5px] text-content/85 mt-0.5">
                      {query.description}
                    </span>
                  )}
                  <span className="block text-[11px] text-content/85 mt-0.5">
                    saved {when(query.updated_at || query.created_at)}
                  </span>
                </button>
              ))}

              {ctx.queries.length === 0 && (
                <p className="text-[12.5px] text-content/85 py-6 text-center">
                  Nothing saved yet. Build a configuration on the left, then
                  Save as new to keep it.
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {deleting && current && (
        <ConfirmDelete
          what={current.name}
          kind="saved query"
          detail="The box goes back to showing your configuration, which is untouched. Put it back is offered afterwards if it was a mistake."
          onCancel={() => setDeleting(false)}
          onConfirm={() => {
            ctx.removeQuery(current);
            // Its words go with it. Left in the box they read as a delete
            // that did not happen — the name gone, the text still there and
            // the panel calling it an edit.
            setText(generated);
            setEdited(false);
            setError(null);
            setPlan(null);
            setDeleting(false);
          }}
        />
      )}

      {ctx.deletedQuery && (
        <div className="bg-custom-white border-t border-brand_line px-3 py-2 flex items-center gap-3">
          <span className="text-[11.5px] text-content/85 flex-1">
            Deleted "{ctx.deletedQuery.name}".
          </span>
          <button
            type="button"
            onClick={ctx.undoDeleteQuery}
            className="text-[11.5px] font-semibold text-brand_navy_hover underline underline-offset-2"
          >
            Put it back
          </button>
        </div>
      )}
    </div>
  );
};

export default QueryPanel;
