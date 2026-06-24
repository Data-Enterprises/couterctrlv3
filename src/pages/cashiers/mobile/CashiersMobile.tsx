import { useState } from "react";
import { useCashierCtx } from "..";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { formatGoliathDate } from "../../../utils";
import { getStoreCards, getCashierCards } from "../../../api/cashiers";
import type { CashierCard, CashierCardResp, JsonError, StoreCard, StoreCardResp } from "../../../interfaces";
import {
  reQueryStepOne,
  reQueryStepTwo,
  setCashierCards,
  setCashierFilterType,
  setDataView,
  setLoadingCashiers,
  setLoadingStores,
  setNoStoresFound,
  setSelectedStoreCard,
  setStoreCards,
} from "../../../features/cashiersSlice";
import SearchCard from "../../../components/SearchCard";
import StoresMobile from "./StoresMobile";
import StoreOverviewMobile from "./StoreOverviewMobile";
import CashiersMobileList from "./CashiersMobileList";
import CashierOverviewMobile from "./CashierOverviewMobile";
import TransactionsMobileScreen from "./TransactionsMobileScreen";

const CashiersMobile = () => {
  const toast = useToast();
  const ctx = useCashierCtx();
  const [selectedStore, setSelectedStore] = useState<StoreCard | null>(null);
  const [selectedCashier, setSelectedCashier] = useState<CashierCard | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const getSCards = () => {
    ctx.dispatch(reQueryStepOne());
    ctx.dispatch(setLoadingStores(true));
    ctx.dispatch(setDataView("stores"));
    setSelectedStore(null);
    setSelectedCashier(null);

    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);
    const useGroups = ctx.type === "Group" ? 1 : 0;
    const singleStore = ctx.type === "Store" ? 1 : 0;
    const searchValue = ctx.type === "Group" ? ctx.lastGroup : ctx.lastStore;

    getStoreCards(ctx.miktoUrl, ctx.userid, start, end, useGroups, searchValue, singleStore, ctx.apiKey)
      .then((resp) => {
        const j: StoreCardResp = resp.data;
        if (j.error === 0) {
          ctx.dispatch(setNoStoresFound(j.stores.length === 0));
          ctx.dispatch(setStoreCards(j.stores));
        }
      })
      .catch((err: JsonError) => {
        toast.error(err.message);
        ctx.dispatch(setDataView(""));
      })
      .finally(() => ctx.dispatch(setLoadingStores(false)));
  };

  const handleStoreSelect = (store: StoreCard) => {
    ctx.dispatch(setSelectedStoreCard(store.storeid));
    setSelectedStore(store);
  };

  const handleViewCashiers = (store: StoreCard) => {
    ctx.dispatch(setCashierFilterType(""));
    ctx.dispatch(setSelectedStoreCard(store.storeid));
    ctx.dispatch(reQueryStepTwo());
    ctx.dispatch(setLoadingCashiers(true));
    ctx.dispatch(setDataView("cashiers"));
    setSelectedCashier(null);

    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);
    getCashierCards(ctx.miktoUrl, ctx.userid, start, end, 0, store.storeid, 1, ctx.apiKey)
      .then((resp) => {
        const j: CashierCardResp = resp.data;
        if (j.error === 0) ctx.dispatch(setCashierCards(j.stores));
      })
      .catch((err: JsonError) => {
        ctx.dispatch(setDataView("stores"));
        toast.error("Error fetching cashiers: " + err.message);
      })
      .finally(() => ctx.dispatch(setLoadingCashiers(false)));
  };

  const handleBackToStoreDetail = () => {
    ctx.dispatch(setDataView("stores"));
    setSelectedCashier(null);
  };

  const hasData = ctx.storeCards.length > 0 || ctx.loadingStores;

  // Initial search — full-screen SearchCard
  if (!hasData) {
    return (
      <SearchCard
        title="Cashier exceptions"
        description="Select a store or group and date range to view cashier exception activity."
        buttonLabel="Load exceptions"
        onSearch={getSCards}
        loading={false}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden flex flex-col bg-custom-white">
      {/* Transactions screen */}
      {ctx.dataView === "transactions" ? (
        <TransactionsMobileScreen
          onBack={() => ctx.dispatch(setDataView(selectedCashier ? "cashiers" : "stores"))}
          onOpenSearch={() => setSearchModalOpen(true)}
          cashierName={selectedCashier?.cashier_name}
          storeName={selectedStore?.store_name}
        />
      ) : ctx.dataView === "cashiers" && selectedCashier ? (
        <CashierOverviewMobile
          cashier={selectedCashier}
          onBack={() => setSelectedCashier(null)}
          onOpenSearch={() => setSearchModalOpen(true)}
        />
      ) : ctx.dataView === "cashiers" ? (
        <CashiersMobileList
          selectedCashier={selectedCashier}
          onCashierSelect={setSelectedCashier}
          onBackToStoreDetail={handleBackToStoreDetail}
          onOpenSearch={() => setSearchModalOpen(true)}
          store={selectedStore}
        />
      ) : ctx.dataView === "stores" && selectedStore ? (
        <StoreOverviewMobile
          store={selectedStore}
          onBack={() => setSelectedStore(null)}
          onViewCashiers={() => handleViewCashiers(selectedStore)}
          onOpenSearch={() => setSearchModalOpen(true)}
        />
      ) : (
        <StoresMobile
          onStoreSelect={handleStoreSelect}
          onOpenSearch={() => setSearchModalOpen(true)}
        />
      )}

      {/* Re-search overlay */}
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchModalOpen(false)}
        >
          <div className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <SearchCard
              title="Cashier exceptions"
              description="Select a store or group and date range to view cashier exception activity."
              buttonLabel="Load exceptions"
              onSearch={() => { setSearchModalOpen(false); getSCards(); }}
              loading={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CashiersMobile;
