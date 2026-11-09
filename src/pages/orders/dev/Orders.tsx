// Hooks
import { useMemo, useState } from "react";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { useTriStateSort } from "../../../utils/useTriStateSort";
import { useOrderDraftActions, useOrdersCtx } from "./hooks";

// Redux
import {
  setAllOrders,
  setLoadingAllOrders,
  setOrdersExportModalOpen,
  setOrdersFilter,
  clearOrdersFilters,
  setOrdersMarginOver,
  setUniqueSubs,
  patchOrdersEdit,
  dropSentDraft,
  addStoreSubDepts,
  EMPTY_EDIT_SEARCH,
  type OrdersEdit,
  type OrdersFilters,
  type UniqueSub,
} from "../../../features/dev/devOrdersSlice";
import { setSelectedGroupStores } from "../../../features/userSlice";
import { isGroupSearch } from "../../../features/searchSlice";

// API
import { getAllOrders, updateOrderFile } from "../../../api/orders";
import { getItemLookupSingleStore } from "../../../api/itemLookup";
import { getSubDeptCatalog } from "../../../api/subDeptExclusions";
import { getStoresAssignedToUserGroup } from "../../../api/groups";

// Utils
import { formatGoliathDate } from "../../../utils";
import { getCogs, getERet } from "./utils";
import { buildRows } from "./utils/ordersRows";
import {
  addedLines,
  appendLine,
  stageUnitCost,
  blankLine,
  buildDocs,
  buildPayload,
  unsentDrafts,
  editedLines,
  patchLine,
  recompute,
  startDraft,
  canEditOrders,
  applySent,
  docKey,
} from "./utils/orderEdit";
import { itemsInScope, workingOrder } from "./utils/problemItems";

// Interfaces
import type {
  AllOrderResp,
  JsonError,
  Store,
  UpdateFileResp,
} from "../../../interfaces";
import type { EditSearch, DraftLine, EditableField, LinePatch, OrderDoc, OrderDraft, SortKey } from "./interfaces";

// Components
import SearchCard from "../../../components-dev/SearchCard";
import OrderPickerPanel from "./components/OrderPickerPanel";
import OrderEditPanel from "./components/editPanel/OrderEditPanel";
import SubmitReceipt from "./components/SubmitReceipt";
import OrdersExportModal from "./export/OrdersExportModal";
import ProblemList from "./components/ProblemList";
import ItemFixPanel from "./components/ItemFixPanel";
import OrdersConfigPanel from "./components/OrdersConfigPanel";
import OrderReportPanel from "./components/OrderReportPanel";
import OrdersMobile from "./mobile/OrdersMobile";

/**
 * Orders, as one fetch and a configuration.
 *
 * It used to ask `available_order` what orders existed, draw them as cards,
 * and fetch one card's line items when you picked it. Everything downstream
 * was then scoped to a single store, date and order type — which is why there
 * was no way to ask for one sub department across every order, or to export
 * more than one order at a time.
 *
 * Now the search fetches every line in the range once, from `all_orders`, and
 * the left panel narrows it. `all_orders` is a superset of `available_order`
 * — same storeid, storenumber, order_date, order_type and record_count, plus
 * the sub department, the item and the costs — so nothing the old left panel
 * showed was lost by dropping the first call.
 *
 * The filtering lives here rather than in the slice. Six independent filters
 * reducing one list is a single pass over the result; six reducers each
 * recomputing `filteredOrders` would run it six times and only the last one
 * would be right.
 */
