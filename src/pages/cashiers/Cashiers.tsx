import { useCashierCtx } from ".";
import { useToast } from "../../components/toasts/hooks/useToast";
import { formatGoliathDate } from "../../utils";

import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";
import { getStoreCards } from "../../api/cashiers";
import type { JsonError, StoreCardResp } from "../../interfaces";
import { setStoreCards } from "../../features/cashiersSlice";

const Cashiers = () => {
  const toast = useToast();
  const ctx = useCashierCtx();

  const getSCards = () => {
    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);
    getStoreCards(ctx.miktoUrl, ctx.userid, start, end, 0, 0, 0, ctx.apiKey)
      .then((resp) => {
        const j: StoreCardResp = resp.data;
        if (j.error === 0) {
          ctx.dispatch(setStoreCards(j.stores));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] w-full p-4 overflow-hidden">
      <div className="bg-custom-white p-2 w-1/5 rounded-lg shadow-lg">
        <StorePicker />
        <DatePickers handleQuery={getSCards} />
      </div>
    </div>
  );
};

export default Cashiers;
