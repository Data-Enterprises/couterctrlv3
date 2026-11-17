// Hooks
import { useEffect, useMemo, useRef, useState } from "react";

// Redux
import {
  clearDeletedQuery,
  forgetPreApply,
  rememberBeforeApply,
  setCurrentQuery,
  undoApply,
} from "../../../../../features/dev/devExportBuilderSlice";

// Utils
import {
  parseQuery,
  QueryError,
  type Query,
} from "../../utils/query/parseQuery";
import { planApply, type ApplyPlan } from "../../utils/query/applyQuery";
import { configToQuery } from "../../utils/query/configToQuery";

// Interfaces
import type { useExportBuilderCtx } from "../../hooks";

/**
 * The query box: its text (which follows the configuration until someone
 * types), whether it is edited, the parse error, the last apply's report, and
 * the ways to make text the configuration (apply, open a saved query) or drop
 * it (revert, undo).
 */
export const useQueryText = (ctx: ReturnType<typeof useExportBuilderCtx>) => {
  const generated = useMemo(
    () =>
      configToQuery(
        ctx.config,
        ctx.source,
        ctx.aggregating,
        ctx.measureItems,
        ctx.orderedColumns.map((c) => c.name),
      ),
    [
      ctx.config,
      ctx.source,
      ctx.aggregating,
      ctx.measureItems,
      ctx.orderedColumns,
    ],
  );

  const [text, setText] = useState(generated);
  const [edited, setEdited] = useState(false);
  const [error, setError] = useState<{ message: string; hint?: string } | null>(
    null,
  );
  const [plan, setPlan] = useState<ApplyPlan | null>(null);

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

  /**
   * Make some text the configuration.
   *
   * The one path for it, because opening a saved query and pressing Apply are
   * the same act: after either, the box and the panel say the same thing.
   */
  const applyText = (sql: string) => {
    try {
      const parsed: Query = parseQuery(sql);
      ctx.dispatch(rememberBeforeApply());
      const next = planApply(parsed, ctx.config, ctx.source);
      justApplied.current = true;
      next.actions.forEach((action) => ctx.dispatch(action));
      setPlan(next);
      setError(null);
      setEdited(false);
      return true;
    } catch (e) {
      setPlan(null);
      setError(
        e instanceof QueryError
          ? { message: e.message, hint: e.hint }
          : { message: e instanceof Error ? e.message : "That did not parse." },
      );
      return false;
    }
  };

  const apply = () => applyText(text);

  const undo = () => {
    ctx.dispatch(undoApply());
    setPlan(null);
  };

  /**
   * The undo is an offer, not a record.
   *
   * It used to sit under the box for the rest of the session, long after the
   * moment it belonged to — and a standing offer to undo something you have
   * stopped thinking about is just a line you learn to ignore.
   */
  useEffect(() => {
    if (!ctx.deletedQuery) return;
    const timer = window.setTimeout(
      () => ctx.dispatch(clearDeletedQuery()),
      20_000,
    );
    return () => window.clearTimeout(timer);
  }, [ctx.deletedQuery, ctx]);

  /** Ctrl/Cmd+Enter applies, which is the only thing to do with it here. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      apply();
    }
  };

  /**
   * Open a saved query — which means load it, not just show it.
   *
   * It used to put the text in the box and leave the panel on the left
   * untouched, so the two disagreed the moment you picked one, and the box
   * called it an edit you had not made. Opening applies it: the panel changes,
   * anything the configuration cannot hold is reported, and if it will not
   * parse the text stays put with the error under it.
   */
  const openSaved = (id: string) => {
    const query = ctx.queries.find((q) => String(q.id) === id);
    if (!query) return;
    setText(query.sql);
    ctx.dispatch(setCurrentQuery(query.id));
    if (!applyText(query.sql)) setEdited(true);
  };

  return {
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
  };
};
