import { useCashierCtx } from ".";
import { useToast } from "../../components/toasts/hooks/useToast";
import { formatGoliathDate } from "../../utils";

import { getStoreCards } from "../../api/cashiers";
import type { JsonError, StoreCardResp } from "../../interfaces";
import {
  reQueryStepOne,
  setCashierFilterType,
  setDataView,
  setLoadingStores,
  setStoreCards,
} from "../../features/cashiersSlice";

import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";
import CardFilters from "./filters/CardFilters";
import StoresView from "./stores/StoresView";
import CashiersView from "./cashiers/CashiersView";
import CashierFiltersModal from "./filters/CashierFiltersModal";

const Cashiers = () => {
  const toast = useToast();
  const ctx = useCashierCtx();

  const getSCards = () => {
    ctx.dispatch(setCashierFilterType(""));
    ctx.dispatch(reQueryStepOne());
    ctx.dispatch(setLoadingStores(true));
    ctx.dispatch(setDataView("stores"));

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
        }
      })
      .catch((err: JsonError) => {
        toast.error(err.message);
        ctx.dispatch(setDataView(""));
      })
      .finally(() => ctx.dispatch(setLoadingStores(false)));
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] w-full p-4 overflow-hidden grid grid-cols-[18%_82%] gap-2">
      <CashierFiltersModal />
      <div className="flex flex-col gap-2">
        <div className="bg-custom-white p-2 rounded-lg shadow-lg">
          <StorePicker />
          <DatePickers handleQuery={getSCards} />
        </div>
        {ctx.dataView.length ? <CardFilters /> : null}
      </div>

      {ctx.dataView.length ? (
        <div className="h-full min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] overflow-y-auto no-scrollbar">
          {ctx.dataView === "stores" ? <StoresView /> : <CashiersView />}
        </div>
      ) : null}
    </div>
  );
};

export default Cashiers;
