import DatePickers from "../../../components/datePickers/DatePickers";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import StorePicker from "../../../components/storePicker/StorePicker";
import {
  setFilteredAvailableOrders,
  setFilteredOrders,
  setOrderFilters,
  setSubIdsFilter,
  setTypeFilterArr,
} from "../../../features/ordersSlice";
import type { AvailableOrder } from "../../../interfaces";
import { useOrdersCtx } from "../hooks";

interface OrdersTabletProps {
  handleSearch: () => void;
  handleExportBtnClick: () => void;
  handleOrderTypeBtnClick: (type: string) => void;
  handleRowClick: (order: AvailableOrder) => void;
}
const OrdersTablet = ({
  handleSearch,
  handleExportBtnClick,
  handleOrderTypeBtnClick,
  handleRowClick,
}: OrdersTabletProps) => {
  const ctx = useOrdersCtx();

  const isLoadingAvailableOrders =
    ctx.loadingAvailableOrders && ctx.availableOrders.length === 0;

  const count = (type: string) => {
    return ctx.availableOrders.reduce((acc, o) => {
      if (o.order_type.toLowerCase() === type.toLowerCase()) {
        return acc + 1;
      }
      return acc;
    }, 0);
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

  const formatDate = (dateStr: string) => {
    const split = dateStr.split("T")[0].split("-");
    return `${split[1]}/${split[2]}/${split[0]}`;
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden p-3">
      <div className="flex flex-col gap-2">
        <div className="bg-custom-white p-2 rounded-lg shadow-lg h-[295px] text-sm">
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
          <div className="bg-custom-white p-2 rounded-lg shadow-lg text-sm h-[calc(100vh-385px)] flex flex-col relative">
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
    </div>
  );
};

export default OrdersTablet;
