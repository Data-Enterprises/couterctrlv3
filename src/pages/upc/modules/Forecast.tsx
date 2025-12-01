import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
// import {
//   tableHeaderForecast,
//   tableHeaderForecastMetrics,
//   exportData,
//   options,
//   instructions,
// } from "./utils";
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import QtyMetrics from "./forecast/QtyMetrics";
// import { Handlers } from "../../interfaces";
// import { setMenuPosition } from "../../features/contextMenuSlice";

// Components
// import Line from "./charts/Line";
// import MetricsCarousel from "./forecastComponents/MetricsCarousel";
// import QtyMetrics from "./forecastComponents/QtyMetrics";
// import CtxMenu from "../../components/CtxMenu";
// import UpcControls from "./components/UpcControls";
// import UpcModal from "./components/UpcModal";
// import { reset } from "../../features/upcModalSlice";

const Forecast = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const upcState = useAppSelector((state) => state.upc);
  // const modal = useAppSelector((state) => state.upcModal);

  // const handleExport = () => {
  //   if (
  //     !modal.fileName &&
  //     !modal.radioOption.dates &&
  //     !modal.radioOption.metrics
  //   ) {
  //     toast.warn("Please enter a file name and select at least one option");
  //     return;
  //   } else if (modal.fileName === "") {
  //     toast.warn("Please enter a file name");
  //     return;
  //   } else if (!modal.radioOption.dates && !modal.radioOption.metrics) {
  //     toast.warn("Please select at least one option");
  //     return;
  //   }

  //   if (modal.radioOption.dates) {
  //     exportData(upcState.forecastExport, tableHeaderForecast, modal.fileName);
  //   } else if (modal.radioOption.metrics) {
  //     exportData(
  //       upcState.forecastMetricExport,
  //       tableHeaderForecastMetrics,
  //       modal.fileName
  //     );
  //   }

  //   dispatch(reset());
  // };

  // const handleCopy = async (text: string) => {
  //   await navigator.clipboard.writeText(text);
  //   dispatch(setMenuPosition(null));
  // };

  // const handlers: Handlers = {
  //   copyUpc: () => handleCopy(upcState.clipboardText.upc),
  //   copyDesc: () => handleCopy(upcState.clipboardText.desc),
  // };

  return (
    <div className={`w-full h-screen`}>
      <CtxMenu
        className="hover:bg-panel_active/70"
        options={options}
        handlers={handlers}
      />
      <UpcModal handleExport={handleExport} />
      <div className="grid gap-2 mx-4 grid-cols-[0.3fr_1.7fr] min-h-[91%] max-h-[91%] pt-3">
        <UpcControls />
        <div className="grid grid-rows-[0.35fr_1.4fr] gap-2">
          <MetricsCarousel
            className={`${
              modal.openModal ? "opacity-50 pointer-events-none" : ""
            } absolute h-[150px]`}
          >
            <QtyMetrics mode="overall" metric="Quantity" />
            <QtyMetrics mode="selected" metric="Quantity" />
            <QtyMetrics mode="overall" metric="Sales" />
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
                <Line
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
    </div>
  );
};

export default Forecast;
