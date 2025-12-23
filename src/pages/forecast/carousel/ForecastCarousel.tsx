import Carousel from "../../../components/Carousel";
import { useAppSelector } from "../../../hooks";
import ForecastSimMetrics from "./ForecastSimMetrics";

const ForecastCarousel = () => {
  const state = useAppSelector((state) => state.forecast);

  if (state.initialRowData.length === 0) return null;

  return (
    <Carousel className="min-h-[230px]">
      <div className="grid grid-cols-4 gap-4">
        <ForecastSimMetrics sim="sim1" rowData={state.simOneRowData} order={1} />
        <ForecastSimMetrics sim="sim2" rowData={state.simTwoRowData} order={2} />
        <ForecastSimMetrics sim="sim3" rowData={state.simThreeRowData} order={3} />
        <ForecastSimMetrics sim="sim4" rowData={state.simFourRowData} order={4} />
      </div>
    </Carousel>
  );
};

export default ForecastCarousel;
