// Hooks
import { useEffect, useState } from "react";
import { useOrdersCtx } from "../hooks";
import { usePhoneExportData, usePhoneOrders } from "./hooks";

// Redux
import {
  setAllOrders,
  setAvailableOrders,
  setGroupedAvailableOrders,
  setSelectedOrderKey,
  setSelectedOrder,
  setOrdersExportModalOpen,
} from "../../../../features/dev/devOrdersSlice";

// Interfaces
import type { MobileStep } from "./interfaces";

// Components
import SearchCard from "../../../../components-dev/SearchCard";
import BottomSheet from "../../../../components-dev/BottomSheet";
import OrdersAvailableScreen from "./OrdersAvailableScreen";
import OrdersListScreen from "./OrdersListScreen";
import OrdersLineItemsScreen from "./OrdersLineItemsScreen";
import OrdersExportSheet from "./OrdersExportSheet";

/** The phone Orders page. It holds the search card, then moves through the available orders, the order list and a
 *  bottom sheet of one order's lines, and owns the order fetches and the export sheet. */
const OrdersMobile = () => {
  const ctx = useOrdersCtx();
  const [step, setStep] = useState<MobileStep>("available");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notice, setNotice] = useState<string | undefined>(undefined);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const { handleSearch, handleSelectStore, handleSelectAllStores } =
    usePhoneOrders(setStep, setNotice, setSheetOpen);
  const { storeNames, exportDateLabel, filteredOrders, selectedOrderItems } =
    usePhoneExportData();

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
        <BottomSheet
          onClose={() => {
            setSheetOpen(false);
            ctx.dispatch(setSelectedOrder(null));
          }}
        >
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
