import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "../../../components-dev/Modal";
import TextField from "../../../components-dev/inputs/TextField";
import SelectFilter from "../../../components-dev/filters/SelectFilter";
import { useExportBuilderCtx } from "./hooks";
import {
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
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  // Untouched, the box follows the ticks. Touched, it is the person's until
  // they apply it or drop it.
  const last = useRef(generated);
  useEffect(() => {
    if (generated === last.current) return;
    last.current = generated;
    if (!edited) setText(generated);
  }, [generated, edited]);

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

  return (
    <div className="flex-shrink-0 bg-card_bg border border-brand_line rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-custom-white border-b border-brand_line flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-content/60">
          The configuration, as a query
        </span>
        {edited ? (
          <span className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
            Edited — the file below is still the configuration's
          </span>
        ) : (
          <span className="text-[11px] text-content/50">
            follows the panel on the left · runs nowhere
          </span>
        )}
        <div className="flex-1" />
        {ctx.queries.length > 0 && (
          <SelectFilter
            plain
            searchable
            searchPlaceholder="Find a saved query..."
            placeholder="Open saved..."
            options={ctx.queries.map((q) => ({
              value: String(q.id),
              label: q.name,
            }))}
            value={current ? String(current.id) : ""}
            onChange={openSaved}
            className="w-[150px]"
          />
        )}
        <button
          type="button"
          onClick={() => {
            setName(current?.name ?? "");
            setNote(current?.description ?? "");
            setSaving(true);
          }}
          className="text-[11.5px] text-brand_navy_hover underline underline-offset-2"
        >
          Save this
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => onText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={5}
        spellCheck={false}
        aria-label="The configuration, as a query"
        className="w-full border-0 px-3 py-2 text-[12px] font-mono resize-y bg-card_bg"
        style={{ outline: "none" }}
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
        <span className="text-[11px] text-content/50">
          {edited
            ? "Ctrl+Enter applies it"
            : "Nothing to apply — this is already your configuration. Edit it to change the panel on the left."}
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
            <div className="text-[11.5px] text-amber-900/80 mt-1">
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
            <div key={i} className="text-[11.5px] text-content/75 mt-0.5">
              · {line}
            </div>
          ))}
          {plan.leftBehind.length > 0 && (
            <>
              <div className="text-[11.5px] font-semibold text-amber-900 mt-1.5">
                Not carried over
              </div>
              {plan.leftBehind.map((line, i) => (
                <div key={i} className="text-[11.5px] text-amber-900/80">
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
            <h2 className="text-[15px] font-semibold">Save this query</h2>
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  ctx.saveQuery(name, text, ctx.currentQueryId, note);
                  setSaving(false);
                }}
                disabled={!name.trim()}
                className="bg-[#1e2a4a] hover:bg-[#2a3a63] text-custom-white text-[12.5px] font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40"
              >
                {current ? `Update "${current.name}"` : "Save"}
              </button>
              {current && (
                <button
                  type="button"
                  onClick={() => {
                    ctx.saveQuery(name, text, null, note);
                    setSaving(false);
                  }}
                  disabled={!name.trim()}
                  className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors disabled:opacity-40"
                >
                  Save as new
                </button>
              )}
              <div className="flex-1" />
              {current && (
                <button
                  type="button"
                  onClick={() => {
                    ctx.removeQuery(current);
                    setSaving(false);
                  }}
                  className="text-[11.5px] text-brand_navy_hover underline underline-offset-2"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={() => setSaving(false)}
                className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
              >
                Close
              </button>
            </div>
            {ctx.deletedQuery && (
              <div className="flex items-center gap-3 text-[11.5px]">
                <span className="text-content/70 flex-1">
                  Deleted "{ctx.deletedQuery.name}".
                </span>
                <button
                  type="button"
                  onClick={ctx.undoDeleteQuery}
                  className="font-semibold text-brand_navy_hover underline underline-offset-2"
                >
                  Put it back
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default QueryPanel;
