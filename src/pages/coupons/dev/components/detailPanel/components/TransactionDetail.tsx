// Interfaces
import type { TransactionListItem } from "../../../../../../interfaces";

// Components
import LoadingIndicator from "../../../../../../components-dev/loading/LoadingIndicator";
import TxHeader from "./TxHeader";
import TxLinesTable from "./TxLinesTable";
import TxTotals from "./TxTotals";

interface TransactionDetailProps {
  txMeta: TransactionListItem | null;
  txLines: TransactionListItem[];
  onBack: () => void;
  onExport: () => void;
  txCoupons: number;
  txTax: number;
  txNet: number;
  txTotal: number;
}

/** One transaction, opened from a coupon use. */
const TransactionDetail = ({
  txMeta,
  txLines,
  onBack,
  onExport,
  txCoupons,
  txTax,
  txNet,
  txTotal,
}: TransactionDetailProps) => (
    <>
      <TxHeader txMeta={txMeta} txLines={txLines} onBack={onBack} onExport={onExport} />
      {txLines.length === 0 ? (
        <div className="flex-1 relative min-h-0">
          <LoadingIndicator message="Loading transaction..." />
        </div>
      ) : (
        <>
          <TxLinesTable txLines={txLines} />
          <TxTotals txCoupons={txCoupons} txTax={txTax} txNet={txNet} txTotal={txTotal} />
        </>
      )}
    </>
);

export default TransactionDetail;
