import { useMemo, useState } from "react";
import { useOrdersCtx } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getAllOrders, updateOrderFile } from "../../../api/orders";
import { getItemLookupSingleStore } from "../../../api/itemLookup";
import { getSubDeptCatalog } from "../../../api/subDeptExclusions";
import { getStoresAssignedToUserGroup } from "../../../api/groups";
import {
  setAllOrders,
  setLoadingAllOrders,
  setOrdersExportModalOpen,
  setOrdersFilter,
  clearOrdersFilters,
  setOrdersMarginOver,
  setUniqueSubs,
  type OrdersFilters,
  type UniqueSub,
} from "../../../features/dev/devOrdersSlice";
import { setSelectedGroupStores } from "../../../features/userSlice";
import type {
  AllOrderResp,
  JsonError,
  Store,
  UpdateFileResp,
} from "../../../interfaces";
import { getCogs, getERet } from ".";
import { buildRows } from "./ordersRows";
import { useTriStateSort } from "../../../utils/useTriStateSort";
import type { SortKey } from "./ordersRows";
import { formatGoliathDate } from "../../../utils";

import {
  addedLines,
  appendLine,
  applyField,
  applyUnitCost,
  stageUnitCost,
  blankLine,
  buildDocs,
  buildPayload,
  changedLines,
  dropLine,
  editedLines,
  nextSeq,
  patchLine,
  recompute,
  revertAll,
  revertLine,
  startDraft,
  type DraftLine,
  canEditOrders,
  type EditableField,
  type LinePatch,
  type OrderDoc,
  type OrderDraft,
  linesInPick,
  applySent,
  docKey,
} from "./orderEdit";

