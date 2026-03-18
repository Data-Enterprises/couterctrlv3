import { useAppSelector } from "../../hooks";
import CashierTrendCard from "./components/CashierTrendCard";
import Carousel from "../../components/Carousel";

const TrendCardCarousel = () => {
  const cashier = useAppSelector((state) => state.cashier);
  const context = useAppSelector((state) => state.app);

  return (
    <>
      {context.isDesktop ? (
        <Carousel className="h-[228px]">
          {cashier.chunkedSales.map((_, i) => (
            <div key={i} className="grid grid-cols-3 gap-3">
              {cashier.chunkedSales[i].map((s, idx) => (
                <CashierTrendCard key={idx} s={s} idx={idx} />
              ))}
            </div>
          ))}
        </Carousel>
      ) : (
        <div>
          {cashier.cashierDetails.map((s, idx) => (
            <div key={idx} className="mb-4">
              <CashierTrendCard key={idx} s={s} idx={idx} />
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default TrendCardCarousel;
