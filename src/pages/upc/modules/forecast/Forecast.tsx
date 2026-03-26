import { useAppSelector, useAppDispatch } from "../../../../hooks";
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { instructions } from "../../components";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Components
import UpcControls from "../../components/UpcControls";
import QtyMetrics from "../forecast/QtyMetrics";
import UpcModal from "../../modal/UpcModal";
import {
  tableHeaderForecast,
  tableHeaderForecastMetrics,
} from "../../exportHeaders";
import { exportData } from "../../exportHeaders/utils";
import { reset } from "../../../../features/upcModalSlice";
import ForecastCardList from "./ForecastCardList";

const Forecast = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const upcState = useAppSelector((state) => state.upc);
  const modal = useAppSelector((state) => state.upcModal);

  const handleExport = () => {
    if (modal.fileName === "") {
      toast.warn("Please enter a file name");
      return;
    }

    if (modal.radioOption.dates) {
      exportData(upcState.forecastExport, tableHeaderForecast, modal.fileName);
    } else if (modal.radioOption.metrics) {
      exportData(
        upcState.forecastMetricExport,
        tableHeaderForecastMetrics,
        modal.fileName,
      );
    }

    dispatch(reset());
  };

  return (
    <div
      data-testid="upc-forecast"
      className="min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] overflow-hidden w-full grid grid-cols-[15%_84%] gap-4"
    >
      <UpcModal handleExport={handleExport} />
      <div>
        <UpcControls />
      </div>
      <div className="space-y-4 mr-4 mb-2">
        <QtyMetrics />
        <>
          {upcState.selectedUpcs.length === 0 ? (
            <div className="w-full h-[100%] flex justify-center items-center rounded-lg cursor-default">
              <div className="bg-custom-white rounded-lg shadow-lg p-6 text-content/70">
                <div className="underline text-center font-medium text-content/100">
                  Please Note
                </div>
                {instructions.map((line, i) => (
                  <div key={i} className="text-[15px]">
                    {i === 2 ? (
                      <div className="flex gap-1">
                        {line.text.split("icons")[0]}
                        <InformationCircleIcon
                          height={23}
                          width={23}
                          className="fill-content/30 rounded-full transition-all duration-200 hover:fill-blue-500 cursor-pointer"
                        />
                        {line.text.split("the")[1]}
                      </div>
                    ) : (
                      line.text
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <ForecastCardList />
          )}
        </>
      </div>
    </div>
  );
};

export default Forecast;
