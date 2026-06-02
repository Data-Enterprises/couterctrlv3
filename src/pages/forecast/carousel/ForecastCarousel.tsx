import { useState } from "react";
import Carousel from "../../../components/Carousel";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import ForecastSimMetrics from "./ForecastSimMetrics";
import {
  loadSimRowData,
  setSelectedSim,
} from "../../../features/forecastSlice";
import type { SimBtns } from "../../../features/forecastSlice";
import ForecastControlBar from "../controls/ForecastControlBar";
import SaveSimModal from "../SaveSimModal";

interface ForecastCarouselProps {
  onItemsToggle?: () => void;
  showItemsPanel?: boolean;
}

const ForecastCarousel = ({
  onItemsToggle,
  showItemsPanel,
}: ForecastCarouselProps) => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.forecast);
  const [saveSimOpen, setSaveSimOpen] = useState(false);

  if (state.initialRowData.length === 0) return null;

  const handleSimClick = (sim: keyof SimBtns) => {
    dispatch(setSelectedSim(sim));
    dispatch(loadSimRowData(sim));
  };

  const handleSave = () => setSaveSimOpen(true);

  return (
    <Carousel className="min-h-[100px]">
      <div className="grid grid-cols-5 gap-2">
        <SaveSimModal
          isOpen={saveSimOpen}
          onClose={() => setSaveSimOpen(false)}
        />
        <ForecastControlBar
          onItemsToggle={onItemsToggle}
          showItemsPanel={showItemsPanel}
          onSave={handleSave}
        />
        <ForecastSimMetrics
          sim="sim1"
          rowData={state.simOneRowData}
          onClick={() => handleSimClick("sim1")}
          onSave={handleSave}
        />
        <ForecastSimMetrics
          sim="sim2"
          rowData={state.simTwoRowData}
          onClick={() => handleSimClick("sim2")}
          onSave={handleSave}
        />
        <ForecastSimMetrics
          sim="sim3"
          rowData={state.simThreeRowData}
          onClick={() => handleSimClick("sim3")}
          onSave={handleSave}
        />
        <ForecastSimMetrics
          sim="sim4"
          rowData={state.simFourRowData}
          onClick={() => handleSimClick("sim4")}
          onSave={handleSave}
        />
      </div>
    </Carousel>
  );
};

export default ForecastCarousel;
