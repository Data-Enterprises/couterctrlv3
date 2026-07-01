import { useCashierCtx } from "..";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { getCashierCards } from "../../../../api/cashiers";
import {
  reQueryStepTwo,
  setCashierCards,
  setCashierFilterType,
  setDataView,
  setLoadingCashiers,
  setSelectedStoreCard,
} from "../../../../features/cashiersLegacySlice";
import type {
  CashierCardResp,
  JsonError,
  StoreCard,
} from "../../../../interfaces";
import {
  formatBigNumber,
  formatCurrency2,
  formatGoliathDate,
} from "../../../../utils";

import ExceptionRow from "./ExceptionRow";
import { BuildingStorefrontIcon } from "@heroicons/react/24/outline";

interface StoreCardProps {
  store: StoreCard;
}
const StoreOverview = ({ store }: StoreCardProps) => {
  const ctx = useCashierCtx();
  const toast = useToast();

  const riskTierColor = () => {
    switch (store.risk_tier) {
      case "Low":
        return "text-emerald-500";
      case "Medium":
        return "text-orange-500";
      default:
        return "text-red-500";
    }
  };

  const exceptionTierColor = () => {
    if (store.exception_tier.toLowerCase().includes("low")) {
      return "text-emerald-500 font-bold";
    } else if (store.exception_tier.toLowerCase().includes("medium")) {
      return "text-orange-500 font-bold";
    } else {
      return "text-red-500 font-bold";
    }
  };

  const getCCards = () => {
    ctx.dispatch(setCashierFilterType(""));
    ctx.dispatch(setSelectedStoreCard(store.storeid));
    ctx.dispatch(reQueryStepTwo());
    ctx.dispatch(setLoadingCashiers(true));
    ctx.dispatch(setDataView("cashiers"));

    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);
    getCashierCards(
      ctx.miktoUrl,
      ctx.userid,
      start,
      end,
      0,
      store.storeid,
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
        ctx.dispatch(setDataView("stores"));
        toast.error("Error fetching cashiers... " + err.message);
      })
      .finally(() => ctx.dispatch(setLoadingCashiers(false)));
  };

  return (
    <div className="bg-custom-white p-2 rounded-lg shadow-lg text-[13px] xl:text-sm cursor-pointer max-h-[345px]">
      <div onClick={getCCards}>
        <div className="flex justify-between items-center border-b border-content/60">
          <div className="font-medium text-[12.5px]">
            {store.store_name.split(" - ")[0]}
          </div>
          <div className="font-medium text-[12.5px]">
            {store.store_name.split(" - ")[1]}
          </div>
        </div>

        <div className="mt-1 text-[12.5px] leading-tight grid grid-cols-[25%_75%] hover:bg-orange-200 transition-all duration-200 rounded-lg">
          <div className="rounded-full w-[90%] flex justify-center items-center">
            <BuildingStorefrontIcon className="w-16 h-16 text-blue-500" />
          </div>
          <div className="mt-1 grid grid-cols-2 text-content/60">
            <div>
              <div>Sales</div>
              <div className="font-medium">
                {formatCurrency2(store.total_sales)}
              </div>
            </div>
            <div>
              <div>Net</div>
              <div className="font-medium">
                {formatCurrency2(store.net_sales)}
              </div>
            </div>
            <div>
              <div>Qty</div>
              <div className="font-medium">
                {formatBigNumber(store.total_qty, 0)}
              </div>
            </div>
            <div>
              <div>Transactions</div>
              <div className="font-medium">
                {formatBigNumber(store.total_transactions, 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-rows-9 mt-1 text-[10.5px] xl:text-[12px]">
        <div className="grid grid-cols-[26%_24%_18%_15%_19%] border-b border-content/60 font-medium cursor-default">
          <div>Exception</div>
          <div>Sales</div>
          <div>Qty</div>
          <div>Count</div>
          <div>Rate</div>
        </div>
        <ExceptionRow
          type="Voided"
          col2={store.voided_sales}
          col3={store.voided_qty}
          col4={store.voided_count}
          col5={store.voided_rate}
          storeid={store.storeid}
        />
        <ExceptionRow
          type="Refunded"
          col2={store.refunded_sales}
          col3={store.refunded_qty}
          col4={store.refunded_count}
          col5={store.refunded_rate}
          bgColor="bg-blue-200/50"
          storeid={store.storeid}
        />
        <ExceptionRow
          type="No Sale"
          col2={store.no_sale_sales}
          col3={store.no_sale_qty}
          col4={store.no_sale_count}
          col5={store.no_sale_rate}
          storeid={store.storeid}
        />
        <ExceptionRow
          type="Hand Key"
          col2={store.hand_key_sales}
          col3={store.hand_key_qty}
          col4={store.hand_key_count}
          col5={store.hand_key_rate}
          bgColor="bg-blue-200/50"
          storeid={store.storeid}
        />
        <ExceptionRow
          type="Cancelled"
          col2={store.cancelled_sales}
          col3={store.cancelled_qty}
          col4={store.cancelled_count}
          col5={store.cancelled_rate}
          storeid={store.storeid}
        />
        <ExceptionRow
          type="Adjustment"
          col2={store.adjustment_sales}
          col3={store.adjustment_qty}
          col4={store.adjustment_count}
          col5={store.adjustment_rate}
          bgColor="bg-blue-200/50"
          storeid={store.storeid}
        />
        <ExceptionRow
          type="Backup"
          col2={store.backup_sales}
          col3={store.backup_qty}
          col4={store.backup_count}
          col5={store.backup_rate}
          storeid={store.storeid}
        />
        <ExceptionRow
          type="Modified"
          col2={store.modified_sales}
          col3={store.modified_qty}
          col4={store.modified_count}
          col5={store.modified_rate}
          bgColor="bg-blue-200/50"
          storeid={store.storeid}
        />
        <div
          className="flex justify-center gap-4 font-medium cursor-default"
          // onClick={getCCards}
        >
          <div className="flex gap-1">
            <div>Tier:</div>
            <div className={exceptionTierColor()}>{store.exception_tier}</div>
          </div>
          <div className="flex gap-1">
            <div>Risk:</div>
            <div className={`font-bold ${riskTierColor()}`}>
              {store.risk_tier}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreOverview;