const Orders = () => {
  const ctx = useOrdersCtx();
  const toast = useToast();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  /* Who may edit, worked out once a render. `new Date()` rather than a
     memo: the answer turns over at midnight and a memo keyed on nothing
     would hold Wednesday's answer into Thursday. */
  const canEdit = canEditOrders(ctx.userLevel, ctx.companyIds, new Date());
  const [notice, setNotice] = useState<string | undefined>(undefined);

  /**
   * Edit mode's working state lives in the slice (`edit`), so unsent edits,
   * the open order, the pickers and the Problems tab are still there after
   * leaving the page. A draft per order: Fix cost changes every order the
   * filters hit, and switching orders must not throw away the last one's
   * changes. A new search drops the drafts, whose lines are gone.
   */
  const edit = ctx.edit;
  const patchEdit = (p: Partial<OrdersEdit>) => ctx.dispatch(patchOrdersEdit(p));
  const draftActions = useOrderDraftActions();
  const { editing, drafts, openKey, submittedCounts, receipt } = edit;
  const setEditing = (editing: boolean) => patchEdit({ editing });
  const setOpenKey = (openKey: string | null) => patchEdit({ openKey });
  const setReceipt = (receipt: UpdateFileResp | null) => patchEdit({ receipt });
  const setSubmittedCounts = (submittedCounts: OrdersEdit["submittedCounts"]) =>
    patchEdit({ submittedCounts });
  const draft = openKey ? (drafts[openKey] ?? null) : null;

  /**
   * The open order's draft, with the signature the single-draft setter had,
   * so every handler that edits a line is unchanged.
   *
   * A value opens that order (adding it if it is new); a function edits the
   * one open when the handler was made; null drops them all, which is what a
   * reloaded search needs.
   */
  const setDraft = (
    next:
      | OrderDraft
      | null
      | ((d: OrderDraft | null) => OrderDraft | null),
  ) => {
    if (next === null) draftActions.clearDrafts();
    else if (typeof next === "function") draftActions.editDraft(openKey, next);
    else draftActions.openDraft(next);
  };

  /** Every order with something to send, open or not. */
  const changedDrafts = unsentDrafts(drafts, openKey, receipt !== null);
  const changedKeys = new Set(changedDrafts.map((d) => d.doc.key));
  const { pickStore, pickDate, pickType } = edit;
  const setPickStore = (pickStore: string) => patchEdit({ pickStore });
  const setPickDate = (pickDate: string) => patchEdit({ pickDate });
  const setPickType = (pickType: string) => patchEdit({ pickType });

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
  const setProblemCode = (problemCode: string | null) => patchEdit({ problemCode });
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
    () => new Set(problemScope.map((o) => `${o.storeid}|${o.storenumber}`)).size,
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
      rest.find((i) => toDo.indexOf(i) > at) ?? rest[0] ?? null
    )?.code ?? null;
  };

  const handleStageItem = (keys: string[], unit: number) => {
    if (!problemCode) return;
    const keySet = new Set(keys);
    const rows = problemScope.filter(
      (o) => String(o.product_code) === problemCode && keySet.has(docKey(o)),
    );
    draftActions.editDrafts((ds) => stageUnitCost(ds, rows, ctx.allOrders, unit));
    setProblemCode(nextAfter(problemCode, new Set([problemCode])));
  };

  const handleSkipItem = () => {
    if (!problemCode) return;
    const nextSkipped = new Set(skipped).add(problemCode);
    setSkipped(nextSkipped);
    setProblemCode(nextAfter(problemCode, new Set([problemCode])));
  };
  const setEditSearch = (search: EditSearch) => patchEdit({ search });
  /**
   * The line being filled in, which is not on the order yet.
   *
   * Held here rather than in the draft so that a half-filled row is never one
   * of the order's lines: it takes its sequence number when it is added, not
   * when the form opens, so opening one and discarding it leaves no gap.
   */
  const [pending, setPending] = useState<DraftLine | null>(null);
  /**
   * The composing line's own reset counter, for the same reason the draft has
   * one: its cost and retail boxes are uncontrolled, so a lookup writing into
   * them has to say so.
   */
  const [pendingNonce, setPendingNonce] = useState(0);
  const [lookingUp, setLookingUp] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /**
   * The sub departments each store has, by storeid (in the slice).
   *
   * Asked for once per store and kept, because the answer does not change
   * while somebody edits an order and the catalog is a grouped scan of
   * `sales_partitioned` — not a thing to re-ask on every added line.
   */
  const subDeptsByStore = edit.subDeptsByStore;
  const [loadingSubDepts, setLoadingSubDepts] = useState(false);
  /**
   * The grid's sort lives here rather than in the panel.
   *
   * It used to be local to the report panel, which meant the export —
   * raised from this level — wrote the rows in whatever order the API
   * returned rather than the order on screen.
   */
  const { sort, handleSort, applySort } = useTriStateSort<SortKey>();

  const handleSearch = () => {
    if (isGroupSearch(ctx.type)) {
      getStoresAssignedToUserGroup(ctx.url, ctx.token, ctx.userid, ctx.lastGroup)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            // `active` rides the group response, not Store itself.
            const activeStores = (j.stores as (Store & { active?: boolean })[]).filter(
              (s) => s.active,
            );
            ctx.dispatch(setSelectedGroupStores(activeStores));
            fetchAllLines(activeStores.map((s: Store) => s.storeid));
          } else {
            toast.warn(j.msg);
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    } else {
      fetchAllLines([ctx.lastStore]);
    }
  };

  /**
   * Every line item in the range, in one call.
   *
   * No order type and no single date: the whole point is that the panel
   * decides those afterwards, out of what actually came back.
   */
  const fetchAllLines = (storeids: number[]) => {
    setNotice(undefined);
    setDraft(null);
    setReceipt(null);
    ctx.dispatch(clearOrdersFilters());
    ctx.dispatch(setAllOrders([]));
    ctx.dispatch(setLoadingAllOrders(true));

    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);

    getAllOrders(ctx.url, ctx.token, start, end, storeids)
      .then((resp) => {
        const j: AllOrderResp = resp.data;
        if (j.error !== 0) {
          toast.warn(j.msg);
          return;
        }
        if (j.orders.length === 0) {
          setNotice("No orders came back for this search.");
          return;
        }

        // Same per-line derivation the old per-order fetch did, so a line
        // means the same thing it always did.
        const lines = j.orders.map((o) => {
          const base_cost = o.base_cost ?? 0;
          const net_cost = o.net_cost ?? 0;
          const weight = o.weight ?? 0;
          const casesize = o.casesize ?? 0;
          const e_ret = getERet(o.qty, weight, o.active_retail_price, o.scalable);
          const cogs = getCogs(base_cost, o.qty, o.scalable, weight, casesize);
          return { ...o, e_ret, base_cost, net_cost, weight, casesize, cogs, rev: e_ret - cogs };
        });

        const uniqueSubs = lines.reduce((acc: UniqueSub[], o) => {
          const found = acc.find((a) => a.subId === o.sub_department);
          if (found) found.count += 1;
          else
            acc.push({
              desc: o.sub_department_description ?? "null",
              subId: o.sub_department,
              count: 1,
            });
          return acc;
        }, []);

        ctx.dispatch(setUniqueSubs(uniqueSubs));
        ctx.dispatch(setAllOrders(lines));
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => ctx.dispatch(setLoadingAllOrders(false)));
  };

  /** One list, built once — the grid draws it and the export writes it. */
  const gridRows = useMemo(
    () => buildRows(ctx.allOrders, ctx.filters, applySort),
    // `sort` rather than `applySort`: the helper is rebuilt every render and
    // closes over the state that actually decides the order.
    [ctx.allOrders, ctx.filters, sort],
  );

  /** The orders in the result, for the picker. No call: see buildDocs. */
  const docs = useMemo(() => buildDocs(ctx.allOrders), [ctx.allOrders]);


  const dirty =
    (changedDrafts.length > 0 || pending !== null) && receipt === null;

  const leaveEdit = () => {
    if (dirty) {
      toast.warn(
        "Submit the order or undo the changes before leaving edit mode.",
      );
      return;
    }
    setEditing(false);
    setReceipt(null);
  };

  const handlePick = (doc: OrderDoc) => {
    if (doc.key === openKey) return;
    // An order that already has changes — from an earlier visit or from Fix
    // cost — opens with them rather than being started over.
    draftActions.editDrafts((ds) =>
      ds[doc.key] ? ds : { ...ds, [doc.key]: startDraft(doc, ctx.allOrders) },
    );
    setOpenKey(doc.key);
    setPending(null);
    setReceipt(null);
    setEditSearch(EMPTY_EDIT_SEARCH);
  };

  /**
   * Which sub departments this store has, for an added line.
   *
   * Fetched when the first line is added rather than when an order is opened:
   * most editing never adds a line, and this is the one call edit mode makes
   * that the page did not already have an answer for.
   */
  const loadSubDepts = (storeid: number) => {
    if (subDeptsByStore[storeid] || loadingSubDepts) return;
    setLoadingSubDepts(true);

    getSubDeptCatalog(ctx.url, ctx.token, [storeid])
      .then((rows) => {
        const seen = new Map<number, string>();
        for (const r of rows) {
          if (!seen.has(r.sub_department)) {
            seen.set(r.sub_department, r.sub_department_description);
          }
        }
        ctx.dispatch(
          addStoreSubDepts({
            storeid,
            options: [...seen.entries()]
              .map(([id, name]) => ({ id, name }))
              .sort((a, b) => a.name.localeCompare(b.name)),
          }),
        );
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => setLoadingSubDepts(false));
  };

  const handleAddLine = () => {
    if (!draft || pending) return;
    loadSubDepts(draft.doc.storeid);
    const fresh = blankLine(draft);
    if (!fresh) {
      toast.warn("There is no line on this order to copy the order from.");
      return;
    }
    setPending(fresh);
    setPendingNonce((n) => n + 1);
  };

  /** The composing line is edited the same way, into its own state. */
  const handlePendingField = (field: EditableField, value: number) =>
    setPending((l) =>
      l ? recompute({ ...l, [field]: field === "qty" ? Math.round(value) : value }) : l,
    );

  const handlePendingPatch = (patch: LinePatch) =>
    setPending((l) => (l ? recompute({ ...l, ...patch }) : l));

  /** Onto the end of the order, taking the next sequence number there. */
  const handleConfirmPending = () => {
    if (!draft || !pending) return;
    setDraft(appendLine(draft, pending));
    setPending(null);
  };

  /**
   * What the item lookup can fill in from a UPC.
   *
   * A head start, not a gate: nothing on a desktop scans, so every field on an
   * added line can be typed, and a code the lookup does not know leaves what
   * was typed alone rather than clearing it.
   *
   * The lookup does not return a case size, so that is derived from the two
   * costs it does return — `net_cost` is per case and `casecost` per unit, so
   * their ratio is the case size. Both zero means no invoice history, and 0 is
   * read as a case of one.
   */
  const handleLookup = (lineNumber: number, upc: string) => {
    if (!draft) return;
    // 0 is the line being composed: it has no sequence number until it is
    // added, so that is what the panel sends for it.
    setLookingUp(lineNumber);

    getItemLookupSingleStore(ctx.url, ctx.token, upc, draft.doc.storeid, 14)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0 || !j.product_code) {
          toast.warn(
            `No item at this store for ${upc}. Fill the line in by hand.`,
          );
          return;
        }

        const history: {
          sale_date: string;
          casecost: number;
          net_cost: number;
          price: number;
        }[] = j.history ?? [];
        const latest = [...history].sort((a, b) =>
          b.sale_date.localeCompare(a.sale_date),
        )[0];

        const perCase = latest?.net_cost ?? 0;
        const perUnit = latest?.casecost ?? 0;
        const casesize =
          perCase > 0 && perUnit > 0 ? Math.round(perCase / perUnit) : 0;

        const found: LinePatch = {
          product_code: j.product_code,
          description: j.description ?? "",
          base_cost: perCase > 0 ? perCase : perUnit,
          active_retail_price: latest?.price ?? 0,
          casesize,
        };

        if (lineNumber === 0) {
          setPending((l) => (l ? recompute({ ...l, ...found }) : l));
          setPendingNonce((n) => n + 1);
          return;
        }

        // Written from outside the boxes, so the boxes are told.
        setDraft((d) => (d ? patchLine(d, lineNumber, found, true) : d));
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => setLookingUp(null));
  };

  /**
   * Build the file and submit it.
   *
   * Locked for the whole round trip: the key carries an HHMMSS stamp, so two
   * presses drop two files for one order and the import would take both. And
   * nothing is refetched afterwards — `all_orders` returns the old figures
   * until the import runs, which would read as the edit being thrown away.
   */
  const handleSubmit = async () => {
    if (submitting || receipt) return;
    if (pending) {
      toast.warn("Add the line you are filling in, or discard it, first.");
      return;
    }
    // The open order counts even untouched, so pressing Submit on it does
    // what it always did; staged orders count only when they changed.
    const toSend = changedDrafts.length
      ? changedDrafts
      : draft
        ? [draft]
        : [];
    if (!toSend.length) return;

    setSubmitting(true);
    let last: UpdateFileResp | null = null;
    const failed: string[] = [];
    let lines = ctx.allOrders;

    // One order at a time: each is its own file for the import, and a burst
    // of them is harder to read back than sending them by hand.
    for (const d of toSend) {
      const payload = buildPayload(d);
      try {
        const resp = await updateOrderFile(
          ctx.url,
          ctx.token,
          payload.storeid,
          payload.lines,
        );
        const j: UpdateFileResp = resp.data;
        if (j.error !== 0) {
          failed.push(`${d.doc.storenumber} order ${d.doc.order_id}: ${j.msg}`);
          continue;
        }
        last = j;
        // The import has not run, so `all_orders` would still return the old
        // figures. Write the sent ones onto the lines held here, or the grid,
        // the flags and "Edit again" all go back to the pre-edit costs.
        lines = applySent(lines, d);
        // Sent — so it is no longer a change waiting to go.
        ctx.dispatch(dropSentDraft({ key: d.doc.key, openKey }));
      } catch (err) {
        failed.push(
          `${d.doc.storenumber} order ${d.doc.order_id}: ${(err as JsonError).message}`,
        );
      }
    }

    setSubmitting(false);
    if (lines !== ctx.allOrders) ctx.dispatch(setAllOrders(lines));
    setSubmittedCounts({
      orders: toSend.length - failed.length,
      edited: toSend.reduce((n, d) => n + editedLines(d).length, 0),
      added: toSend.reduce((n, d) => n + addedLines(d).length, 0),
    });
    if (last) setReceipt(last);
    if (failed.length) {
      toast.warn(`Not sent — ${failed.join("; ")}`);
    } else {
      toast.success(
        toSend.length === 1
          ? "Order update submitted for import."
          : `${toSend.length} order updates submitted for import.`,
      );
    }
  };

  const scopeLabel = isGroupSearch(ctx.type)
    ? (ctx.selectedGroup?.group_name ?? "Group")
    : (ctx.selectedStore?.store_name ?? "Store");

  if (ctx.isMobile) return <OrdersMobile />;

  const hasData = ctx.allOrders.length > 0;

  if (!hasData && !ctx.loadingAllOrders) {
    return (
      <SearchCard
        title="Orders"
        description="Select a store or group and date range to load every order in it."
        buttonLabel="Load orders"
        onSearch={handleSearch}
        loading={ctx.loadingAllOrders}
        loadingMessage="Loading orders..."
        notice={notice}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4 flex gap-3">
      {ctx.ordersExportModalOpen && (
        <OrdersExportModal
          lines={ctx.allOrders}
          filters={ctx.filters}
          applySort={applySort}
          scopeLabel={scopeLabel}
          startDate={ctx.startDate}
          endDate={ctx.endDate}
          onClose={() => ctx.dispatch(setOrdersExportModalOpen(false))}
        />
      )}

      {/* `canEdit` as well as `editing`: the day turns over while a tab is
          open, and an owner who entered on Thursday should not still be in
          edit mode on Friday morning. */}
      {editing && canEdit ? (
        <>
          <OrderPickerPanel
            docs={docs}
            openKey={openKey}
            onPick={handlePick}
            changedKeys={changedKeys}
            storeNumber={pickStore}
            orderDate={pickDate}
            orderType={pickType}
            onStore={setPickStore}
            onDate={setPickDate}
            onType={setPickType}
            onClear={() => {
              setPickStore("");
              setPickDate("");
              setPickType("");
            }}
            onOpenSearch={() => setSearchModalOpen(true)}
            // Only a half-filled new line blocks switching now: every other
            // change stays with its own order's draft.
            blocked={pending !== null}
            startDate={ctx.startDate}
            endDate={ctx.endDate}
            scopeLabel={scopeLabel}
            tab={leftTab}
            onTab={setLeftTab}
            problemsToDo={toDo.length}
            problems={
              <ProblemList
                items={problemItems}
                skipped={skipped}
                openCode={problemCode}
                onPick={setProblemCode}
                marginOver={ctx.filters.marginOver}
                onMarginOver={(v) => ctx.dispatch(setOrdersMarginOver(v))}
                scopeOrders={scopeOrders}
                scopeStores={scopeStores}
              />
            }
          />

          {/* The receipt is laid over this panel, so the two share a stacking
              context of their own rather than the whole page's. */}
          <div className="relative flex flex-1 min-w-0 overflow-hidden">
            {leftTab === "problems" ? (
              <ItemFixPanel
                key={problemCode ?? "none"}
                item={openProblem}
                position={problemPosition}
                scope={problemScope}
                all={ctx.allOrders}
                drafts={drafts}
                onStage={handleStageItem}
                onSkip={handleSkipItem}
                onLeaveEdit={leaveEdit}
                onSubmit={handleSubmit}
                stagedCount={changedDrafts.length}
                submitting={submitting}
              />
            ) : (
            <OrderEditPanel
              onAddLine={handleAddLine}
              pending={pending}
              onPendingField={handlePendingField}
              onPendingPatch={handlePendingPatch}
              onConfirmPending={handleConfirmPending}
              onCancelPending={() => setPending(null)}
              pendingNonce={pendingNonce}
              onLookup={handleLookup}
              lookingUp={lookingUp}
              loadingSubDepts={loadingSubDepts}
              onSubmit={handleSubmit}
              submitting={submitting}
              onLeaveEdit={leaveEdit}
            />
            )}

            <SubmitReceipt
              receipt={receipt}
              orderCount={submittedCounts.orders}
              editedCount={submittedCounts.edited}
              addedCount={submittedCounts.added}
              onClose={() => setReceipt(null)}
              onEditAgain={() => {
                setReceipt(null);
                setPending(null);
                if (draft) setDraft(startDraft(draft.doc, ctx.allOrders));
                setSubmittedCounts({ orders: 0, edited: 0, added: 0 });
              }}
            />
          </div>
        </>
      ) : (
        <>
      <OrdersConfigPanel
        lines={ctx.allOrders}
        filters={ctx.filters}
        onChange={(key: keyof OrdersFilters, values) =>
          ctx.dispatch(setOrdersFilter({ key, values }))
        }
        onMarginOver={(v) => ctx.dispatch(setOrdersMarginOver(v))}
        onClear={() => ctx.dispatch(clearOrdersFilters())}
        loading={ctx.loadingAllOrders}
        matched={gridRows.length}
        startDate={ctx.startDate}
        endDate={ctx.endDate}
        onOpenSearch={() => setSearchModalOpen(true)}
        scopeLabel={scopeLabel}
      />

      <OrderReportPanel
        rows={gridRows}
        sort={sort}
        marginOver={ctx.filters.marginOver}
        onSort={handleSort}
        loading={ctx.loadingAllOrders}
        onExport={() => ctx.dispatch(setOrdersExportModalOpen(true))}
        onEnterEdit={() => setEditing(true)}
        canEdit={canEdit}
      />
        </>
      )}

      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setSearchModalOpen(false)}
        >
          <div className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <SearchCard
              title="Orders"
              description="Select a store or group and date range to load every order in it."
              buttonLabel="Load orders"
              onSearch={() => {
                setSearchModalOpen(false);
                handleSearch();
              }}
              loading={ctx.loadingAllOrders}
              loadingMessage="Loading orders..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
