import { useEffect, useState } from "react";
import { useCashierCtx } from "..";

const StoreOverview = () => {
  const ctx = useCashierCtx();

  const storeCard = ctx.storeCards.find(
    (s) => s.storeid === ctx.selectedStoreCard,
  );

  if (!storeCard) return null;

  const exceptionTotals = storeCard.voided_qty + storeCard.cancelled_qty + storeCard.backup_qty;

  return (
    <div className="bg-custom-white p-2 rounded-lg shadow-lg">
      <div className="text-sm font-medium">Store Overview</div>
      <StatusBar
        label="Voided Qty"
        value={storeCard.voided_qty}
        threshold={exceptionTotals}
        isFlex={true}
      />
    </div>
  );
};

export default StoreOverview;

interface StatusBarProps {
  label: string;
  value: number;
  threshold: number;
  isFlex?: boolean;
}
const StatusBar = ({ label, value, threshold, isFlex }: StatusBarProps) => {
  const [animatedValue, setAnimatedValue] = useState<number>(0);
  const [bgColor, setBgColor] = useState<string>("bg-red-500");

  useEffect(() => {
    const percent =
      threshold > 0 ? Math.min((animatedValue / threshold) * 100, 100) : 0;
    if (percent <= 75 && percent >= 50) {
      setBgColor("bg-orange-500");
    } else if (percent > 75) {
      setBgColor("bg-green-500");
    } else {
      setBgColor("bg-red-500");
    }
  }, [animatedValue]);

  useEffect(() => {
    const id = setTimeout(() => {
      setAnimatedValue(value);
    }, 0);

    return () => clearTimeout(id);
  }, [value, threshold]);

  const percentage =
    threshold > 0 ? Math.min((animatedValue / threshold) * 100, 100) : 0;

  return (
    <div
      className={`w-full ${isFlex ? "flex justify-between items-center gap-2" : ""}`}
    >
      <div className="font-medium text-sm text-nowrap">{label}</div>
      <div className="w-full h-5 bg-bkg rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${bgColor} transition-[width] transition-color duration-700 ease-in-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
