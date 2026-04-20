// import { useEffect } from "react";
import { useOrdersCtx } from "./hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getAllOrders, getAvailableOrders } from "../../api/orders";
import { getStoresAssignedToUserGroup } from "../../api/groups";
import {
  setAllOrders,
  setAvailableOrders,
  setAvailableOrderTypes,
  setFilteredAvailableOrders,
  setLoadingAllOrders,
  setLoadingAvailableOrders,
  setOrderFilters,
  setOrdersExportModalOpen,
  // setOrderTypeFilter,
  setSelectedAvailableOrder,
  setTypeFilterArr,
  // setSelectedStoreIds,
} from "../../features/ordersSlice";
import type {
  AllOrderResp,
  AvailableOrder,
  AvailableOrderResp,
  JsonError,
  Store,
} from "../../interfaces";
import { formatGoliathDate } from "../../utils";

import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import AllOrdersGrid from "./AllOrdersGrid";
import ExportModal from "../../components/modals/ExportModal";
import { ordersCols } from ".";
// import { useState } from "react";

const Orders = () => {
  const ctx = useOrdersCtx();
  const toast = useToast();
  // const [typeFilterArr, setTypeFilterArr] = useState<string[]>([]);

  // useEffect(() => {
  //   if (ctx.selectedStoreIds.length) {
  //     // fetch all orders
  //     ctx.dispatch(setLoadingAllOrders(true));
  //     getAllOrders(
  //       ctx.url,
  //       ctx.token,
  //       formatGoliathDate(ctx.startDate),
  //       formatGoliathDate(ctx.endDate),
  //       ctx.selectedStoreIds,
  //     )
  //       .then((resp) => {
  //         const j: AllOrderResp = resp.data;
  //         if (j.error === 0) {
  //           ctx.dispatch(setAllOrders(j.orders));
  //         }
  //       })
  //       .catch((err: JsonError) => toast.error(err.message))
  //       .finally(() => ctx.dispatch(setLoadingAllOrders(false)));
  //   } else {
  //     ctx.dispatch(setAllOrders([]));
  //   }
  // }, [ctx.selectedStoreIds]);

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
            const storeids: number[] = j.stores
              .filter((s: any) => s.active)
              .map((s: Store) => s.storeid);
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
    ctx.dispatch(setOrderFilters([]));

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
          const storeids = Array.from(new Set(j.orders.map((o) => o.storeid)));

          ctx.dispatch(setLoadingAllOrders(true));
          getAllOrders(
            ctx.url,
            ctx.token,
            formatGoliathDate(ctx.startDate),
            formatGoliathDate(ctx.endDate),
            storeids,
          )
            .then((resp) => {
              const j: AllOrderResp = resp.data;
              if (j.error === 0) {
                ctx.dispatch(setAllOrders(j.orders));
              }
            })
            .catch((err: JsonError) => toast.error(err.message))
            .finally(() => ctx.dispatch(setLoadingAllOrders(false)));
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

  const handleRowClick = (order: AvailableOrder) => {
    const current = [...ctx.orderFilters];
    const found = current.find(
      (f) =>
        f.storeid === order.storeid &&
        f.order_date === order.order_date &&
        f.order_type === order.order_type,
    );
    if (found) {
      const filteredOut = current.filter(
        (f) =>
          !(
            f.storeid === order.storeid &&
            f.order_date === order.order_date &&
            f.order_type === order.order_type
          ),
      );
      ctx.dispatch(setOrderFilters(filteredOut));
    } else {
      const filter = ctx.availableOrders.find(
        (o) =>
          o.storeid === order.storeid &&
          o.order_date === order.order_date &&
          o.order_type === order.order_type,
      );
      if (filter) {
        ctx.dispatch(setOrderFilters([...current, filter]));
      }
    }
  };

  // const handleOrderFilterClick = (type: string) => {
  //   const currentFilters = [...ctx.orderTypeFilter];
  //   if (currentFilters.includes(type)) {
  //     ctx.dispatch(
  //       setOrderTypeFilter(currentFilters.filter((t) => t !== type)),
  //     );
  //   } else {
  //     ctx.dispatch(setOrderTypeFilter([...currentFilters, type]));
  //   }
  // };

  const handleOrderTypeBtnClick = (type: string) => {
    const current = [...ctx.typeFilterArr];
    let result = [];
    if (current.includes(type)) {
      result = current.filter((t) => t !== type);
    } else {
      result = [...current, type];
    }
    ctx.dispatch(setTypeFilterArr(result));

    if (result.length === 0) {
      ctx.dispatch(setFilteredAvailableOrders(ctx.availableOrders));
    } else {
      const filtered = [...ctx.availableOrders].filter((o) =>
        result.includes(o.order_type),
      );

      ctx.dispatch(setFilteredAvailableOrders(filtered));
    }
  };

  const handleExportBtnClick = () => {
    ctx.dispatch(setOrdersExportModalOpen(true));
  };

  const activeFilter = (order: AvailableOrder) => {
    const found = ctx.orderFilters.find(
      (f) =>
        f.order_date === order.order_date &&
        f.storeid === order.storeid &&
        f.order_type === order.order_type,
    );
    if (found) {
      return "bg-orange-200";
    }
    return "even:bg-blue-200/50";
  };

  const count = (type: string) => {
    return ctx.availableOrders.reduce((acc, o) => {
      if (o.order_type.toLowerCase() === type.toLowerCase()) {
        return acc + 1;
      }
      return acc;
    }, 0);
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden p-4 grid grid-cols-[18%_1fr] gap-2">
      <ExportModal
        isOpen={ctx.ordersExportModalOpen}
        data={ctx.filteredOrders}
        columns={ordersCols}
        onClose={() => ctx.dispatch(setOrdersExportModalOpen(false))}
      />
      <div className="flex flex-col gap-2">
        <div className="bg-custom-white p-2 rounded-lg shadow-lg h-[310px]">
          <StorePicker />
          <DatePickers handleQuery={handleSearch} />
          <button
            className={`btn-themeGreen mt-2 w-full ${ctx.filteredOrders.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={handleExportBtnClick}
          >
            Export
          </button>
        </div>
        {isLoadingAvailableOrders && (
          <div className="relative h-[200px]">
            <LoadingIndicator message="Loading Available Orders" />
          </div>
        )}
        {/* {!isLoadingAvailableOrders && ctx.availableOrders.length ? (
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
        ) : null} */}

        {!isLoadingAvailableOrders && ctx.availableOrders.length ? (
          <div className="bg-custom-white p-2 rounded-lg shadow-lg text-sm h-[calc(100vh-395px)] relative">
            <div className="grid grid-cols-4 gap-2">
              {ctx.availableOrderTypes.map((t, i) => (
                <div
                  key={i}
                  className={`${ctx.typeFilterArr.includes(t) ? "bg-orange-200" : ""} mb-1 text-[12px] text-center shadow-md rounded-full bg-bkg cursor-pointer hover:bg-orange-200 transition-all duration-200`}
                  onClick={() => handleOrderTypeBtnClick(t)}
                >
                  {t} {count(t)}
                </div>
              ))}
            </div>
            {/* <div className="font-medium text-[13.5px]">Available Orders</div> */}
            <div className="grid grid-cols-[1.6fr_1.1fr_0.9fr_0.9fr] text-sm px-2 border-b border-content">
              <div className="font-medium">Date</div>
              <div className="font-medium">Type</div>
              <div className="font-medium">Count</div>
              <div className="font-medium">Store #</div>
            </div>
            <div className="max-h-[78%] overflow-y-auto no-scrollbar">
              {ctx.filteredAvailableOrders.map((ao, i) => (
                <div
                  key={i}
                  className={`${activeFilter(ao)} py-0.5 hover:bg-orange-200 transition-all duration-200 cursor-pointer px-2 grid grid-cols-[1.6fr_1.1fr_0.9fr_0.9fr] text-[13px]`}
                  onClick={() => handleRowClick(ao)}
                >
                  <div>{formatDate(ao.order_date)}</div>
                  <div>{ao.order_type}</div>
                  <div>{ao.record_count}</div>
                  <div>{ao.storenumber}</div>
                </div>
              ))}
            </div>
            <div className="absolute bottom-2 left-0 w-full px-2">
              <button
                className="btn-themeOrange w-full"
                onClick={() => ctx.dispatch(setOrderFilters([]))}
              >
                All Orders
              </button>
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
