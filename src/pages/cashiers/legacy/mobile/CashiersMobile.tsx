import { useCashierCtx } from "..";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { formatGoliathDate } from "../../../../utils";
import { getStoreCards } from "../../../../api/cashiers";
import type { JsonError, StoreCardResp } from "../../../../interfaces";
import DatePickers from "../../../../components/datePickers/DatePickers";
import StorePicker from "../../../../components/storePicker/StorePicker";
import {
  setDataView,
  setLoadingStores,
  setNoStoresFound,
  setStoreCards,
} from "../../../../features/cashiersLegacySlice";
import StoresMobile from "./StoresMobile";

const CashiersMobile = () => {
  const toast = useToast();
  const ctx = useCashierCtx();

  const getSCards = () => {
    // Set loading stores and switch to stores view
    ctx.dispatch(setLoadingStores(true));
    ctx.dispatch(setDataView("stores"));

    // Fetch the data
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

  const renderForm = () => {
    switch (ctx.dataView) {
      case "stores":
        return <StoresMobile />;
      case "cashiers":
        return <div>Cashiers View</div>;
      case "transactions":
        return <div>Transactions View</div>;
      default:
        return (
          <div className="bg-custom-white rounded-lg shadow-md p-2">
            <StorePicker />
            <DatePickers handleQuery={getSCards} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] w-full p-2 overflow-hidden">
      {renderForm()}
    </div>
  );
};

export default CashiersMobile;
