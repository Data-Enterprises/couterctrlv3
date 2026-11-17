// Hooks
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../hooks";
import { useSalesCtx } from "../../hooks";

// Redux
import { rememberInvestigation } from "../../../../../features/dev/devSalesCacheSlice";
import { setInvestigationGrid } from "../../../../../features/dev/devSalesLedgerSlice";

// Utils
import {
  codesIn,
  fetchOrders,
  fetchReceipts,
  fetchSales,
  ordersKnownFor,
  scopeKey,
  type OrdersWave,
  type ReceiptsWave,
  type SalesWave,
  type Scope,
} from "../utils/investigationData";
import { buildFacts, summarise } from "../utils/investigationFacts";
import { nextSort, sortRows } from "../../../../../utils/useTriStateSort";
import { PAGE_ROWS } from "../utils";
import { sortValue } from "../utils/columns";

// Interfaces
import type {
  Cause,
  Col,
  ItemVerdict,
  FilterKind,
  Investigation,
  InvestigationArgs,
  Stage,
} from "../interfaces";

/** The grid's four column filters and the list they leave. The applied
 *  filters are in the slice, since the other tabs set the cause and vendor;
 *  the text still being typed stays here. */
export const useItemFilters = (items: ItemVerdict[]) => {
  const dispatch = useAppDispatch();
  const { investigationGrid } = useSalesCtx();
  const { cause: only, itemQ, upcQ, vendorQ } = investigationGrid;
  const [itemDraft, setItemDraft] = useState(itemQ);
  const [upcDraft, setUpcDraft] = useState(upcQ);
  const setOnly = (cause: Cause | null) =>
    dispatch(setInvestigationGrid({ cause }));
  const setVendorQ = (v: string) =>
    dispatch(setInvestigationGrid({ vendorQ: v }));

  /** Every vendor in the department, so the vendor filter is a list to pick
   *  from rather than a spelling to guess at. */
  const vendors = useMemo(
    () =>
      [...new Set(items.map((i) => i.vendorName).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [items],
  );

  const shown = useMemo(() => {
    const item = itemQ.trim().toLowerCase();
    const upc = upcQ.trim().toLowerCase();
    return items.filter(
      (i) =>
        (!only || i.cause === only) &&
        (!item || i.description.toLowerCase().includes(item)) &&
        (!upc || i.productCode.toLowerCase().includes(upc)) &&
        (!vendorQ || i.vendorName === vendorQ),
    );
  }, [items, only, itemQ, upcQ, vendorQ]);

  const filterActive = (k: FilterKind) =>
    k === "item"
      ? !!itemQ
      : k === "upc"
        ? !!upcQ
        : k === "vendor"
          ? !!vendorQ
          : only !== null;

  /** Text filters commit on Apply; the two pickers have already committed by
   *  the time the button is reachable, so Apply just closes the popover. */
  const applyFilter = (k: FilterKind) => {
    if (k === "item") dispatch(setInvestigationGrid({ itemQ: itemDraft }));
    if (k === "upc") dispatch(setInvestigationGrid({ upcQ: upcDraft }));
  };

  const clearFilter = (k: FilterKind) => {
    if (k === "item") {
      dispatch(setInvestigationGrid({ itemQ: "" }));
      setItemDraft("");
    }
    if (k === "upc") {
      dispatch(setInvestigationGrid({ upcQ: "" }));
      setUpcDraft("");
    }
    if (k === "vendor") setVendorQ("");
    if (k === "cause") setOnly(null);
  };

  return {
    only,
    setOnly,
    itemDraft,
    setItemDraft,
    upcDraft,
    setUpcDraft,
    vendorQ,
    setVendorQ,
    vendors,
    shown,
    filterActive,
    applyFilter,
    clearFilter,
  };
};

/** The rows picked out in the grid, and the right-click menu over them. */
export const useRowSelection = (
  sorted: ItemVerdict[],
  picked: string | null,
  setPicked: (code: string | null) => void,
  show: (code: string) => void,
) => {
  /**
   * Rows picked out, by product code.
   *
   * The grid is a spreadsheet to everybody who uses one, and the thing they
   * try first is dragging across rows to take them somewhere else. Click
   * selects, shift extends, ctrl adds, and the copy keys put it on the
   * clipboard as tab-separated text — which is what a spreadsheet pastes.
   *
   * Opening the evidence moves to a double click for the same reason: a
   * single click on a spreadsheet row selects it, and a panel that opened
   * on the way to selecting three rows would be in the way three times.
   */
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  /** Where a shift-range measures from. */
  const anchor = useRef<string | null>(null);
  const [ctx, setCtx] = useState<{ x: number; y: number; upc: string } | null>(
    null,
  );

  /**
   * Click, shift-click, ctrl-click — the three a grid is expected to answer.
   *
   * Shift measures from the anchor through the SORTED list rather than the
   * page, so a range that crosses a page boundary is still a range; what is
   * off-screen is still selected and still copies.
   */
  const pickRow = (
    e: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
    code: string,
  ) => {
    const add = e.ctrlKey || e.metaKey;
    if (e.shiftKey && anchor.current) {
      const a = sorted.findIndex((r) => r.productCode === anchor.current);
      const b = sorted.findIndex((r) => r.productCode === code);
      if (a >= 0 && b >= 0) {
        const span = sorted
          .slice(Math.min(a, b), Math.max(a, b) + 1)
          .map((r) => r.productCode);
        setChosen(new Set(add ? [...chosen, ...span] : span));
        return;
      }
    }
    anchor.current = code;
    if (add) {
      const next = new Set(chosen);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      setChosen(next);
      return;
    }

    /* A plain click opens the item. Shift and ctrl are what build a
       selection to copy, and they never open anything — so picking out
       nine rows does not throw the panel open nine times.

       Clicking the row that is already open closes it again, which is also
       the way back to nothing selected. */
    const only = chosen.size === 1 && chosen.has(code);
    setChosen(only ? new Set() : new Set([code]));
    if (only) setPicked(null);
    else show(code);
  };

  /** Picked out, either by the selection or by the rail. */
  const isOn = (code: string) => picked === code || chosen.has(code);

  return { chosen, setChosen, anchor, ctx, setCtx, pickRow, isOn };
};

/**
 * The Items grid: filtered, sorted and paged, with the open item.
 *
 * The state is in the slice, so the page (the header's export, the other
 * tabs' "show in grid") and the Items tab read the same grid.
 */
export const useItemsGrid = (items: ItemVerdict[]) => {
  const dispatch = useAppDispatch();
  const { investigationGrid } = useSalesCtx();
  const { sort, page, picked, supplyUpcs } = investigationGrid;
  const filters = useItemFilters(items);

  const sorted = sortRows(filters.shown, sort, sortValue);
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_ROWS));
  /* Clamped rather than reset: a filter that shortens the list below the
     current page should land on the last one, not throw the reader back to
     the first. */
  const at_ = Math.min(page, pages - 1);
  const from = at_ * PAGE_ROWS;
  const capped = sorted.slice(from, from + PAGE_ROWS);

  const handleSort = (col: Col) =>
    dispatch(setInvestigationGrid({ sort: nextSort(sort, col) }));
  const setPage = (p: number) => dispatch(setInvestigationGrid({ page: p }));
  const setPicked = (code: string | null) =>
    dispatch(setInvestigationGrid({ picked: code }));
  const setSupplyUpcs = (upcs: string) =>
    dispatch(setInvestigationGrid({ supplyUpcs: upcs }));

  /**
   * An item chosen anywhere else lands on the page that holds it.
   *
   * The Summary tab's list and the hand-off's lists both pick an item and
   * switch to the grid. Without this the grid stays on page one and the
   * selected row is somewhere the reader cannot see, which reads as the
   * click having done nothing.
   */
  const show = (code: string) => {
    const i = sorted.findIndex((r) => r.productCode === code);
    dispatch(
      setInvestigationGrid(
        i >= 0
          ? { page: Math.floor(i / PAGE_ROWS), picked: code }
          : { picked: code },
      ),
    );
  };

  /** Stepping walks the list the GRID is showing, not every item in the
   *  department: arrowing through "never ordered" should not wander out of
   *  it halfway down. It walks the whole filtered list rather than the
   *  page, because a page boundary is a fact about the table and not about
   *  the items — the page follows the rail instead. */
  const at = sorted.findIndex((r) => r.productCode === picked);
  const stepItem = (d: number) => {
    const next = sorted[at + d];
    if (next)
      dispatch(
        setInvestigationGrid({
          page: Math.floor((at + d) / PAGE_ROWS),
          picked: next.productCode,
        }),
      );
  };

  return {
    filters,
    sort,
    handleSort,
    sorted,
    pages,
    at_,
    from,
    capped,
    setPage,
    picked,
    setPicked,
    show,
    at,
    stepItem,
    supplyUpcs,
    setSupplyUpcs,
  };
};

