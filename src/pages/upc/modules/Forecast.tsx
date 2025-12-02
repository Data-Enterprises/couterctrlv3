import { useAppSelector, useAppDispatch } from "../../../hooks";
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { instructions } from "../components";
import { useToast } from "../../../components/toasts/hooks/useToast";

// Components
import UpcControls from "../components/UpcControls";
import MetricsCarousel from "./forecast/MetricsCarousel";
import QtyMetrics from "./forecast/QtyMetrics";
import ForecastLine from "../components/ForecastLine";
import UpcModal from "../modal/UpcModal";
import {
  tableHeaderForecast,
  tableHeaderForecastMetrics,
} from "../exportHeaders";
import { exportData } from "../exportHeaders/utils";
import { reset } from "../../../features/upcModalSlice";

const Forecast = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const upcState = useAppSelector((state) => state.upc);
  const modal = useAppSelector((state) => state.upcModal);

  const handleExport = () => {
    if (
      !modal.fileName &&
      !modal.radioOption.dates &&
      !modal.radioOption.metrics
    ) {
      toast.warn("Please enter a file name and select at least one option");
      return;
    } else if (modal.fileName === "") {
      toast.warn("Please enter a file name");
      return;
    } else if (!modal.radioOption.dates && !modal.radioOption.metrics) {
      toast.warn("Please select at least one option");
      return;
    }

    if (modal.radioOption.dates) {
      exportData(upcState.forecastExport, tableHeaderForecast, modal.fileName);
    } else if (modal.radioOption.metrics) {
      exportData(
        upcState.forecastMetricExport,
        tableHeaderForecastMetrics,
        modal.fileName
      );
    }

    dispatch(reset());
  };

  return (
    <div className="h-full w-full grid grid-cols-[13%_87%] gap-4">
      <UpcModal handleExport={handleExport} />
      <UpcControls />
      <div className="grid grid-rows-[17%_83%] gap-2 mr-4 mb-2">
        <MetricsCarousel className={"-mt-2"}>
          <QtyMetrics mode="overall" metric="Quantity" />
          <QtyMetrics mode="selected" metric="Quantity" />
          {/* Add this back in once the sales results are added into redux */}
          {/* <QtyMetrics mode="overall" metric="Sales" /> */}
        </MetricsCarousel>
        <>
          {upcState.selectedUpcs.length === 0 ? (
            <div className="w-full h-[100%] flex justify-center items-center rounded-lg cursor-default">
              <div className="bg-custom-white rounded-lg shadow-lg p-6 text-content/70">
                <div className="underline text-center font-medium text-content/100">
                  Please Note
                </div>
                {instructions.map((line, i) => (
                  <div key={i} className="text-[15px]">
                    {i === 4 ? (
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
                <div className="bg-bkg"></div>
              </div>
            </div>
          ) : (
            <div className="bg-bkg rounded-lg shadow-lg">
              <ForecastLine
                title={"History"}
                title2={"Forecast"}
                data={[...upcState.forecastHistory, ...upcState.forecast]}
                search={upcState.selectedUpcs}
              />
            </div>
          )}
        </>
      </div>
    </div>
  );
};

export default Forecast;
