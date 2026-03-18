import { useAppSelector } from "../../../hooks";
import CashierTrendCardMobile from "./CashierTrendCardMobile";



const MobileTrendCards = () => {
  const cashier = useAppSelector((state) => state.cashier);
  return (
    <div className="grid gap-4">
      {cashier.cashierDetails.map((s, idx) => (
        <CashierTrendCardMobile s={s} idx={idx} key={`${s.storeid}-${s.sale_type}`} />
      ))}
    </div>
  )
};

export default MobileTrendCards;