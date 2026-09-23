import { useOrdersCtx } from "../hooks";
import {
  // setFilteredAvailableOrders,
  // setFilteredOrders,
  // setOrderFilters,
  setOrdersExportModalOpen,
  // setSubIdsFilter,
  // setTypeFilterArr,
} from "../../../features/ordersLegacySlice";
// import type { AvailableOrder } from "../../../interfaces";

import DatePickers from "../../../components/datePickers/DatePickers";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import StorePicker from "../../../components/storePicker/StorePicker";
import ExportModal from "../../../components/modals/ExportModal";
import { ordersCols } from "..";
import OrdersGridFilters from "./OrdersGridFilters";

interface OrdersTabletProps {
  handleSearch: () => void;
  handleExportBtnClick: () => void;
}

const OrdersTablet = ({
  handleSearch,
  handleExportBtnClick,
}: OrdersTabletProps) => {
  const ctx = useOrdersCtx();

  const isLoadingAvailableOrders =
    ctx.loadingAvailableOrders && ctx.availableOrders.length === 0;

  const isReady = !ctx.loadingAvailableOrders && ctx.availableOrders.length > 0;

  // const activeFilter = (order: AvailableOrder) => {
  //   const found = ctx.orderFilters.find(
  //     (f) =>
  //       f.order_date === order.order_date &&
  //       f.storeid === order.storeid &&
  //       f.order_type === order.order_type,
  //   );
  //   if (found) {
  //     return "bg-orange-200";
  //   }
  //   return "even:bg-blue-200/50";
  // };

  // const formatDate = (dateStr: string) => {
  //   const split = dateStr.split("T")[0].split("-");
  //   return `${split[1]}/${split[2]}/${split[0]}`;
  // };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden p-3 grid grid-cols-[240px_1fr]">
      <ExportModal
        isOpen={ctx.ordersExportModalOpen}
        data={ctx.filteredOrders}
        columns={ordersCols}
        onClose={() => ctx.dispatch(setOrdersExportModalOpen(false))}
      />
      <div className="flex flex-col gap-2">
        <div className="bg-custom-white p-2 rounded-lg shadow-lg text-[13px]">
          <StorePicker />
          <DatePickers showBtn={false} />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              className="btn-themeBlue py-1 w-full"
              onClick={handleSearch}
            >
              Search
            </button>
            <button
              className={`btn-themeGreen py-1 w-full ${ctx.filteredOrders.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={handleExportBtnClick}
            >
              Export
            </button>
          </div>
        </div>
        {isLoadingAvailableOrders && (
          <div className="relative h-[200px]">
            <LoadingIndicator message="Loading Available Orders" />
          </div>
        )}
        {isReady ? <OrdersGridFilters /> : null}
      </div>

      <div className="px-3">
        <div>Orders Top Right</div>
        <div>Orders Bottom Right</div>
      </div>
    </div>
  );
};

export default OrdersTablet;
