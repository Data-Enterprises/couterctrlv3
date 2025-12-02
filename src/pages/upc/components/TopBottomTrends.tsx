import { useAppSelector } from "../../../hooks";
import { useDispatch } from "react-redux";
// import { setOpenModal, setUpc } from "../../../features/trendModalSlice";
import type { UpcTrend } from "../../../interfaces";

interface TopBottomTrendsProps {
  type: "Top" | "Bottom";
}

const TopBottomTrends = ({ type }: TopBottomTrendsProps) => {
  const dispatch = useDispatch();
  const state = useAppSelector((state) => state.upc);
  const trends = type === "Top" ? state.topFiveTrends : state.bottomFiveTrends;

  const handleClick = (upc: string) => {
    // dispatch(setUpc(upc));
    // dispatch(setOpenModal(true));
    console.log("Clicked UPC:", upc);
  };

  return (
    <>
      <div className="font-semibold text-center text-lg">{type} Five</div>
      <div className="h-full grid grid-cols-5 gap-2">
        {trends.map((item: UpcTrend) => (
          <div
            key={item.product_code}
            className="h-[70px] bg-custom-white rounded-lg shadow-md overflow-hidden relative cursor-pointer hover:shadow-lg"
            onClick={() => handleClick(item.product_code)}
          >
            <div className="absolute w-full">
              <div className="text-sm text-center">{item.product_code}</div>
              <div className="text-sm text-center font-medium">Days Active</div>
              <div className="grid grid-cols-2 text-sm text-center place-items-center">
                <div className="flex gap-1">
                  <div>Before:</div>
                  <div>{item.active_days_before}</div>
                </div>
                <div className="flex gap-1">
                  <div>After:</div>
                  <div>{item.active_days_after}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default TopBottomTrends;
