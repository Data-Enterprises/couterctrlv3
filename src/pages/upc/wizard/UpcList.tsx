import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

// wizard
import UpcWizard from "./UpcWizard";
import StepOne from "./StepOne";
import StepThree from "./StepThree";
import StepTwo from "./StepTwo";

// modules
import SalesComp from "../modules/SalesComp";
import Forcast from "../modules/Forecast";
import PriceOpt from "../modules/PriceOpt";
import TrendDetector from "../modules/TrendDetector";

const UpcList = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [file, setFile] = useState<File | null>(null);
  const [styling, setStyling] = useState<string>("h-[200px] w-[450px]");

  const upc = useAppSelector((state) => state.upc);

  // To set the height and width of the wizard based on the step
  useEffect(() => {
    if (upc.index === 0) setStyling("h-[200px] w-[450px]");
    if (upc.index === 1) setStyling("h-[420px] w-[550px]");
    if (upc.index > 1) setStyling("h-[200px] w-[525px]");
  }, [upc.index]);

  const module = () => {
    if (upc.selectedMode == 1) return <SalesComp />;
    if (upc.selectedMode == 2) return <Forcast />;
    if (upc.selectedMode == 3) return <PriceOpt />;
    if (upc.selectedMode == 4) return <TrendDetector />;
  };

  // main get data function 
  const getData = () => {};

  return (
    <div className="h-[calc(100vh-3rem)] px-4 py-2 flex flex-col items-center justify-center select-none relative">
      {upc.dataLoaded ? (
        module()
      ) : (
        <>
          <UpcWizard
            className={`max-w-2xl mb-16 shadow-lg ${styling}`}
            index={upc.index}
          >
            <StepOne
              className={"h-[280px] w-[450px]"}
              file={file}
              setFile={setFile}
            />
            <StepTwo className={"h-[420px] w-[550px]"} />
            <StepThree />
          </UpcWizard>
        </>
      )}
    </div>
  );
};

export default UpcList;
