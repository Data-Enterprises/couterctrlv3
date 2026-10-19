import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { rememberInvestigation } from "../../../../features/dev/devSalesCacheSlice";
import {
  codesIn,
  fetchOrders,
  fetchReceipts,
  fetchSales,
  scopeKey,
  type OrdersWave,
  type ReceiptsWave,
  type SalesWave,
  type Scope,
  type Store,
  type Window,
} from "../shared/investigationData";
import {
  buildFacts,
  summarise,
  type ItemVerdict,
  type Summary,
} from "../shared/deptInvestigation";
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";

/**
 * The investigation, answered in three waves.
 *
 * Each wave updates state as it lands rather than waiting for the slowest, so
 * the grid is readable after the sales calls and every item's cause sharpens
 * behind it. An item starts as a gap with no cause, gains never-ordered or
 * not-received when orders arrive, and only then can a vendor failure be told
 * from a merchandising one.
 *
 * `stage` is what the screen shows about itself: it names the wave still
 * OUTSTANDING, so "receipts" means sales and orders are in hand and the
 * receipt walk is running.
 */

export type Stage = "sales" | "orders" | "receipts" | "done" | "failed";

export interface Investigation {
  stage: Stage;
  items: ItemVerdict[];
  summary: Summary;
  sales: SalesWave | null;
  orders: OrdersWave;
  receipts: ReceiptsWave;
  problem: string | null;
}

/** The resting state, before the orders wave lands. `ok` is true because
 *  nothing has failed yet — the panel reads it alongside `allIn`, which says
 *  whether the answer is in. */
const NO_ORDERS: OrdersWave = {
  ok: true,
  mine: [],
  theirs: [],
  allMine: [],
  allTheirs: [],
};
const NO_RECEIPTS: ReceiptsWave = { mine: [], theirs: [] };

export interface Args {
  mine: Store;
  theirs: Store;
  subDept: number;
  tw: Window;
  lw: Window;
  ly: Window;
  metric: GradingMetric;
  /** False while the view is closed, so nothing is fetched for a panel
   *  nobody has opened. */
  enabled: boolean;
}

export const useDeptInvestigation = (args: Args): Investigation => {
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
    subDept, metric, enabled,
    mine: { storeid: mineId, storeNumber: mineNo },
    theirs: { storeid: theirsId, storeNumber: theirsNo },
    tw, lw, ly,
  } = args;

  const mineName = args.mine.name;
  const theirsName = args.theirs.name;

  const scope = useMemo<Scope>(
    () => ({
      url, token, subDept,
      mine: { storeid: mineId, storeNumber: mineNo, name: mineName },
      theirs: { storeid: theirsId, storeNumber: theirsNo, name: theirsName },
      tw: { start: tw.start, end: tw.end },
      lw: { start: lw.start, end: lw.end },
      ly: { start: ly.start, end: ly.end },
    }),
    [
      // No `metric`: it is applied over the rows, not asked for — see Scope.
      url, token, subDept,
      mineId, mineNo, mineName, theirsId, theirsNo, theirsName,
      tw.start, tw.end, lw.start, lw.end, ly.start, ly.end,
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
      const ordersWave = await fetchOrders(scope);
      if (!live()) return;
      setOrders(ordersWave);
      setStage("receipts");

      const receiptsWave = await fetchReceipts(scope, codesIn(salesWave));
      if (!live()) return;
      setReceipts(receiptsWave);
      setStage("done");

      // Only a complete set is kept — see the note on InvestigationWaves.
      dispatch(
        rememberInvestigation({
          key,
          value: { sales: salesWave, orders: ordersWave, receipts: receiptsWave },
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
          })
        : [],
    [sales, orders, receipts, metric],
  );

  const summary = useMemo(() => summarise(items), [items]);

  return { stage, items, summary, sales, orders, receipts, problem };
};
