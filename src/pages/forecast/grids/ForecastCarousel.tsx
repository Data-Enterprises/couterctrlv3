import Carousel from "../../../components/Carousel";
import { useAppSelector } from "../../../hooks";

const ForecastCarousel = () => {
  const state = useAppSelector((state) => state.forecast);

  if (state.rowData.length === 0) return null;

  const tempClass =
    "text-lg font-medium bg-custom-white rounded-lg shadow-lg flex items-center justify-center h-40";

  return (
    <Carousel className="min-h-[230px]">
      <div className="grid grid-cols-4 gap-4">
        <span className={tempClass}>Price Simulation Overview 1</span>
        <span className={tempClass}>Price Simulation Overview 2</span>
        <span className={tempClass}>Price Simulation Overview 3</span>
        <span className={tempClass}>Price Simulation Overview 4</span>
      </div>
    </Carousel>
  );
};

export default ForecastCarousel;
