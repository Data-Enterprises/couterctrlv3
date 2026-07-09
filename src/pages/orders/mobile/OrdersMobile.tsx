import { useEffect, useState } from "react";
import { useOrdersCtx } from "../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getAllOrders, getAvailableOrders } from "../../../api/orders";
import { getStoresAssignedToUserGroup } from "../../../api/groups";
import {
  setAllOrders,
  setAvailableOrders,
  setGroupedAvailableOrders,
  setSelectedOrderKey,
  setSelectedOrder,
  setLoadingAllOrders,
  setLoadingAvailableOrders,
  setOrdersExportModalOpen,
  setUniqueSubs,
  type GroupedOrderCard,
  type UniqueSub,
} from "../../../features/ordersSlice";
import type { AllOrderResp, AvailableOrderResp, JsonError, Store } from "../../../interfaces";
import { getCogs, getERet, ordersCols } from "..";
import { formatGoliathDate } from "../../../utils";
import SearchCard from "../../../components/SearchCard";
import ExportModal from "../../../components/modals/ExportModal";
import BottomSheet from "../../../components/BottomSheet";
import OrdersAvailableScreen from "./OrdersAvailableScreen";
import OrdersListScreen from "./OrdersListScreen";
import OrdersLineItemsScreen from "./OrdersLineItemsScreen";

type MobileStep = "available" | "list";

const OrdersMobile = () => {
  const ctx = useOrdersCtx();
  const toast = useToast();
  const [step, setStep] = useState<MobileStep>("available");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notice, setNotice] = useState<string | undefined>(undefined);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSearch = () => {
    if (ctx.type === "Group") {
      getStoresAssignedToUserGroup(ctx.url, ctx.token, ctx.userid, ctx.lastGroup)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            const storeids: number[] = j.stores
              .filter((s: any) => s.active)
              .map((s: Store) => s.storeid);
            fetchAvailable(storeids);
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
    ctx.dispatch(setSelectedOrder(null));
    setStep("available");

    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);

    ctx.dispatch(setLoadingAvailableOrders(true));
    getAvailableOrders(ctx.url, ctx.token, start, end, storeids)
      .then((resp) => {
        const j: AvailableOrderResp = resp.data;
        if (j.error === 0) {
          setNotice(
            j.orders.length === 0
              ? "No orders came back for this search."
              : undefined,
          );
          ctx.dispatch(setAvailableOrders(j.orders));

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
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([order_date, storeMap]) => ({
                  order_date,
                  stores: Array.from(storeMap.entries()).map(([storeid, frequency]) => {
                    const assigned = ctx.assignedStores.find((s) => s.storeid === storeid);
                    return { storeid, store_name: assigned?.store_name ?? String(storeid), frequency };
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
    ctx.dispatch(setSelectedOrderKey({ order_date, order_date_end: order_date, order_type, storeids: [storeid] }));
    ctx.dispatch(setSelectedOrder(null));
    ctx.dispatch(setAllOrders([]));

    ctx.dispatch(setLoadingAllOrders(true));
    getAllOrders(ctx.url, ctx.token, order_date, order_date, [storeid])
      .then((resp) => {
        const j: AllOrderResp = resp.data;
        if (j.error === 0) {
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

          // Auto-advance to list; if single order open the sheet immediately
          const filtered = ordersWERet.filter((o) => o.order_type === order_type);
          const ids = Array.from(new Set(filtered.map((o) => o.order_id)));
          if (ids.length === 1) {
            ctx.dispatch(setSelectedOrder({ storeid, orderId: ids[0] }));
            setSheetOpen(true);
          } else {
            setStep("list");
          }
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => ctx.dispatch(setLoadingAllOrders(false)));
  };

  const handleSelectOrderId = (id: number | null) => {
    if (id === null) {
      ctx.dispatch(setSelectedOrder(null));
      return;
    }
    const storeid = ctx.selectedOrderKey?.storeids[0];
    if (storeid !== undefined) {
      ctx.dispatch(setSelectedOrder({ storeid, orderId: id }));
      setSheetOpen(true);
    }
  };

  const hasData = ctx.groupedAvailableOrders.length > 0;

  const handleReset = () => {
    ctx.dispatch(setAvailableOrders([]));
    ctx.dispatch(setGroupedAvailableOrders([]));
    ctx.dispatch(setAllOrders([]));
    ctx.dispatch(setSelectedOrderKey(null));
    ctx.dispatch(setSelectedOrder(null));
    setStep("available");
  };

  return (
    <div className="h-[calc(100dvh-3rem)] overflow-hidden flex flex-col bg-custom-white">
      <ExportModal
        isOpen={ctx.ordersExportModalOpen}
        data={
          ctx.selectedOrder !== null
            ? ctx.allOrders.filter((o) => o.order_id === ctx.selectedOrder!.orderId && o.storeid === ctx.selectedOrder!.storeid)
            : []
        }
        columns={ordersCols}
        onClose={() => ctx.dispatch(setOrdersExportModalOpen(false))}
      />

      {!hasData && !ctx.loadingAvailableOrders && (
        <SearchCard
          top
          title="Orders"
          description="Select a store or group and date range to find available orders."
          buttonLabel="Find orders"
          onSearch={handleSearch}
          loading={ctx.loadingAvailableOrders}
          notice={notice}
        />
      )}

      {(hasData || ctx.loadingAvailableOrders) && (
        <div className="flex-1 overflow-hidden">
          {step === "available" && (
            <OrdersAvailableScreen
              cards={ctx.groupedAvailableOrders}
              selectedKey={ctx.selectedOrderKey}
              loading={ctx.loadingAvailableOrders}
              startDate={ctx.startDate}
              endDate={ctx.endDate}
              onSelectStore={handleSelectStore}
              onOpenSearch={handleReset}
            />
          )}

          {step === "list" && ctx.selectedOrderKey && (
            <OrdersListScreen
              orders={ctx.allOrders}
              loading={ctx.loadingAllOrders}
              selectedKey={ctx.selectedOrderKey}
              assignedStores={ctx.assignedStores}
              onBack={() => setStep("available")}
              onSelectOrderId={handleSelectOrderId}
            />
          )}
        </div>
      )}

      {sheetOpen && ctx.selectedOrderKey && ctx.selectedOrder !== null && (
        <BottomSheet onClose={() => { setSheetOpen(false); ctx.dispatch(setSelectedOrder(null)); }}>
          <OrdersLineItemsScreen
            orders={ctx.allOrders}
            selectedKey={ctx.selectedOrderKey}
            selectedOrderId={ctx.selectedOrder.orderId}
            assignedStores={ctx.assignedStores}
            onExport={() => ctx.dispatch(setOrdersExportModalOpen(true))}
          />
        </BottomSheet>
      )}
    </div>
  );
};

export default OrdersMobile;
