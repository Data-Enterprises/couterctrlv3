import { useOrdersCtx } from "./hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getAllOrders, getAvailableOrders } from "../../api/orders";
import { getStoresAssignedToUserGroup } from "../../api/groups";
import {
  setAllOrders,
  setAvailableOrders,
  setAvailableOrderTypes,
  setFilteredAvailableOrders,
  setFilteredOrders,
  setLoadingAllOrders,
  setLoadingAvailableOrders,
  setOrderFilters,
  setOrdersExportModalOpen,
  setSelectedAvailableOrder,
  setSubIdsFilter,
  setTypeFilterArr,
  setUniqueSubs,
  type UniqueSub,
} from "../../features/ordersSlice";
import type {
  AllOrderResp,
  AvailableOrder,
  AvailableOrderResp,
  JsonError,
  Store,
} from "../../interfaces";
import { getCogs, getERet, ordersCols } from ".";
import { formatGoliathDate } from "../../utils";

import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import AllOrdersGrid from "./AllOrdersGrid";
import KpiContainer from "./kpis/KpiContainer";
import ExportModal from "../../components/modals/ExportModal";

const Orders = () => {
  const ctx = useOrdersCtx();
  const toast = useToast();

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
    ctx.dispatch(setSubIdsFilter([]));

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
                // Adding extended retail calculation here so it can be exported easier
                const ordersWERet = [...j.orders].map((o) => {
                  const base_cost = o.base_cost === null ? 0 : o.base_cost;
                  const net_cost = o.net_cost === null ? 0 : o.net_cost;
                  const weight = o.weight !== null ? o.weight : 0;
                  const casesize = o.casesize !== null ? o.casesize : 0;
                  const e_ret = getERet(
                    o.qty,
                    weight,
                    o.active_retail_price,
                    o.scalable,
                  );
                  const cogs = getCogs(
                    base_cost,
                    o.qty,
                    o.scalable,
                    weight,
                    casesize,
                  );
                  const rev = e_ret - cogs;
                  return {
                    ...o,
                    e_ret,
                    base_cost,
                    net_cost,
                    weight,
                    casesize,
                    cogs,
                    rev,
                  };
                });

                const subIdsForFilter = [...j.orders].reduce(
                  (acc: UniqueSub[], o) => {
                    if (!acc.some((a) => a.subId === o.sub_department)) {
                      acc.push({
                        desc: o.sub_department_description
                          ? o.sub_department_description
                          : "null",
                        subId: o.sub_department,
                        count: [...j.orders].filter(
                          (f) => f.sub_department === o.sub_department,
                        ).length,
                      });
                    }
                    return acc;
                  },
                  [],
                );

                ctx.dispatch(setUniqueSubs(subIdsForFilter));
                ctx.dispatch(setAllOrders(ordersWERet));
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

  const handleOrderTypeBtnClick = (type: string) => {
    const current = [...ctx.typeFilterArr];
    let result = [];
    if (current.includes(type)) {
      result = current.filter((t) => t !== type);
    } else {
      result = [...current, type];
    }
    ctx.dispatch(setTypeFilterArr(result));

    const setFilters = [...ctx.orderFilters].filter((f) =>
      ctx.typeFilterArr.includes(f.order_type),
    );
    ctx.dispatch(setOrderFilters(setFilters));

    if (result.length === 0) {
      ctx.dispatch(setFilteredAvailableOrders(ctx.availableOrders));
      ctx.dispatch(setFilteredOrders(ctx.allOrders));
    } else {
      const filtered = [...ctx.availableOrders].filter((o) =>
        result.includes(o.order_type),
      );

      const allFiltered = [...ctx.allOrders].filter((o) =>
        result.includes(o.order_type),
      );

      ctx.dispatch(setSubIdsFilter([]));
      ctx.dispatch(setFilteredOrders(allFiltered));
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
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden p-4 grid grid-cols-[16%_1fr] gap-2">
      <ExportModal
        isOpen={ctx.ordersExportModalOpen}
        data={ctx.filteredOrders}
        columns={ordersCols}
        onClose={() => ctx.dispatch(setOrdersExportModalOpen(false))}
      />
      <div className="flex flex-col gap-2">
        <div className="bg-custom-white p-2 rounded-lg shadow-lg h-[302px]">
          <StorePicker />
          <DatePickers handleQuery={handleSearch} btnPadding="py-1.5" />
          <button
            className={`btn-themeGreen mt-2 py-1.5 w-full ${ctx.filteredOrders.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
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

        {!isLoadingAvailableOrders && ctx.availableOrders.length ? (
          <div className="bg-custom-white p-2 rounded-lg shadow-lg text-sm h-[calc(100vh-390px)] flex flex-col relative">
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
            <div className="grid grid-cols-[1.6fr_1.1fr_0.9fr_0.9fr] text-[13px] px-2 border-b border-content">
              <div className="font-medium">Date</div>
              <div className="font-medium">Type</div>
              <div className="font-medium">Count</div>
              <div className="font-medium">Store</div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {ctx.filteredAvailableOrders.map((ao, i) => (
                <div
                  key={i}
                  className={`${activeFilter(ao)} py-0.5 hover:bg-orange-200 transition-all duration-200 cursor-pointer px-2 grid grid-cols-[1.6fr_1.1fr_0.9fr_0.9fr] text-[12px]`}
                  onClick={() => handleRowClick(ao)}
                >
                  <div>{formatDate(ao.order_date)}</div>
                  <div>{ao.order_type}</div>
                  <div>{ao.record_count}</div>
                  <div>{ao.storenumber}</div>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-2">
              <button
                className="btn-themeBlue w-full"
                onClick={() => {
                  ctx.dispatch(setOrderFilters([]));
                  ctx.dispatch(setTypeFilterArr([]));
                  ctx.dispatch(setFilteredAvailableOrders(ctx.availableOrders));
                  ctx.dispatch(setFilteredOrders(ctx.allOrders));
                  ctx.dispatch(setSubIdsFilter([]));
                }}
              >
                All Orders
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <div className="grid grid-rows-[auto_1fr] gap-2">
        <KpiContainer />
        <AllOrdersGrid />
      </div>
    </div>
  );
};

export default Orders;
