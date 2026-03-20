import type { CashierCard } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import ExceptionRow from "../stores/ExceptionRow";

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
    <div className="bg-custom-white p-2 rounded-lg shadow-lg text-sm hover:bg-orange-200 transition-all duration-200 cursor-pointer h-[360px]">
      <div className="flex justify-between items-center border-b border-content/60">
        <div className="font-medium">{cashier.cashier_name}</div>
        <div className="font-medium">{cashier.store_name}</div>
      </div>

      <div className="mt-1 grid grid-cols-2">
        <div>
          <div className="text-content/60">Total Sales</div>
          <div className="font-medium">
            {formatCurrency2(cashier.total_sales)}
          </div>
        </div>
        <div>
          <div className="text-content/60">Net Sales</div>
          <div className="font-medium">
            {formatCurrency2(cashier.net_sales)}
          </div>
        </div>
        <div>
          <div className="text-content/60">Total Qty</div>
          <div className="font-medium">
            {formatBigNumber(cashier.total_qty, 0)}
          </div>
        </div>
        <div>
          <div className="text-content/60">Total Transactions</div>
          <div className="font-medium">
            {formatBigNumber(cashier.total_transactions, 0)}
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
          col2={cashier.voided_sales}
          col3={cashier.voided_qty}
          col4={cashier.voided_count}
          col5={cashier.voided_rate}
        />
        <ExceptionRow
          type="Refunded"
          col2={cashier.refunded_sales}
          col3={cashier.refunded_qty}
          col4={cashier.refunded_count}
          col5={cashier.refunded_rate}
          bgColor="bg-blue-200/50"
        />
        <ExceptionRow
          type="No Sale"
          col2={cashier.no_sale_sales}
          col3={cashier.no_sale_qty}
          col4={cashier.no_sale_count}
          col5={cashier.no_sale_rate}
        />
        <ExceptionRow
          type="Hand Key"
          col2={cashier.hand_key_sales}
          col3={cashier.hand_key_qty}
          col4={cashier.hand_key_count}
          col5={cashier.hand_key_rate}
          bgColor="bg-blue-200/50"
        />
        <ExceptionRow
          type="Cancelled"
          col2={cashier.cancelled_sales}
          col3={cashier.cancelled_qty}
          col4={cashier.cancelled_count}
          col5={cashier.cancelled_rate}
        />
        <ExceptionRow
          type="Adjustment"
          col2={cashier.adjustment_sales}
          col3={cashier.adjustment_qty}
          col4={cashier.adjustment_count}
          col5={cashier.adjustment_rate}
          bgColor="bg-blue-200/50"
        />
        <ExceptionRow
          type="Backup"
          col2={cashier.backup_sales}
          col3={cashier.backup_qty}
          col4={cashier.backup_count}
          col5={cashier.backup_rate}
        />
        <ExceptionRow
          type="Modified"
          col2={cashier.modified_sales}
          col3={cashier.modified_qty}
          col4={cashier.modified_count}
          col5={cashier.modified_rate}
          bgColor="bg-blue-200/50"
        />
        <div className="flex justify-between font-medium">
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
