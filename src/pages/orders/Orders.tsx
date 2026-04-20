import { useEffect } from "react";
import { useOrdersCtx } from "./hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getAllOrders, getAvailableOrders } from "../../api/orders";
import { getStoresAssignedToUserGroup } from "../../api/groups";
import {
  setAllOrders,
  setAvailableOrders,
  setAvailableOrderTypes,
  setLoadingAllOrders,
  setLoadingAvailableOrders,
  setOrderTypeFilter,
  setSelectedAvailableOrder,
  setSelectedStoreIds,
} from "../../features/ordersSlice";
import type {
  AllOrderResp,
  AvailableOrderResp,
  JsonError,
  Store,
} from "../../interfaces";
import { formatGoliathDate } from "../../utils";

import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import AllOrdersGrid from "./AllOrdersGrid";

// const filters= [
//   { name: "All", value: "all" },
//   { name: "Order #", value: "order" },
//   { name: "Meat", value: "Meat" },
//   { name: "Produce", value: "Produce" },
//   { name: "Grocery", value: "Grocery" },
//   { name: "Other", value: "Other" },
// ]

const Orders = () => {
  const ctx = useOrdersCtx();
  const toast = useToast();

  useEffect(() => {
    if (ctx.selectedStoreIds.length) {
      // fetch all orders
      ctx.dispatch(setLoadingAllOrders(true));
      getAllOrders(
        ctx.url,
        ctx.token,
        formatGoliathDate(ctx.startDate),
        formatGoliathDate(ctx.endDate),
        ctx.selectedStoreIds,
      )
        .then((resp) => {
          const j: AllOrderResp = resp.data;
          if (j.error === 0) {
            ctx.dispatch(setAllOrders(j.orders));
          }
        })
        .catch((err: JsonError) => toast.error(err.message))
        .finally(() => ctx.dispatch(setLoadingAllOrders(false)));
    } else {
      ctx.dispatch(setAllOrders([]));
    }
  }, [ctx.selectedStoreIds]);

  const handleSearch = () => {
    if (ctx.type === "Group") {
      getStoresAssignedToUserGroup(
        ctx.url,
        ctx.token,
        ctx.userid,
        ctx.lastGroup,
      )
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            const storeids: number[] = j.stores.map((s: Store) => s.storeid);
            getAvailableData(storeids);
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    } else {
      getAvailableData([ctx.lastStore]);
    }
  };

  const getAvailableData = (storeids: number[]) => {
    // Reset, then fetch
    ctx.dispatch(setAvailableOrders([]));
    ctx.dispatch(setAllOrders([]));
    ctx.dispatch(setAvailableOrderTypes([]));
    ctx.dispatch(setSelectedAvailableOrder(null));

    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);
    ctx.dispatch(setLoadingAvailableOrders(true));
    getAvailableOrders(ctx.url, ctx.token, start, end, storeids)
      .then((resp) => {
        const j: AvailableOrderResp = resp.data;
        if (j.error === 0) {
          ctx.dispatch(setAvailableOrders(j.orders));
          const types = Array.from(new Set(j.orders.map((o) => o.order_type)));
          ctx.dispatch(setAvailableOrderTypes(types));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => ctx.dispatch(setLoadingAvailableOrders(false)));
  };

  const isLoadingAvailableOrders =
    ctx.loadingAvailableOrders && ctx.availableOrders.length === 0;

  const formatDate = (dateStr: string) => {
    const split = dateStr.split("T")[0].split("-");
    return `${split[1]}/${split[2]}/${split[0]}`;
  };

  const handleRowClick = (storeid: number) => {
    const currentIds = [...ctx.selectedStoreIds];
    if (currentIds.includes(storeid)) {
      ctx.dispatch(
        setSelectedStoreIds(currentIds.filter((id) => id !== storeid)),
      );
    } else {
      ctx.dispatch(setSelectedStoreIds([...currentIds, storeid]));
    }
  };

  const handleOrderFilterClick = (type: string) => {
    const currentFilters = [...ctx.orderTypeFilter];
    if (currentFilters.includes(type)) {
      ctx.dispatch(
        setOrderTypeFilter(currentFilters.filter((t) => t !== type)),
      );
    } else {
      ctx.dispatch(setOrderTypeFilter([...currentFilters, type]));
    }
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden p-4 grid grid-cols-[18%_1fr] gap-2">
      <div className="flex flex-col gap-2">
        <div className="bg-custom-white p-2 rounded-lg shadow-lg">
          <StorePicker />
          <DatePickers handleQuery={handleSearch} />
        </div>
        {isLoadingAvailableOrders && (
          <div className="relative">
            <LoadingIndicator message="Loading Available Orders" />
          </div>
        )}
        {!isLoadingAvailableOrders && ctx.availableOrders.length ? (
          <div className="bg-custom-white p-2 text-sm rounded-lg shadow-lg">
            <div className="font-medium mb-2">Order Types</div>
            <div className="grid gap-2 grid-cols-2">
              {ctx.availableOrderTypes.map((t, i) => (
                <div
                  key={i}
                  className={`rounded-full py-0.5 shadow-md text-center cursor-pointer hover:bg-orange-200 transition-all duration-200 ${ctx.orderTypeFilter.includes(t) ? "bg-orange-200" : ""}`}
                  onClick={() => handleOrderFilterClick(t)}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!isLoadingAvailableOrders && ctx.availableOrders.length ? (
          <div className="bg-custom-white p-2 rounded-lg shadow-lg text-sm">
            <div className="font-medium">Available Order List</div>
            <div className="grid grid-cols-[1.6fr_1.1fr_0.9fr_0.9fr] text-sm px-2 border-b border-content">
              <div className="font-medium">Date</div>
              <div className="font-medium">Type</div>
              <div className="font-medium">Count</div>
              <div className="font-medium">Store #</div>
            </div>
            <div className="max-h-[315px] overflow-y-auto no-scrollbar">
              {ctx.availableOrders.map((ao, i) => (
                <div
                  key={i}
                  className={`${ctx.selectedStoreIds.includes(ao.storeid) ? "bg-orange-200" : "even:bg-blue-200/50"} py-0.5 hover:bg-orange-200 transition-all duration-200 cursor-pointer px-2 grid grid-cols-[1.6fr_1.1fr_0.9fr_0.9fr] text-[13px]`}
                  onClick={() => handleRowClick(ao.storeid)}
                >
                  <div>{formatDate(ao.order_date)}</div>
                  <div>{ao.order_type}</div>
                  <div>{ao.record_count}</div>
                  <div>{ao.storenumber}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <div>
        <AllOrdersGrid />
      </div>
    </div>
  );
};

export default Orders;
