import { useCashierCtx, useLeftColHeight } from ".";
import { useToast } from "../../components/toasts/hooks/useToast";
import {
  formatBigNumber,
  formatCurrency2,
  formatGoliathDate,
} from "../../utils";

import { getCashierCards, getStoreCards } from "../../api/cashiers";
import type {
  CashierCardResp,
  JsonError,
  StoreCardResp,
} from "../../interfaces";
import {
  reQueryStepOne,
  setCashierCards,
  setSelectedStoreCard,
  setStoreCards,
} from "../../features/cashiersSlice";

import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";
import Input from "../../components/inputs/Input";
import { useState } from "react";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import StoreOverview from "./stores/StoreOverview";

const Cashiers = () => {
  const toast = useToast();
  const ctx = useCashierCtx();
  const [loadingStepOne, setLoadingStepOne] = useState<boolean>(false);
  const { ref, height } = useLeftColHeight();

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
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => setLoadingStepOne(false));
  };

  const getCCards = (storeid: number) => {
    ctx.dispatch(setSelectedStoreCard(storeid));
    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);
    getCashierCards(
      ctx.miktoUrl,
      ctx.userid,
      start,
      end,
      0,
      storeid,
      1,
      ctx.apiKey,
    )
      .then((resp) => {
        const j: CashierCardResp = resp.data;
        if (j.error === 0) {
          ctx.dispatch(setCashierCards(j.stores));
        }
      })
      .catch((err: JsonError) => {
        ctx.dispatch(setSelectedStoreCard(0));
        toast.error(err.message);
      });
  };

  const riskTextColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "text-emerald-600";
      case "Medium":
        return "text-orange-600";
      case "High":
        return "text-red-600";
      default:
        return "text-content";
    }
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] w-full p-4 overflow-hidden grid grid-cols-[1fr_4fr] gap-4">
      <div className="flex flex-col gap-2">
        {/* controls */}
        <div ref={ref} className="bg-custom-white p-2 rounded-lg shadow-lg">
          <StorePicker />
          <DatePickers handleQuery={getSCards} />
        </div>
        {loadingStepOne ? (
          <div
            className="relative bg-custom-white p-2 rounded-lg shadow-lg"
            style={{ minHeight: `${height}px`, maxHeight: `${height}px` }}
          >
            <LoadingIndicator message="Loading stores..." />
          </div>
        ) : null}
        {ctx.storeCards.length ? (
          <div
            className="bg-custom-white p-2 rounded-lg shadow-lg"
            style={{ minHeight: `${height}px`, maxHeight: `${height}px` }}
          >
            <Input label="Stores" value="" setValue={() => {}} />
            <div className="space-y-2 max-h-[87%] overflow-hidden overflow-y-auto no-scrollbar mt-2">
              {ctx.storeCards.map((s, i) => (
                <div
                  key={i}
                  className={`text-sm rounded-lg shadow-md p-2 ${ctx.selectedStoreCard === s.storeid ? "bg-orange-200" : "bg-bkg/50"} hover:bg-orange-200 cursor-pointer transition-all duration-200`}
                  onClick={() => getCCards(s.storeid)}
                >
                  <div className="flex justify-between">
                    <div>{s.store_name}</div>
                    <div className="font-medium">
                      Risk:{" "}
                      <span className={riskTextColor(s.risk_tier)}>
                        {s.risk_tier}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div>Sales</div>
                    <div className="font-medium">
                      {formatCurrency2(s.total_sales)}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div>Qty</div>
                    <div className="font-medium">
                      {formatBigNumber(s.total_qty, 0)}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div>Transactions</div>
                    <div className="font-medium">
                      {formatBigNumber(s.total_transactions, 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Right column */}
      <div className="grid grid-cols-[1fr_2fr] gap-4">
        {/* right col => col 1 */}
        <div className="">
          <StoreOverview />
        </div>

        {/* right col => col 2 */}
        <div className="">
          {/* <div className="bg-custom-white p-2 rounded-lg shadow-lg"></div> */}
        </div>
      </div>
    </div>
  );
};

export default Cashiers;
