import { useState } from "react";
import { useOrdersCtx } from "./hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getAllOrders, getAvailableOrders } from "../../api/orders";
import { getStoresAssignedToUserGroup } from "../../api/groups";
import {
  setAllOrders,
  setAvailableOrders,
  setGroupedAvailableOrders,
  setSelectedOrderKey,
  setSelectedOrderId,
  setLoadingAllOrders,
  setLoadingAvailableOrders,
  setOrdersExportModalOpen,
  setUniqueSubs,
  type GroupedOrderCard,
  type UniqueSub,
} from "../../features/ordersSlice";
import { setSelectedGroupStores } from "../../features/userSlice";
import type { AllOrderResp, AvailableOrderResp, JsonError, Store } from "../../interfaces";
import { getCogs, getERet, ordersCols } from ".";
import { formatGoliathDate } from "../../utils";

import SearchCard from "../../components/SearchCard";
import ExportModal from "../../components/modals/ExportModal";
import AvailableOrdersPanel from "./components/AvailableOrdersPanel";
import OrderReportPanel from "./components/OrderReportPanel";
import OrdersMobile from "./mobile/OrdersMobile";

const Orders = () => {
  const ctx = useOrdersCtx();
  const toast = useToast();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | undefined>(undefined);

  const handleSearch = () => {
    if (ctx.type === "Group") {
      getStoresAssignedToUserGroup(ctx.url, ctx.token, ctx.userid, ctx.lastGroup)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            const activeStores = j.stores.filter((s: any) => s.active);
            ctx.dispatch(setSelectedGroupStores(activeStores));
            const storeids: number[] = activeStores.map((s: Store) => s.storeid);
            fetchAvailable(storeids);
          } else {
            toast.warn(j.msg);
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    } else {
      fetchAvailable([ctx.lastStore]);
    }
  };

  const fetchAvailable = (storeids: number[]) => {
    ctx.dispatch(setAvailableOrders([]));
    ctx.dispatch(setGroupedAvailableOrders([]));
    ctx.dispatch(setAllOrders([]));
    ctx.dispatch(setSelectedOrderKey(null));
    ctx.dispatch(setSelectedOrderId(null));

    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);

    ctx.dispatch(setLoadingAvailableOrders(true));
    getAvailableOrders(ctx.url, ctx.token, start, end, storeids)
      .then((resp) => {
        const j: AvailableOrderResp = resp.data;
        if (j.error !== 0) {
          toast.warn(j.msg);
          return;
        }
        if (j.error === 0) {
          setNotice(
            j.orders.length === 0
              ? "No orders came back for this search."
              : undefined,
          );
          ctx.dispatch(setAvailableOrders(j.orders));

          // Group by order_type → order_date → stores (frequency = appearances per type+date+store)
          const typeMap = new Map<string, Map<string, Map<number, number>>>();
          for (const o of j.orders) {
            if (!typeMap.has(o.order_type)) typeMap.set(o.order_type, new Map());
            const dateMap = typeMap.get(o.order_type)!;
            if (!dateMap.has(o.order_date)) dateMap.set(o.order_date, new Map());
            const storeMap = dateMap.get(o.order_date)!;
            storeMap.set(o.storeid, (storeMap.get(o.storeid) ?? 0) + 1);
          }

          const cards: GroupedOrderCard[] = Array.from(typeMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([order_type, dateMap]) => ({
              order_type,
              dates: Array.from(dateMap.entries())
                .sort(([a], [b]) => b.localeCompare(a)) // most recent first
                .map(([order_date, storeMap]) => ({
                  order_date,
                  stores: Array.from(storeMap.entries()).map(([storeid, frequency]) => {
                    const assigned = ctx.assignedStores.find((s) => s.storeid === storeid);
                    return {
                      storeid,
                      store_name: assigned?.store_name ?? String(storeid),
                      frequency,
                    };
                  }),
                })),
            }));

          ctx.dispatch(setGroupedAvailableOrders(cards));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => ctx.dispatch(setLoadingAvailableOrders(false)));
  };

  const handleSelectStore = (order_date: string, order_type: string, storeid: number) => {
    ctx.dispatch(setSelectedOrderKey({ order_date, order_type, storeid }));
    ctx.dispatch(setSelectedOrderId(null));
    ctx.dispatch(setAllOrders([]));

    ctx.dispatch(setLoadingAllOrders(true));
    getAllOrders(ctx.url, ctx.token, order_date, order_date, [storeid])
      .then((resp) => {
        const j: AllOrderResp = resp.data;
        if (j.error === 0) {
          if (j.orders.length === 0) {
            toast.warn("No orders came back for this search.");
          }
          const ordersWERet = j.orders.map((o) => {
            const base_cost = o.base_cost ?? 0;
            const net_cost = o.net_cost ?? 0;
            const weight = o.weight ?? 0;
            const casesize = o.casesize ?? 0;
            const e_ret = getERet(o.qty, weight, o.active_retail_price, o.scalable);
            const cogs = getCogs(base_cost, o.qty, o.scalable, weight, casesize);
            const rev = e_ret - cogs;
            return { ...o, e_ret, base_cost, net_cost, weight, casesize, cogs, rev };
          });

          const uniqueSubs = ordersWERet.reduce((acc: UniqueSub[], o) => {
            if (!acc.some((a) => a.subId === o.sub_department)) {
              acc.push({
                desc: o.sub_department_description ?? "null",
                subId: o.sub_department,
                count: ordersWERet.filter((f) => f.sub_department === o.sub_department).length,
              });
            }
            return acc;
          }, []);

          ctx.dispatch(setUniqueSubs(uniqueSubs));
          ctx.dispatch(setAllOrders(ordersWERet));
        } else {
          toast.warn(j.msg);
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => ctx.dispatch(setLoadingAllOrders(false)));
  };

  if (ctx.isMobile) return <OrdersMobile />;

  const hasData = ctx.groupedAvailableOrders.length > 0;

  if (!hasData && !ctx.loadingAvailableOrders) {
    return (
      <SearchCard
        title="Orders"
        description="Select a store or group and date range to find available orders."
        buttonLabel="Find orders"
        onSearch={handleSearch}
        loading={ctx.loadingAvailableOrders}
        notice={notice}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4 flex gap-3">
      <ExportModal
        isOpen={ctx.ordersExportModalOpen}
        data={ctx.selectedOrderId !== null ? ctx.allOrders.filter((o) => o.order_id === ctx.selectedOrderId) : []}
        columns={ordersCols}
        onClose={() => ctx.dispatch(setOrdersExportModalOpen(false))}
      />

      <AvailableOrdersPanel
        cards={ctx.groupedAvailableOrders}
        selectedKey={ctx.selectedOrderKey}
        loading={ctx.loadingAvailableOrders}
        onSelectStore={handleSelectStore}
        onOpenSearch={() => setSearchModalOpen(true)}
        onReset={() => {
          ctx.dispatch(setSelectedOrderKey(null));
          ctx.dispatch(setSelectedOrderId(null));
          ctx.dispatch(setAllOrders([]));
        }}
        startDate={ctx.startDate}
        endDate={ctx.endDate}
        type={ctx.type}
        selectedGroup={ctx.selectedGroup}
        selectedStore={ctx.selectedStore}
        groupStores={ctx.selectedGroupStores}
      />

      <OrderReportPanel
        orders={ctx.allOrders}
        loading={ctx.loadingAllOrders}
        selectedKey={ctx.selectedOrderKey}
        selectedOrderId={ctx.selectedOrderId}
        assignedStores={ctx.assignedStores}
        onSelectOrderId={(id) => ctx.dispatch(setSelectedOrderId(id))}
        onExport={() => ctx.dispatch(setOrdersExportModalOpen(true))}
      />
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchModalOpen(false)}
        >
          <div className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <SearchCard
              title="Orders"
              description="Select a store or group and date range to find available orders."
              buttonLabel="Find orders"
              onSearch={() => { setSearchModalOpen(false); handleSearch(); }}
              loading={ctx.loadingAvailableOrders}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