import SearchCard from "../../../components-dev/SearchCard";
import OrderPickerPanel from "./components/OrderPickerPanel";
import OrderEditPanel, {
  type EditSearch,
  type SubDeptOption,
} from "./components/OrderEditPanel";
import SubmitReceipt from "./components/SubmitReceipt";
import OrdersExportModal from "./components/OrdersExportModal";
import ProblemList from "./components/ProblemList";
import ItemFixPanel from "./components/ItemFixPanel";
import { itemsInScope, workingOrder } from "./problemItems";
import OrdersConfigPanel from "./components/OrdersConfigPanel";
import OrderReportPanel from "./components/OrderReportPanel";
import OrdersMobile from "./mobile/OrdersMobile";
import { isGroupSearch } from "../../../features/searchSlice";

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
   * Edit mode, and the one order it is editing.
   *
   * The draft lives here rather than in the slice for the same reason the
   * filtering does: it is one page's working copy of rows the slice already
   * holds, and a reducer per keystroke buys nothing. It is dropped when the
   * search reloads, because the lines it was built from are gone.
   */
  const [editing, setEditing] = useState(false);
  /**
   * A draft per order, and which one is open.
   *
   * It used to be one draft, because a save carries one order. Fix cost
   * changes every order the filters hit, so those changes have to live
   * somewhere until they are submitted — and switching to another order must
   * not throw away the one you just changed. Each order keeps its own draft
   * here; the edit panel shows whichever is open.
   */
  const [drafts, setDrafts] = useState<Record<string, OrderDraft>>({});
  /** What the last Submit sent, for the receipt — it can be many orders. */
  const [submittedCounts, setSubmittedCounts] = useState({
    orders: 0,
    edited: 0,
    added: 0,
  });
  const [openKey, setOpenKey] = useState<string | null>(null);
  const draft = openKey ? (drafts[openKey] ?? null) : null;

  /**
   * The open order's draft, with the signature the single-draft setter had,
   * so every handler that edits a line is unchanged.
   *
   * A value opens that order (adding it if it is new); a function edits the
   * open one; null drops them all, which is what a reloaded search needs.
   */
  const setDraft = (
    next:
      | OrderDraft
      | null
      | ((d: OrderDraft | null) => OrderDraft | null),
  ) => {
    if (next === null) {
      setDrafts({});
      setOpenKey(null);
      return;
    }
    if (typeof next === "function") {
      setDrafts((ds) => {
        if (!openKey) return ds;
        const updated = next(ds[openKey] ?? null);
        return updated ? { ...ds, [openKey]: updated } : ds;
      });
      return;
    }
    setDrafts((ds) => ({ ...ds, [next.doc.key]: next }));
    setOpenKey(next.doc.key);
  };

  /** Every order with something to send, open or not. */
  const changedDrafts = Object.values(drafts).filter(
    (d) => changedLines(d).length > 0,
  );
  const changedKeys = new Set(changedDrafts.map((d) => d.doc.key));
  const [pickStore, setPickStore] = useState("");
  const [pickDate, setPickDate] = useState("");
  const [pickType, setPickType] = useState("");

  /**
   * The Problems tab.
   *
   * `problemCode` is the item open on the right while the tab is showing.
   * `skipped` is session-only and never saved: a high margin is sometimes
   * the real price, and Skip is how somebody says "looked, it's fine" without
   * that becoming a rule anyone has to undo later.
   */
  const [leftTab, setLeftTab] = useState<"orders" | "problems">("orders");
  const [problemCode, setProblemCode] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  /** The lines on the orders the left panel shows — what a fix may reach. */
  const pickScope = useMemo(
    () =>
      linesInPick(ctx.allOrders, {
        storeNumber: pickStore,
        orderDate: pickDate,
        orderType: pickType,
      }),
    [ctx.allOrders, pickStore, pickDate, pickType],
  );
  const scopeStores = useMemo(
    () => new Set(pickScope.map((o) => `${o.storeid}|${o.storenumber}`)).size,
    [pickScope],
  );
  const scopeOrders = useMemo(
    () => new Set(pickScope.map(docKey)).size,
    [pickScope],
  );
  const problemItems = useMemo(
    () => itemsInScope(pickScope, drafts, ctx.filters.marginOver),
    [pickScope, drafts, ctx.filters.marginOver],
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
    const rows = pickScope.filter(
      (o) => String(o.product_code) === problemCode && keySet.has(docKey(o)),
    );
    setDrafts((ds) => stageUnitCost(ds, rows, ctx.allOrders, unit));
    setProblemCode(nextAfter(problemCode, new Set([problemCode])));
  };

  const handleSkipItem = () => {
    if (!problemCode) return;
    const nextSkipped = new Set(skipped).add(problemCode);
    setSkipped(nextSkipped);
    setProblemCode(nextAfter(problemCode, new Set([problemCode])));
  };
  const [editSearch, setEditSearch] = useState<EditSearch>({
    code: "",
    desc: "",
    onlyChanged: false,
  });
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
  const [receipt, setReceipt] = useState<UpdateFileResp | null>(null);
  /**
   * The sub departments each store has, by storeid.
   *
   * Asked for once per store and kept, because the answer does not change
   * while somebody edits an order and the catalog is a grouped scan of
   * `sales_partitioned` — not a thing to re-ask on every added line.
   */
  const [subDeptsByStore, setSubDeptsByStore] = useState<
    Record<number, SubDeptOption[]>
  >({});
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


  /**
   * The vendors already on this store's orders.
   *
   * `items/itemlookup` does not return a `vendor_id` and the column is
   * `NOT NULL`, so an added line asks for one — out of the vendors the store
   * really orders from, because an id the POS does not know is worse than no
   * line.
   */
  const vendors = useMemo(() => {
    if (!draft) return [];
    const seen = new Map<string, string>();
    for (const o of ctx.allOrders) {
      if (o.storeid !== draft.doc.storeid || !o.vendor_id) continue;
      if (!seen.has(o.vendor_id)) seen.set(o.vendor_id, o.vendor_name ?? o.vendor_id);
    }
    // By name, which is what the column and the picker show — an id is how
    // the row stores a vendor, not how anybody looks one up.
    return [...seen.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ctx.allOrders, draft]);

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
    setDrafts((ds) =>
      ds[doc.key] ? ds : { ...ds, [doc.key]: startDraft(doc, ctx.allOrders) },
    );
    setOpenKey(doc.key);
    setPending(null);
    setReceipt(null);
    setEditSearch({ code: "", desc: "", onlyChanged: false });
  };

  const handleField = (
    lineNumber: number,
    field: EditableField,
    value: number,
  ) => setDraft((d) => (d ? applyField(d, lineNumber, field, value) : d));

  /** A typed unit cost, stored as the case cost it implies. */
  const handleUnitCost = (lineNumber: number, unit: number) =>
    setDraft((d) => (d ? applyUnitCost(d, lineNumber, unit) : d));

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
        setSubDeptsByStore((prev) => ({
          ...prev,
          [storeid]: [...seen.entries()]
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        }));
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

  /** Everything typed or picked on an added line comes through here. */
  const handlePatch = (lineNumber: number, patch: LinePatch) =>
    setDraft((d) => (d ? patchLine(d, lineNumber, patch) : d));

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
        setDrafts((ds) => {
          const { [d.doc.key]: _sent, ...rest } = ds;
          return d.doc.key === openKey ? ds : rest;
        });
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
                scope={pickScope}
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
              draft={draft}
              loading={ctx.loadingAllOrders}
              search={editSearch}
              onSearch={setEditSearch}
              onField={handleField}
              onUnitCost={handleUnitCost}
              onRevertLine={(ln) =>
                setDraft((d) => (d ? revertLine(d, ln) : d))
              }
              onRevertAll={() => setDraft((d) => (d ? revertAll(d) : d))}
              onAddLine={handleAddLine}
              onDropLine={(ln) => setDraft((d) => (d ? dropLine(d, ln) : d))}
              pending={pending}
              onPendingField={handlePendingField}
              onPendingPatch={handlePendingPatch}
              onConfirmPending={handleConfirmPending}
              onCancelPending={() => setPending(null)}
              pendingSeq={draft ? nextSeq(draft) : 1}
              pendingNonce={pendingNonce}
              onLookup={handleLookup}
              onPatch={handlePatch}
              lookingUp={lookingUp}
              vendors={vendors}
              subDepts={draft ? (subDeptsByStore[draft.doc.storeid] ?? []) : []}
              loadingSubDepts={loadingSubDepts}
              onSubmit={handleSubmit}
              onFixCost={() => setLeftTab("problems")}
              stagedCount={changedDrafts.length}
              submitting={submitting}
              submitted={receipt !== null}
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
