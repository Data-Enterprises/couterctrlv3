import { useEffect, useState } from "react";
import { applyStoreNumberToName, numbersByStoreId } from "../../../utils/storeIdentity";
import { useOrdersCtx } from "../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getAllOrders, getAvailableOrders } from "../../../api/orders";
import { getStoresAssignedToUserGroup } from "../../../api/groups";
import { setSelectedGroupStores } from "../../../features/userSlice";
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
import { getCogs, getERet } from "..";
import { formatGoliathDate, resolveStoreName } from "../../../utils";
import SearchCard from "../../../components/SearchCard";
import BottomSheet from "../../../components/BottomSheet";
import OrdersAvailableScreen from "./OrdersAvailableScreen";
import OrdersListScreen from "./OrdersListScreen";
import OrdersLineItemsScreen from "./OrdersLineItemsScreen";
import OrdersExportSheet from "./OrdersExportSheet";

type MobileStep = "available" | "list";

const fmtExportDate = (iso: string) => {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${m}/${d}/${y}`;
};

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
            const activeStores = j.stores.filter((s: any) => s.active);
            // Desktop files these too — they're how store names resolve for
            // stores in the group the user isn't personally assigned to.
            ctx.dispatch(setSelectedGroupStores(activeStores));
            fetchAvailable(activeStores.map((s: Store) => s.storeid));
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
    ctx.dispatch(setSelectedOrder(null));
    setStep("available");

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

          // Keyed on storeid + storenumber — see Orders.tsx and
          // utils/storeIdentity for why the id alone isn't a location.
          const numbersById = numbersByStoreId(j.orders, (o) => o.storeid, (o) => o.storenumber);
          const typeMap = new Map<
            string,
            Map<string, Map<string, { storeid: number; storenumber: string; frequency: number }>>
          >();
          for (const o of j.orders) {
            if (!typeMap.has(o.order_type)) typeMap.set(o.order_type, new Map());
            const dateMap = typeMap.get(o.order_type)!;
            if (!dateMap.has(o.order_date)) dateMap.set(o.order_date, new Map());
            const storeMap = dateMap.get(o.order_date)!;
            const key = `${o.storeid}__${o.storenumber}`;
            const entry = storeMap.get(key);
            if (entry) entry.frequency += 1;
            else storeMap.set(key, { storeid: o.storeid, storenumber: o.storenumber, frequency: 1 });
          }

          const cards: GroupedOrderCard[] = Array.from(typeMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([order_type, dateMap]) => ({
              order_type,
              dates: Array.from(dateMap.entries())
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([order_date, storeMap]) => ({
                  order_date,
                  stores: Array.from(storeMap.values()).map(({ storeid, storenumber, frequency }) => {
                    const assigned = ctx.assignedStores.find((s) => s.storeid === storeid);
                    return {
                      storeid,
                      storenumber,
                      store_name: applyStoreNumberToName(
                        assigned?.store_name ?? String(storeid),
                        storenumber,
                        numbersById[storeid] ?? [],
                      ),
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

  const fetchOrderDetails = (start_date: string, end_date: string, order_type: string, storeids: number[], storenumbers: string[] | null = null) => {
    ctx.dispatch(setSelectedOrderKey({ order_date: start_date, order_date_end: end_date, order_type, storeids, storenumbers }));
    ctx.dispatch(setSelectedOrder(null));
    ctx.dispatch(setAllOrders([]));

    ctx.dispatch(setLoadingAllOrders(true));
    getAllOrders(ctx.url, ctx.token, start_date, end_date, storeids)
      .then((resp) => {
        const j: AllOrderResp = resp.data;
        if (j.error !== 0) {
          toast.warn(j.msg);
          return;
        }
        if (j.error === 0) {
          if (j.orders.length === 0) {
            // Without this the screen advances to an empty list with nothing
            // saying why.
            toast.warn("No orders came back for this search.");
          }
          // Fetched by storeid — a co-located storeid returns both locations.
          const scopedOrders = storenumbers
            ? j.orders.filter((o) => storenumbers.includes(o.storenumber))
            : j.orders;
          const ordersWERet = scopedOrders.map((o) => {
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

          // Auto-advance to list; if there's only one order open the sheet
          // immediately. Keyed on storeid + storenumber + order_id, matching
          // OrderReportPanel — the same order_id can exist at two stores, and
          // counting by id alone would call that one order and skip the list.
          const filtered = ordersWERet.filter((o) => o.order_type === order_type);
          const keys = new Map<string, { storeid: number; storenumber: string; orderId: number }>();
          filtered.forEach((o) => {
            const key = `${o.storeid}__${o.storenumber}:${o.order_id}`;
            if (!keys.has(key))
              keys.set(key, { storeid: o.storeid, storenumber: o.storenumber, orderId: o.order_id });
          });
          if (keys.size === 1) {
            ctx.dispatch(setSelectedOrder([...keys.values()][0]));
            setSheetOpen(true);
          } else {
            setStep("list");
          }
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => ctx.dispatch(setLoadingAllOrders(false)));
  };

  const handleSelectStore = (order_date: string, order_type: string, storeid: number, storenumber: string) => {
    fetchOrderDetails(order_date, order_date, order_type, [storeid], [storenumber]);
  };

  // No date filter selected → span the whole search range instead of one day.
  const handleSelectAllStores = (order_date: string, order_type: string, storeids: number[]) => {
    if (order_date) {
      fetchOrderDetails(order_date, order_date, order_type, storeids);
    } else {
      fetchOrderDetails(formatGoliathDate(ctx.startDate), formatGoliathDate(ctx.endDate), order_type, storeids);
    }
  };

  // The list hands back the order's own store, not just its id — with "select
  // all stores" an order can belong to any store in the selection, and two of
  // them can share an order_id.
  const handleSelectOrder = (
    sel: { storeid: number; storenumber: string; orderId: number } | null,
  ) => {
    if (sel === null) {
      ctx.dispatch(setSelectedOrder(null));
      return;
    }
    ctx.dispatch(setSelectedOrder(sel));
    setSheetOpen(true);
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

  // ── Export sheet data — mirrors desktop's OrderReportPanel.tsx computations ──
  const storeNames = ctx.selectedOrderKey
    ? ctx.selectedOrderKey.storeids.map((id) =>
        resolveStoreName(ctx.assignedStores, ctx.selectedGroupStores, id, `Store ${id}`),
      )
    : [];

  const exportDateLabel = ctx.selectedOrderKey
    ? ctx.selectedOrderKey.order_date === ctx.selectedOrderKey.order_date_end
      ? fmtExportDate(ctx.selectedOrderKey.order_date)
      : `${fmtExportDate(ctx.selectedOrderKey.order_date)} – ${fmtExportDate(ctx.selectedOrderKey.order_date_end)}`
    : "";

  const filteredOrders = ctx.selectedOrderKey
    ? ctx.allOrders.filter((o) => o.order_type === ctx.selectedOrderKey!.order_type)
    : ctx.allOrders;

  // storenumber included — see OrderReportPanel's orderItems. Without it a
  // co-located storeid exports both locations' lines as one order.
  const selectedOrderItems = ctx.selectedOrder !== null
    ? filteredOrders.filter(
        (o) =>
          o.order_id === ctx.selectedOrder!.orderId &&
          o.storeid === ctx.selectedOrder!.storeid &&
          o.storenumber === ctx.selectedOrder!.storenumber,
      )
    : [];

  return (
    <div className="h-[calc(100dvh-3rem)] overflow-hidden flex flex-col bg-custom-white">
      {ctx.ordersExportModalOpen && ctx.selectedOrderKey && (
        <OrdersExportSheet
          onClose={() => ctx.dispatch(setOrdersExportModalOpen(false))}
          storeNames={storeNames}
          orderType={ctx.selectedOrderKey.order_type}
          dateLabel={exportDateLabel}
          allOrders={filteredOrders}
          selectedOrderItems={selectedOrderItems}
          selectedOrder={ctx.selectedOrder}
        />
      )}

      {!hasData && !ctx.loadingAvailableOrders && (
        <SearchCard
          top
          title="Orders"
          description="Select a store or group and date range to find available orders."
          buttonLabel="Find orders"
          onSearch={handleSearch}
          loading={ctx.loadingAvailableOrders}
          loadingMessage="Finding orders..."
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
              onSelectAllStores={handleSelectAllStores}
              onOpenSearch={handleReset}
            />
          )}

          {step === "list" && ctx.selectedOrderKey && (
            <OrdersListScreen
              orders={ctx.allOrders}
              loading={ctx.loadingAllOrders}
              selectedKey={ctx.selectedOrderKey}
              assignedStores={ctx.assignedStores}
              groupStores={ctx.selectedGroupStores}
              onBack={() => setStep("available")}
              onSelectOrder={handleSelectOrder}
              onExport={() => ctx.dispatch(setOrdersExportModalOpen(true))}
            />
          )}
        </div>
      )}

      {sheetOpen && ctx.selectedOrderKey && ctx.selectedOrder !== null && (
        <BottomSheet onClose={() => { setSheetOpen(false); ctx.dispatch(setSelectedOrder(null)); }}>
          <OrdersLineItemsScreen
            orders={ctx.allOrders}
            selectedKey={ctx.selectedOrderKey}
            selectedOrder={ctx.selectedOrder}
            assignedStores={ctx.assignedStores}
            groupStores={ctx.selectedGroupStores}
            onExport={() => ctx.dispatch(setOrdersExportModalOpen(true))}
          />
        </BottomSheet>
      )}
    </div>
  );
};

export default OrdersMobile;
