import { useMemo, useState } from "react";
import Modal from "../../../components-dev/Modal";
import TextField from "../../../components-dev/inputs/TextField";
import { useExportBuilderCtx } from "./hooks";
import { isPii, maskValue } from "./piiColumns";
import {
  openQuery,
  setCurrentQuery,
  setQuerySql,
} from "../../../features/dev/devExportBuilderSlice";
import type { SavedQuery } from "../../../api/savedQueries";
import { parseQuery, QueryError, type Query } from "./query/parseQuery";
import { evalQuery, type QueryResult } from "./query/evalQuery";
import { planApply, type ApplyPlan } from "./query/applyQuery";

/**
 * A scratchpad for a question about the data.
 *
 * It runs here, over the sample rows the preview already returned: nothing is
 * sent, nothing is fetched, and nothing typed in this box reaches the API or
 * the file. The export is still built from the configuration on the left — the
 * Apply button translates a query into that configuration rather than shipping
 * the text anywhere.
 *
 * The point is the twenty minutes it saves. A file built on a
 * misunderstanding of what sale_type holds is twenty minutes and a download
 * before anyone finds out; this answers it in a second, against the real
 * values, with the same arithmetic the endpoint would use.
 *
 * The saved ones live down the left, where a query tool puts them: they are a
 * place to start from, so they belong beside the box rather than under the
 * results of the last thing that was run.
 */

const EXAMPLES = [
  "select sale_type, count(*) group by sale_type order by 2 desc",
  "select * where total_sales > 20 limit 10",
  "select storeid, sale_date, sum(total_sales), count(*)\ngroup by storeid, sale_date\norder by 3 desc",
  "select product_code, product_description, qty\nwhere product_description ilike '%milk%'",
  // The shape a client actually writes: what it should have rung at,
  // against what it did.
  "select product_code, product_description,\n  sum(qty) as units,\n  sum(total_sales) as dollars,\n  max(price) / nullif(max(price_split), 0) as reg_unit_price,\n  (sum(qty) * (max(price) / nullif(max(price_split), 0))) - sum(total_sales) as loss_gain\nwhere sale_type = 'Sale'\ngroup by product_code, product_description\norder by 6",
];

/**
 * A worked-out number carries floating point noise — 2.0000000000000004
 * for two dollars. This is a sample, not a ledger: four places is plenty,
 * and the noise says nothing true about the data.
 */
const cell = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" && !Number.isInteger(value)) {
    return String(Number(value.toFixed(4)));
  }
  return String(value);
};

