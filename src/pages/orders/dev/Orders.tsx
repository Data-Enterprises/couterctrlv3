import { useMemo, useState } from "react";
import { useOrdersCtx } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getAllOrders } from "../../../api/orders";
import { getStoresAssignedToUserGroup } from "../../../api/groups";
import {
  setAllOrders,
  setLoadingAllOrders,
  setOrdersExportModalOpen,
  setOrdersFilter,
  clearOrdersFilters,
  setUniqueSubs,
  type OrdersFilters,
  type UniqueSub,
} from "../../../features/dev/devOrdersSlice";
import { setSelectedGroupStores } from "../../../features/userSlice";
import type { AllOrderResp, JsonError, Store } from "../../../interfaces";
import { getCogs, getERet } from ".";
import { buildRows } from "./ordersRows";
import { useTriStateSort } from "../../../utils/useTriStateSort";
import type { SortKey } from "./ordersRows";
import { formatGoliathDate } from "../../../utils";

import SearchCard from "../../../components-dev/SearchCard";
import OrdersExportModal from "./components/OrdersExportModal";
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
  const [notice, setNotice] = useState<string | undefined>(undefined);
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

      <OrdersConfigPanel
        lines={ctx.allOrders}
        filters={ctx.filters}
        onChange={(key: keyof OrdersFilters, values) =>
          ctx.dispatch(setOrdersFilter({ key, values }))
        }
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
        onSort={handleSort}
        loading={ctx.loadingAllOrders}
        onExport={() => ctx.dispatch(setOrdersExportModalOpen(true))}
      />

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
