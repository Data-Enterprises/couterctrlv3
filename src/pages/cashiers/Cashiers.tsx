import { useCashierCtx } from ".";
import { useToast } from "../../components/toasts/hooks/useToast";
import { formatGoliathDate } from "../../utils";

import { getStoreCards } from "../../api/cashiers";
import type { JsonError, StoreCardResp } from "../../interfaces";
import {
  reQueryStepOne,
  setDataView,
  setStoreCards,
} from "../../features/cashiersSlice";

import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";
import { useState } from "react";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import StoreOverview from "./stores/StoreOverview";
import CardFilters from "./components/CardFilters";

const Cashiers = () => {
  const toast = useToast();
  const ctx = useCashierCtx();
  const [loadingStepOne, setLoadingStepOne] = useState<boolean>(false);

  const getSCards = () => {
    ctx.dispatch(reQueryStepOne());
    setLoadingStepOne(true);
    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);
    const useGroups = ctx.type === "Group" ? 1 : 0;
    const singleStore = ctx.type === "Store" ? 1 : 0;
    const searchValue = ctx.type === "Group" ? ctx.lastGroup : ctx.lastStore;

    getStoreCards(
      ctx.miktoUrl,
      ctx.userid,
      start,
      end,
      useGroups,
      searchValue,
      singleStore,
      ctx.apiKey,
    )
      .then((resp) => {
        const j: StoreCardResp = resp.data;
        if (j.error === 0) {
          ctx.dispatch(setStoreCards(j.stores));
          ctx.dispatch(setDataView("stores"));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => setLoadingStepOne(false));
  };

  // const getCCards = (storeid: number) => {
  //   ctx.dispatch(setSelectedStoreCard(storeid));
  //   const start = formatGoliathDate(ctx.startDate);
  //   const end = formatGoliathDate(ctx.endDate);
  //   getCashierCards(
  //     ctx.miktoUrl,
  //     ctx.userid,
  //     start,
  //     end,
  //     0,
  //     storeid,
  //     1,
  //     ctx.apiKey,
  //   )
  //     .then((resp) => {
  //       const j: CashierCardResp = resp.data;
  //       if (j.error === 0) {
  //         ctx.dispatch(setCashierCards(j.stores));
  //       }
  //     })
  //     .catch((err: JsonError) => {
  //       ctx.dispatch(setSelectedStoreCard(0));
  //       toast.error(err.message);
  //     });
  // };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] w-full p-4 overflow-hidden grid grid-cols-[1fr_4fr] gap-4">
      <div className="flex flex-col gap-2">
        {/* controls */}
        <div className="bg-custom-white p-2 rounded-lg shadow-lg">
          <StorePicker />
          <DatePickers handleQuery={getSCards} />
        </div>
        {ctx.dataView.length ? <CardFilters /> : null}
      </div>

      {/* Right column => Cards */}
      {loadingStepOne ? (
        <div className="relative h-[calc(100vh-5rem)]">
          <LoadingIndicator message="Loading stores..." />
        </div>
      ) : null}
      {ctx.dataView.length ? (
        <div className="h-full min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] overflow-y-auto no-scrollbar">
          {ctx.dataView === "stores" ? (
            <div className="min-h-full grid grid-cols-3 gap-4">
              {ctx.storeCards.map((card, i) => (
                <StoreOverview key={i} store={card} />
              ))}
              {ctx.storeCards.map((card, i) => (
                <StoreOverview key={i} store={card} />
              ))}
              {ctx.storeCards.map((card, i) => (
                <StoreOverview key={i} store={card} />
              ))}
            </div>
          ) : (
            <div className="min-h-full grid grid-cols-3 gap-4">
              <div></div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Cashiers;
