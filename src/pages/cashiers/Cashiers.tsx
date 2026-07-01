import { useState } from "react";
import { useCashierCtx } from ".";
import { useToast } from "../../components/toasts/hooks/useToast";
import { formatGoliathDate } from "../../utils";
import { getStoreCards } from "../../api/cashiers";
import type { CashierCard, JsonError, StoreCardResp } from "../../interfaces";
import { useCashiersActions } from "./hooks/useCashiersActions";
import SearchCard from "../../components/SearchCard";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import StoresView from "./stores/StoresView";
import StoreOverview from "./stores/StoreOverview";
import CashiersView from "./cashiers/CashiersView";
import CashierOverview from "./cashiers/CashierOverview";
import TransactionsView from "./transactions/TransactionsView";
import CashiersMobile from "./mobile/CashiersMobile";

const Cashiers = () => {
  const toast = useToast();
  const ctx = useCashierCtx();
  const actions = useCashiersActions();
  const [selectedCashierCard, setSelectedCashierCard] = useState<CashierCard | null>(null);

  const getSCards = () => {
    ctx.dispatch(actions.setCashierFilterType(""));
    ctx.dispatch(actions.reQueryStepOne());
    ctx.dispatch(actions.setLoadingStores(true));
    ctx.dispatch(actions.setDataView("stores"));

    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);
    const useGroups = ctx.type === "Group" ? 1 : 0;
    const singleStore = ctx.type === "Store" ? 1 : 0;
    const searchValue = ctx.type === "Group" ? ctx.lastGroup : ctx.lastStore;

    getStoreCards(ctx.miktoUrl, ctx.userid, start, end, useGroups, searchValue, singleStore, ctx.apiKey)
      .then((resp) => {
        const j: StoreCardResp = resp.data;
        if (j.error === 0) {
          ctx.dispatch(actions.setNoStoresFound(j.stores.length === 0));
          ctx.dispatch(actions.setStoreCards(j.stores));
        }
      })
      .catch((err: JsonError) => {
        toast.error(err.message);
        ctx.dispatch(actions.setDataView(""));
      })
      .finally(() => ctx.dispatch(actions.setLoadingStores(false)));
  };

  if (ctx.isMobile) return <CashiersMobile />;

  if (!ctx.storeCards.length && !ctx.loadingStores) {
    return (
      <div className="h-[calc(100vh-3rem)] overflow-hidden flex items-center justify-center bg-bkg">
        <div className="w-full max-w-sm mx-4">
          <SearchCard
            title="Cashier exceptions"
            description="Select a store or group and date range to view cashier exception activity."
            buttonLabel="Load exceptions"
            onSearch={getSCards}
            loading={false}
          />
        </div>
      </div>
    );
  }

  const showCashierLeft = ctx.dataView === "cashiers" || (ctx.dataView === "transactions" && ctx.cashierCards.length > 0);

  const handleBackToStores = () => {
    ctx.dispatch(actions.setDataView("stores"));
    setSelectedCashierCard(null);
  };

  const handleBackToDetail = () => {
    ctx.dispatch(actions.setDataView(ctx.cashierCards.length > 0 ? "cashiers" : "stores"));
  };

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4 flex gap-3">
      {/* Left panel */}
      <div className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white flex-shrink-0" style={{ width: "38%" }}>
        {ctx.loadingStores ? (
          <div className="flex-1 relative">
            <LoadingIndicator message="Loading stores..." />
          </div>
        ) : showCashierLeft ? (
          <CashiersView
            selectedCashier={selectedCashierCard}
            onCashierSelect={setSelectedCashierCard}
            onBackToStores={handleBackToStores}
          />
        ) : (
          <StoresView onNewSearch={getSCards} />
        )}
      </div>

      {/* Right panel */}
      <div className={`flex-1 min-w-0 flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white ${ctx.dataView !== "transactions" ? "self-start" : ""}`}>
        {ctx.dataView === "transactions" ? (
          <TransactionsView onBack={handleBackToDetail} />
        ) : ctx.dataView === "cashiers" ? (
          selectedCashierCard ? (
            <CashierOverview cashier={selectedCashierCard} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-[13px] font-medium text-content/30">
              Select a cashier to view their exception detail
            </div>
          )
        ) : ctx.selectedStoreCard > 0 ? (
          <StoreOverview />
        ) : ctx.noStoresFound ? (
          <div className="flex-1 flex items-center justify-center text-[13px] font-medium text-content/30">
            No stores found in this date range
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[13px] font-medium text-content/30">
            Select a store to view its exception detail
          </div>
        )}
      </div>
    </div>
  );
};

export default Cashiers;
