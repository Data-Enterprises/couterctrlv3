// Utils
import { formatCurrency2 } from "../../../../../../utils";

interface TxTotalsProps {
  txCoupons: number;
  txTax: number;
  txNet: number;
  txTotal: number;
}

/** Coupons, tax, net and total for the transaction. */
const TxTotals = ({ txCoupons, txTax, txNet, txTotal }: TxTotalsProps) => (
    <div className="flex-shrink-0 flex items-center justify-end gap-4 px-3 py-2 border-t border-line_hair bg-fill_soft">
      {txCoupons > 0 && (
        <div className="text-[11px] text-severity_watch_text">
          Coupons{" "}
          <span className="font-medium ml-1">
            -{formatCurrency2(txCoupons)}
          </span>
        </div>
      )}
      <div className="text-[11px] text-content/95">
        Tax{" "}
        <span className="text-content font-medium ml-1">
          {formatCurrency2(txTax)}
        </span>
      </div>
      <div className="text-[11px] text-content/95">
        Net{" "}
        <span className="text-content font-medium ml-1">
          {formatCurrency2(txNet)}
        </span>
      </div>
      <div className="text-[11px] text-content/95 font-medium">
        Total{" "}
        <span className="text-content ml-1">
          {formatCurrency2(txTotal)}
        </span>
      </div>
    </div>
);

export default TxTotals;
