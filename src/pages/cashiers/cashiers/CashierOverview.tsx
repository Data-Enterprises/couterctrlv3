import type { CashierCard } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import ExceptionRow from "../stores/ExceptionRow";
import { UserIcon } from "@heroicons/react/24/outline";

interface CashierCardProps {
  cashier: CashierCard;
}

const CashierOverview = ({ cashier }: CashierCardProps) => {
  const riskTierColor = () => {
    switch (cashier.risk_tier) {
      case "Low":
        return "text-emerald-500";
      case "Medium":
        return "text-orange-500";
      default:
        return "text-red-500";
    }
  };

  const exceptionTierColor = () => {
    if (cashier.exception_tier.toLowerCase().includes("low")) {
      return "text-emerald-500 font-bold";
    } else if (cashier.exception_tier.toLowerCase().includes("medium")) {
      return "text-orange-500 font-bold";
    } else {
      return "text-red-500 font-bold";
    }
  };
  return (
    <div className="bg-custom-white p-2 rounded-lg shadow-lg text-[13px] xl:text-sm max-h-[345px] cursor-default">
      <div className="flex justify-between items-center border-b border-content/60">
        <div className="font-medium text-[12px]">
          {cashier.cashier_number} - {cashier.cashier_name}
        </div>
        <div className="font-medium text-[12px]">{cashier.store_name}</div>
      </div>

      <div className="mt-1 grid grid-cols-[25%_75%]">
        <div className="rounded-full w-[90%] flex justify-center items-center">
          <UserIcon className="w-16 h-16 text-blue-500" />
        </div>
        <div className="text-[12.5px] leading-tight grid grid-cols-2 text-content/60">
          <div>
            <div>Sales</div>
            <div className="font-medium">
              {formatCurrency2(cashier.total_sales)}
            </div>
          </div>
          <div>
            <div>Net</div>
            <div className="font-medium">
              {formatCurrency2(cashier.net_sales)}
            </div>
          </div>
          <div>
            <div>Qty</div>
            <div className="font-medium">
              {formatBigNumber(cashier.total_qty, 0)}
            </div>
          </div>
          <div>
            <div>Transactions</div>
            <div className="font-medium">
              {formatBigNumber(cashier.total_transactions, 0)}
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
          col2={cashier.voided_sales}
          col3={cashier.voided_qty}
          col4={cashier.voided_count}
          col5={cashier.voided_rate}
          storeid={cashier.storeid}
          cashierNumber={cashier.cashier_number}
        />
        <ExceptionRow
          type="Refunded"
          col2={cashier.refunded_sales}
          col3={cashier.refunded_qty}
          col4={cashier.refunded_count}
          col5={cashier.refunded_rate}
          bgColor="bg-blue-200/50"
          storeid={cashier.storeid}
          cashierNumber={cashier.cashier_number}
        />
        <ExceptionRow
          type="No Sale"
          col2={cashier.no_sale_sales}
          col3={cashier.no_sale_qty}
          col4={cashier.no_sale_count}
          col5={cashier.no_sale_rate}
          storeid={cashier.storeid}
          cashierNumber={cashier.cashier_number}
        />
        <ExceptionRow
          type="Hand Key"
          col2={cashier.hand_key_sales}
          col3={cashier.hand_key_qty}
          col4={cashier.hand_key_count}
          col5={cashier.hand_key_rate}
          bgColor="bg-blue-200/50"
          storeid={cashier.storeid}
          cashierNumber={cashier.cashier_number}
        />
        <ExceptionRow
          type="Cancelled"
          col2={cashier.cancelled_sales}
          col3={cashier.cancelled_qty}
          col4={cashier.cancelled_count}
          col5={cashier.cancelled_rate}
          storeid={cashier.storeid}
          cashierNumber={cashier.cashier_number}
        />
        <ExceptionRow
          type="Adjustment"
          col2={cashier.adjustment_sales}
          col3={cashier.adjustment_qty}
          col4={cashier.adjustment_count}
          col5={cashier.adjustment_rate}
          bgColor="bg-blue-200/50"
          storeid={cashier.storeid}
          cashierNumber={cashier.cashier_number}
        />
        <ExceptionRow
          type="Backup"
          col2={cashier.backup_sales}
          col3={cashier.backup_qty}
          col4={cashier.backup_count}
          col5={cashier.backup_rate}
          storeid={cashier.storeid}
          cashierNumber={cashier.cashier_number}
        />
        <ExceptionRow
          type="Modified"
          col2={cashier.modified_sales}
          col3={cashier.modified_qty}
          col4={cashier.modified_count}
          col5={cashier.modified_rate}
          bgColor="bg-blue-200/50"
          storeid={cashier.storeid}
          cashierNumber={cashier.cashier_number}
        />
        <div className="flex justify-center gap-4 font-medium cursor-default">
          <div className="flex gap-1">
            <div>Tier:</div>
            <div className={exceptionTierColor()}>{cashier.exception_tier}</div>
          </div>
          <div className="flex gap-1">
            <div>Risk:</div>
            <div className={`font-bold ${riskTierColor()}`}>
              {cashier.risk_tier}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierOverview;
