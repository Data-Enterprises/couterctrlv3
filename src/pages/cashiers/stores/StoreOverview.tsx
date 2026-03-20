// import { useEffect, useState } from "react";
// import { useCashierCtx } from "..";
import type { StoreCard } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import ExceptionRow from "./ExceptionRow";

interface StoreCardProps {
  store: StoreCard;
}
const StoreOverview = ({ store }: StoreCardProps) => {
  // const ctx = useCashierCtx();

  console.log(store);

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

  return (
    <div className="bg-custom-white p-2 rounded-lg shadow-lg text-sm hover:bg-orange-200 transition-all duration-200 cursor-pointer h-[360px]">
      <div className="flex justify-between items-center border-b border-content/60">
        <div className="font-medium">{store.store_name}</div>
        <div className="font-medium">
          <span>Risk:</span>
          <span className={`ml-1 ${riskTierColor()}`}>{store.risk_tier}</span>
        </div>
      </div>

      <div className="mt-1 grid grid-cols-2">
        <div>
          <div className="text-content/60">Total Sales</div>
          <div className="font-medium">
            {formatCurrency2(store.total_sales)}
          </div>
        </div>
        <div>
          <div className="text-content/60">Net Sales</div>
          <div className="font-medium">{formatCurrency2(store.net_sales)}</div>
        </div>
        <div>
          <div className="text-content/60">Total Qty</div>
          <div className="font-medium">
            {formatBigNumber(store.total_qty, 0)}
          </div>
        </div>
        <div>
          <div className="text-content/60">Total Transactions</div>
          <div className="font-medium">
            {formatBigNumber(store.total_transactions, 0)}
          </div>
        </div>
      </div>

      <div className="grid grid-rows-9 mt-1">
        <div className="grid grid-cols-[22%_26%_22%_20%_10%] border-b border-content/60 font-medium">
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
        />
        <ExceptionRow
          type="Refunded"
          col2={store.refunded_sales}
          col3={store.refunded_qty}
          col4={store.refunded_count}
          col5={store.refunded_rate}
          bgColor="bg-blue-200/50"
        />
        <ExceptionRow
          type="No Sale"
          col2={store.no_sale_sales}
          col3={store.no_sale_qty}
          col4={store.no_sale_count}
          col5={store.no_sale_rate}
        />
        <ExceptionRow
          type="Hand Key"
          col2={store.hand_key_sales}
          col3={store.hand_key_qty}
          col4={store.hand_key_count}
          col5={store.hand_key_rate}
          bgColor="bg-blue-200/50"
        />
        <ExceptionRow
          type="Cancelled"
          col2={store.cancelled_sales}
          col3={store.cancelled_qty}
          col4={store.cancelled_count}
          col5={store.cancelled_rate}
        />
        <ExceptionRow
          type="Adjustment"
          col2={store.adjustment_sales}
          col3={store.adjustment_qty}
          col4={store.adjustment_count}
          col5={store.adjustment_rate}
          bgColor="bg-blue-200/50"
        />
        <ExceptionRow
          type="Backup"
          col2={store.backup_sales}
          col3={store.backup_qty}
          col4={store.backup_count}
          col5={store.backup_rate}
        />
        <ExceptionRow
          type="Modified"
          col2={store.modified_sales}
          col3={store.modified_qty}
          col4={store.modified_count}
          col5={store.modified_rate}
          bgColor="bg-blue-200/50"
        />
        <div className="flex gap-1 font-medium">
          <div>Exception Tier:</div>
          <div>{store.exception_tier}</div>
        </div>
      </div>
    </div>
  );
};

export default StoreOverview;