const when = (iso: string) => {
  const at = new Date(iso);
  return Number.isNaN(at.getTime())
    ? ""
    : at.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const QueryModal = () => {
  const ctx = useExportBuilderCtx();
  const [text, setText] = useState(ctx.querySql);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [parsed, setParsed] = useState<Query | null>(null);
  const [error, setError] = useState<{ message: string; hint?: string } | null>(
    null,
  );
  const [plan, setPlan] = useState<ApplyPlan | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const current = ctx.queries.find((q) => q.id === ctx.currentQueryId) ?? null;

  const clearResults = () => {
    setResult(null);
    setParsed(null);
    setError(null);
    setPlan(null);
  };

  /**
   * Open one of the saved ones.
   *
   * The id comes with it: Save then means replace that row rather than leave
   * a second copy behind, which the table would happily take — names are not
   * unique there.
   */
  const open = (query: SavedQuery) => {
    setText(query.sql);
    setName(query.name);
    setDescription(query.description ?? "");
    ctx.dispatch(setCurrentQuery(query.id));
    clearResults();
  };

  /** A blank sheet, and nothing loaded for Save to replace. */
  const startNew = () => {
    setText("");
    setName("");
    setDescription("");
    ctx.dispatch(setCurrentQuery(null));
    clearResults();
  };

  const save = (asNew: boolean) => {
    ctx.saveQuery(name, text, asNew ? null : ctx.currentQueryId, description);
  };

  const close = () => {
    ctx.dispatch(setQuerySql(text));
    ctx.dispatch(openQuery(false));
  };

  const run = () => {
    setPlan(null);
    try {
      const query = parseQuery(text);
      setParsed(query);
      setResult(evalQuery(query, ctx.rows, ctx.columns));
      setError(null);
    } catch (e) {
      setParsed(null);
      setResult(null);
      setError(
        e instanceof QueryError
          ? { message: e.message, hint: e.hint }
          : { message: e instanceof Error ? e.message : "That did not run." },
      );
    }
  };

  const apply = () => {
    if (!parsed) return;
    const next = planApply(parsed, ctx.config);
    next.actions.forEach((action) => ctx.dispatch(action));
    setPlan(next);
  };

  /** Ctrl/Cmd+Enter runs it, which is what every other query box does. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      run();
    }
  };

  const columnHint = useMemo(
    () => ctx.columns.slice(0, 6).map((c) => c.name).join(", "),
    [ctx.columns],
  );

  /** What Save would do, said plainly, because the two are a row apart. */
  const saveLabel = current ? `Update "${current.name}"` : "Save";
  const savable = text.trim().length > 0 && name.trim().length > 0;

  return (
    <Modal
      isOpen
      onClose={close}
      modalClassName="bg-card_bg w-[1120px] max-w-[95vw] h-[82vh]"
    >
      <div className="flex h-full min-h-0">
        {/* The rail: what has been kept, and a way to start something new */}
        <div className="w-[236px] flex-shrink-0 flex flex-col min-h-0 border-r border-brand_line bg-custom-white rounded-l-xl">
          <div className="flex items-center gap-2 px-3 pt-3 pb-2 flex-shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-content/60 flex-1">
              Saved queries
            </span>
            <button
              type="button"
              onClick={startNew}
              className="text-[11.5px] font-semibold text-brand_navy_hover underline underline-offset-2"
            >
              New
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar flex flex-col gap-1 px-2 pb-2">
            {ctx.queries.map((query) => (
              <div
                key={query.id}
                className={`group flex items-start gap-1.5 border rounded-lg px-2 py-1.5 ${
                  query.id === ctx.currentQueryId
                    ? "border-brand_line_2 bg-filter_active"
                    : "border-transparent hover:border-brand_line"
                }`}
              >
                <button
                  type="button"
                  onClick={() => open(query)}
                  className="flex-1 min-w-0 text-left"
                >
                  <span className="block text-[12.5px] font-semibold truncate">
                    {query.name}
                  </span>
                  {query.description && (
                    <span className="block text-[11px] text-content/65 line-clamp-2">
                      {query.description}
                    </span>
                  )}
                  <span className="block text-[10.5px] text-content/45 mt-0.5">
                    saved {when(query.updated_at || query.created_at)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => ctx.removeQuery(query)}
                  aria-label={`Delete ${query.name}`}
                  className="w-[18px] h-[18px] flex-shrink-0 rounded text-content/40 hover:text-content transition-colors"
                >
                  ×
                </button>
              </div>
            ))}

            {ctx.queries.length === 0 && (
              <p className="text-[11.5px] text-content/55 px-1 py-2 leading-relaxed">
                {ctx.queriesLoading
                  ? "Reading your saved queries..."
                  : "Nothing saved yet. Write a query, name it, and it comes back on any machine."}
              </p>
            )}
          </div>

          {ctx.deletedQuery && (
            <div className="flex-shrink-0 border-t border-brand_line px-3 py-2">
              <div className="text-[11.5px] text-content/75">
                Deleted "{ctx.deletedQuery.name}".
              </div>
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

        {/* The scratchpad itself */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 p-4 min-h-0">
          <div className="flex items-baseline gap-3 flex-shrink-0">
            <h2 className="text-[15px] font-semibold">Query the sample</h2>
            <span className="text-[11.5px] text-content/60">
              {ctx.rows.length} sample line{ctx.rows.length === 1 ? "" : "s"} ·
              runs here, nothing is sent
            </span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={close}
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
            >
              Close
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              // Once the words are someone else's, Save is no longer a replace
              // of the row it came from.
              if (current && e.target.value !== current.sql) {
                ctx.dispatch(setCurrentQuery(null));
              }
            }}
            onKeyDown={onKeyDown}
            rows={4}
            spellCheck={false}
            placeholder={`select sale_type, count(*) group by sale_type\n\nColumns include ${columnHint}...`}
            aria-label="Query"
            className="w-full flex-shrink-0 border border-brand_line rounded-lg px-3 py-2 text-[12px] font-mono resize-y bg-custom-white"
          />

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <button
              type="button"
              onClick={run}
              className="bg-[#1e2a4a] hover:bg-[#2a3a63] text-custom-white text-[12.5px] font-semibold px-4 py-1.5 rounded-lg transition-colors"
            >
              Run
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={!parsed}
              title="Turn this query into the configuration on the left"
              className="text-[12.5px] font-medium px-4 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Apply to configuration
            </button>
            <span className="text-[11px] text-content/50">Ctrl+Enter runs it</span>
            <div className="flex-1" />
            {EXAMPLES.map((example, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setText(example);
                  ctx.dispatch(setCurrentQuery(null));
                }}
                className="text-[11px] text-brand_navy_hover underline underline-offset-2"
              >
                example {i + 1}
              </button>
            ))}
          </div>

          {/*
            * Name and description are the row's, not the page's: the
            * description is what the rail shows under the name, and what a
            * search on that table matches. Both travel with a save, and a
            * change to either is a PUT of that field alone.
            */}
          <div className="flex items-end gap-2 flex-shrink-0">
            <TextField
              label={
                <span className="text-[11px] font-normal text-content/60">
                  Name
                </span>
              }
              value={name}
              placeholder="Loss and gain by vendor"
              onChange={setName}
              className="w-[220px]"
            />
            <TextField
              label={
                <span className="text-[11px] font-normal text-content/60">
                  Description
                </span>
              }
              value={description}
              placeholder="What it answers, for the list on the left"
              onChange={setDescription}
              className="flex-1 min-w-0"
            />
            <button
              type="button"
              onClick={() => save(false)}
              disabled={!savable || ctx.queriesLoading}
              className="bg-[#1e2a4a] hover:bg-[#2a3a63] text-custom-white text-[12.5px] font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saveLabel}
            </button>
            {current && (
              <button
                type="button"
                onClick={() => save(true)}
                disabled={!savable}
                className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors disabled:opacity-40"
              >
                Save as new
              </button>
            )}
          </div>

          {ctx.queriesError && (
            <div className="flex-shrink-0 text-[11.5px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {ctx.queriesError}
            </div>
          )}

          {error && (
            <div className="flex-shrink-0 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
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
            <div className="flex-shrink-0 bg-custom-white border border-brand_line rounded-lg px-3 py-2">
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

          {result && (
            <>
              <div className="flex items-baseline gap-3 flex-shrink-0">
                <span className="text-[12px] font-semibold">
                  {result.rows.length} row{result.rows.length === 1 ? "" : "s"}
                </span>
                <span className="text-[11.5px] text-content/60">
                  from {result.matched} of {result.scanned} sample line
                  {result.scanned === 1 ? "" : "s"}
                </span>
              </div>
              {result.note && (
                <div className="flex-shrink-0 text-[11.5px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {result.note}
                </div>
              )}
              <div className="flex-1 min-h-0 overflow-auto thin-scrollbar border border-brand_line rounded-lg">
                <table className="border-collapse font-mono text-[11px] w-max">
                  <thead>
                    <tr>
                      {result.columns.map((c) => (
                        <th
                          key={c}
                          className={`sticky top-0 z-10 border-b border-brand_line_2 border-r border-brand_line px-2.5 py-1.5 text-left font-semibold whitespace-nowrap ${
                            isPii(c)
                              ? "bg-amber-50 text-amber-900"
                              : "bg-row_selected text-content"
                          }`}
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, r) => (
                      <tr key={r}>
                        {result.columns.map((c) => {
                          const raw = row[c];
                          return (
                            <td
                              key={c}
                              className={`border-r border-b border-brand_line px-2.5 py-1.5 whitespace-nowrap ${
                                isPii(c) ? "text-amber-900" : ""
                              }`}
                            >
                              {isPii(c) ? maskValue(raw) : cell(raw)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.rows.length === 0 && (
                  <div className="px-3 py-3 text-[12px] text-content/70">
                    No rows. The sample is fifty lines taken where the scan
                    landed, so a narrow question can come back empty here and
                    still fill a file.
                  </div>
                )}
              </div>
            </>
          )}

          {!result && !error && (
            <div className="flex-1 min-h-0 flex items-center justify-center text-center px-6">
              <div className="max-w-[46ch]">
                <div className="text-[13px] font-semibold">
                  Check an idea before you build a file
                </div>
                <div className="text-[12.5px] text-content/70 mt-1.5 leading-relaxed">
                  SELECT, WHERE, GROUP BY, ORDER BY and LIMIT over the sample
                  rows, with arithmetic between the measures — sum, avg, min,
                  max and count, with nullif, coalesce, round and abs around
                  them. The numbers are the sample's, not the range's: what this
                  answers is whether the question is the right one, and what the
                  values in a column actually look like.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default QueryModal;