/**
 * The investigation, answered in three waves.
 *
 * Each wave updates state as it lands rather than waiting for the slowest, so
 * the grid is readable after the sales calls and every item's cause sharpens
 * behind it. An item starts as a gap with no cause, gains never-ordered or
 * no-receiver-on-file when orders arrive, and only then can a supply gap be
 * told from a merchandising one.
 *
 * `stage` is what the screen shows about itself: it names the wave still
 * OUTSTANDING, so "receipts" means sales and orders are in hand and the
 * receipt walk is running.
 */

/** The resting state, before the orders wave lands. `ok` is true because
 *  nothing has failed yet — the panel reads it alongside `allIn`, which says
 *  whether the answer is in. */
const NO_ORDERS: OrdersWave = {
  ok: true,
  inWindow: 0,
  mine: [],
  theirs: [],
  allMine: [],
  allTheirs: [],
};
const NO_RECEIPTS: ReceiptsWave = { ok: true, mine: [], theirs: [] };

export const useDeptInvestigation = (
  args: InvestigationArgs,
): Investigation => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => ({
    url: state.app.url,
    token: state.app.token,
  }));

  const [sales, setSales] = useState<SalesWave | null>(null);
  const [orders, setOrders] = useState<OrdersWave>(NO_ORDERS);
  const [receipts, setReceipts] = useState<ReceiptsWave>(NO_RECEIPTS);
  const [stage, setStage] = useState<Stage>("sales");
  const [problem, setProblem] = useState<string | null>(null);

  // Primitives in the dependency list, because a Scope object rebuilt every
  // render would restart the whole cascade on every keystroke elsewhere.
  const {
    metric,
    enabled,
    mine: { storeid: mineId, storeNumber: mineNo, subDept: mineDept },
    theirs: { storeid: theirsId, storeNumber: theirsNo, subDept: theirsDept },
    tw,
    lw,
    ly,
  } = args;

  const mineName = args.mine.name;
  const theirsName = args.theirs.name;

  const scope = useMemo<Scope>(
    () => ({
      url,
      token,
      mine: {
        storeid: mineId,
        storeNumber: mineNo,
        name: mineName,
        subDept: mineDept,
      },
      theirs: {
        storeid: theirsId,
        storeNumber: theirsNo,
        name: theirsName,
        subDept: theirsDept,
      },
      tw: { start: tw.start, end: tw.end },
      lw: { start: lw.start, end: lw.end },
      ly: { start: ly.start, end: ly.end },
    }),
    [
      // No `metric`: it is applied over the rows, not asked for — see Scope.
      url,
      token,
      mineDept,
      theirsDept,
      mineId,
      mineNo,
      mineName,
      theirsId,
      theirsNo,
      theirsName,
      tw.start,
      tw.end,
      lw.start,
      lw.end,
      ly.start,
      ly.end,
    ],
  );

  /** Everything this department was already told, if it has been opened
   *  since the last search. Going back and opening it again is the common
   *  move, and it used to cost all nine requests a second time. */
  const key = scopeKey(scope);
  const cached = useAppSelector(
    (state) => state.dev.salesCache.investigation[key],
  );

  // Held in a ref as well so the cascade can read the latest without the
  // effect depending on state it sets itself.
  const run = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    // Already in hand. Restored whole rather than re-staged, so the screen
    // opens finished instead of replaying three waves of loading text over
    // data it never gave up.
    if (cached) {
      run.current++;
      setSales(cached.sales);
      setOrders(cached.orders);
      setReceipts(cached.receipts);
      setStage("done");
      setProblem(null);
      return;
    }

    const ticket = ++run.current;
    const live = () => ticket === run.current;

    setSales(null);
    setOrders(NO_ORDERS);
    setReceipts(NO_RECEIPTS);
    setStage("sales");
    setProblem(null);

    (async () => {
      let salesWave: SalesWave;
      try {
        salesWave = await fetchSales(scope);
      } catch {
        if (live()) {
          setStage("failed");
          setProblem("This department's items could not be loaded.");
        }
        return;
      }
      if (!live()) return;
      setSales(salesWave);
      setStage("orders");

      // Orders and receipts both resolve empty on failure rather than
      // throwing — a thinner answer, not a wrong one, and not worth taking
      // the grid away for.
      const ordersWave = await fetchOrders(scope, codesIn(salesWave));
      if (!live()) return;
      setOrders(ordersWave);
      setStage("receipts");

      const receiptsWave = await fetchReceipts(scope, codesIn(salesWave));
      if (!live()) return;
      setReceipts(receiptsWave);
      setStage("done");

      // Only a complete set is kept — see the note on InvestigationWaves. A
      // wave that failed is not complete, so the next visit asks again.
      if (!ordersWave.ok || !receiptsWave.ok) return;
      dispatch(
        rememberInvestigation({
          key,
          value: {
            sales: salesWave,
            orders: ordersWave,
            receipts: receiptsWave,
          },
        }),
      );
    })();

    return () => {
      // Bumping the ticket is what makes an in-flight cascade stop writing.
      run.current++;
    };
  }, [scope, enabled, cached, key, dispatch]);

  const items = useMemo(
    () =>
      sales
        ? buildFacts({
            ...sales,
            orders: orders.mine,
            receivers: receipts.mine,
            metric,
            ordersKnown: ordersKnownFor(orders),
            // A set cached before `ok` existed was complete by definition.
            receiptsKnown: receipts.ok !== false,
          })
        : [],
    [sales, orders, receipts, metric],
  );

  const summary = useMemo(() => summarise(items), [items]);

  return { stage, items, summary, sales, orders, receipts, problem };
};
