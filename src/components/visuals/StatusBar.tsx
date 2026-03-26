import { useState, useEffect } from "react";
import { formatBigNumber } from "../../utils";

interface StatusBarProps {
  label: string;
  value: number;
  threshold: number;
  isFlex?: boolean;
  height?: number;
  isRated?: boolean;
  showValue?: boolean;
}
const StatusBar = ({
  label,
  value,
  threshold,
  isFlex,
  height = 20,
  isRated = false,
  showValue = true,
}: StatusBarProps) => {
  const [animatedValue, setAnimatedValue] = useState<number>(0);
  const [bgColor, setBgColor] = useState<string>("bg-red-500");

  useEffect(() => {
    const percent =
      threshold > 0 ? Math.min((animatedValue / threshold) * 100, 100) : 0;
    if (percent <= 75 && percent >= 50) {
      setBgColor("bg-orange-500 border-orange-600");
    } else if (percent > 75) {
      setBgColor("bg-emerald-500 border-emerald-600");
    } else {
      setBgColor("bg-red-500 border-red-600");
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
      className={`w-full ${isFlex ? "grid grid-cols-[18%_78%] items-center gap-2" : ""}`}
    >
      <div className="font-medium text-sm text-nowrap">{label}</div>
      <div
        className={`w-full rounded-full overflow-hidden`}
        style={{ height: `${height}px` }}
      >
        <div
          className={`h-full rounded-full border-2 shadow-inner ${isRated ? bgColor : "bg-emerald-500 border-emerald-600"} flex items-center justify-center text-custom-white text-center transition-[width] transition-color duration-700 ease-in-out`}
          style={{ width: `${percentage}%` }}
        >
          {showValue ? formatBigNumber(value, 0) : ""}
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
