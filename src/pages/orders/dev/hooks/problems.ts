// Hooks
import { useMemo } from "react";
import { useOrderDraftActions, useOrdersCtx } from ".";

// Redux
import {
  patchOrdersEdit,
  type OrdersEdit,
} from "../../../../features/dev/devOrdersSlice";

// Utils
import { stageUnitCost, docKey } from "../utils/orderEdit";
import { itemsInScope, workingOrder } from "../utils/problemItems";

/**
 * Edit mode's Problems tab: the flagged items across every loaded order, the
 * one open, how far through the list it is, and staging a cost or skipping
 * an item, each moving on to the next one still to do.
 */
export const useOrderProblems = () => {
  const ctx = useOrdersCtx();
  const edit = ctx.edit;
  const patchEdit = (p: Partial<OrdersEdit>) =>
    ctx.dispatch(patchOrdersEdit(p));
  const draftActions = useOrderDraftActions();
  const { drafts } = edit;

  /**
   * The Problems tab.
   *
   * `problemCode` is the item open on the right while the tab is showing.
   * `skipped` is session-only and never sent: a high margin is sometimes
   * the real price, and Skip is how somebody says "looked, it's fine" without
   * that becoming a rule anyone has to undo later.
   */
  const { leftTab, problemCode } = edit;
  const setLeftTab = (leftTab: OrdersEdit["leftTab"]) => patchEdit({ leftTab });
  const setProblemCode = (problemCode: string | null) =>
    patchEdit({ problemCode });
  const skipped = useMemo(() => new Set(edit.skipped), [edit.skipped]);
  const setSkipped = (next: Set<string>) => patchEdit({ skipped: [...next] });

  /**
   * What the Problems tab works across: every loaded order.
   *
   * Store, order date and order type live on the Orders tab now, so they do
   * not narrow this — a filter that still applied after its controls had gone
   * off screen would be scope nobody could see. Which stores a fix reaches is
   * decided on the item itself, by ticking or unticking each store's row.
   */
  const problemScope = ctx.allOrders;
  const scopeStores = useMemo(
    () =>
      new Set(problemScope.map((o) => `${o.storeid}|${o.storenumber}`)).size,
    [problemScope],
  );
  const scopeOrders = useMemo(
    () => new Set(problemScope.map(docKey)).size,
    [problemScope],
  );
  const problemItems = useMemo(
    () => itemsInScope(problemScope, drafts, ctx.filters.marginOver),
    [problemScope, drafts, ctx.filters.marginOver],
  );
  /** Still to do, in working order: what "next" walks and "3 of 57" counts. */
  const toDo = useMemo(
    () =>
      workingOrder(
        problemItems.filter(
          (i) => i.flags.length > 0 && i.staged === 0 && !skipped.has(i.code),
        ),
        skipped,
      ),
    [problemItems, skipped],
  );
  const openProblem =
    problemCode === null
      ? null
      : (problemItems.find((i) => i.code === problemCode) ?? null);
  const problemPosition =
    openProblem === null
      ? null
      : (() => {
          const at = toDo.findIndex((i) => i.code === openProblem.code);
          return at < 0 ? null : { index: at + 1, total: toDo.length };
        })();

  /** The next item still to do after `code`, or the first one left. */
  const nextAfter = (code: string, excluding: Set<string>) => {
    const rest = toDo.filter((i) => !excluding.has(i.code));
    const at = toDo.findIndex((i) => i.code === code);
    return (
      (rest.find((i) => toDo.indexOf(i) > at) ?? rest[0] ?? null)?.code ?? null
    );
  };

  const handleStageItem = (keys: string[], unit: number) => {
    if (!problemCode) return;
    const keySet = new Set(keys);
    const rows = problemScope.filter(
      (o) => String(o.product_code) === problemCode && keySet.has(docKey(o)),
    );
    draftActions.editDrafts((ds) =>
      stageUnitCost(ds, rows, ctx.allOrders, unit),
    );
    setProblemCode(nextAfter(problemCode, new Set([problemCode])));
  };

  const handleSkipItem = () => {
    if (!problemCode) return;
    const nextSkipped = new Set(skipped).add(problemCode);
    setSkipped(nextSkipped);
    setProblemCode(nextAfter(problemCode, new Set([problemCode])));
  };

  return {
    leftTab,
    setLeftTab,
    problemCode,
    setProblemCode,
    skipped,
    problemScope,
    scopeStores,
    scopeOrders,
    problemItems,
    toDo,
    openProblem,
    problemPosition,
    handleStageItem,
    handleSkipItem,
  };
};
