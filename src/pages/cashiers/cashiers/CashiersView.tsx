import { useCashierCtx } from "..";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import CashierOverview from "./CashierOverview";

const CashiersView = () => {
  const ctx = useCashierCtx();

  if (ctx.loadingCashiers) {
    return (
      <div className="relative h-[calc(100vh-5rem)]">
        <LoadingIndicator message="Loading stores..." />
      </div>
    );
  }
  return (
    <div className="min-h-full grid grid-cols-3 gap-2">
      {ctx.cashierCards.map((card, i) => (
        <CashierOverview key={i} cashier={card} />
      ))}
    </div>
  );
};

export default CashiersView;
