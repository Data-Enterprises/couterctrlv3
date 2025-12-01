import { useEffect, useState } from "react";
import { useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { useUpcContext } from "./hooks";

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
import {
  setDataLoaded,
  setForecastData,
  setForecastHistory,
  setIndex,
  setIsLoading,
  setSalesComp,
  setUpcCount,
  setUpcItems,
  setUpcList,
} from "../../../features/upcSlice";
import { getForecasting, getSalesComp } from "../../../api/upc";
import type {
  Forecast,
  JsonError,
  UpcForecast,
  UpcItem,
} from "../../../interfaces";
import { colorCodes } from "../components";

const UpcList = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [file, setFile] = useState<File | null>(null);
  const [styling, setStyling] = useState<string>("h-[265px] w-[400px]");

  // Scopes the useAppSelector to the UPC upload context
  const context = useUpcContext();

  // To set the height and width of the wizard based on the step
  useEffect(() => {
    if (context.index === 0) setStyling("h-[265px] w-[400px]");
    if (context.index === 1) setStyling("h-[420px] w-[530px]");
    if (context.index === 2) setStyling("h-[200px] w-[530px]");
  }, [context.index]);

  // Data fetching based on selected mode
  const getData = () => {
    dispatch(setIsLoading(true));
    if (context.selectedMode == 1) {
      getCompData();
    } else if (context.selectedMode == 2) {
      getForecastData();
    } else if (context.selectedMode == 3) {
      // getPriceOptData();
    } else if (context.selectedMode == 4) {
      // getTrendData();
    }
  };

  // The data fetching functions => aws permission issues => resolve MONDAY
  const getCompData = () => {
    getSalesComp(
      context.url,
      context.token,
      context.storeids,
      context.startDate,
      context.endDate,
      file!
    )
      .then((resp) => {
        const j = resp.data;
        const upcCopy = [...j.daily].reduce((acc: UpcItem[], cur) => {
          if (!acc.find((item) => item.product_code === cur.product_code)) {
            acc.push({
              product_code: cur.product_code,
              description: cur.description,
            });
          }
          return acc;
        }, []);
        dispatch(setUpcItems(upcCopy));
        dispatch(setUpcCount(j.upc_count));
        dispatch(setSalesComp(j.daily));
        dispatch(setDataLoaded(true));
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => cleanUp());
  };

  const getForecastData = () => {
    getForecasting(
      context.url,
      context.token,
      context.storeids,
      context.startDate,
      context.endDate,
      file!
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const convertData = (
            id: string,
            data: { date: string; value: number }[],
            idx: number,
            type = "history"
          ): Forecast => {
            const newData = {
              id: `${id} - ${type}`,
              data: data
                .map((item) => ({
                  x: item.date.split("/").splice(0, 2).join("/"),
                  y: item.value,
                }))
                .slice(-7),
              color: colorCodes[idx % colorCodes.length],
            };

            if (type === "forecast") {
              // Find the last date in the history data for that upc and shift the forecast dates accordingly => attaches both history and forecast on the chart
              const historyEntry = Object.entries(j.results)
                .map(([k, v]) => [k, structuredClone(v as UpcForecast).history])
                .find(([k]) => k === id);
              if (!historyEntry) return newData;
              const historyDates = historyEntry[1] as {
                date: string;
                value: number;
              }[];
              const lastHistoryDate = historyDates[historyDates.length - 1] as {
                date: string;
                value: number;
              };
              newData.data.unshift({
                x: lastHistoryDate.date.split("/").splice(0, 2).join("/"),
                y: lastHistoryDate.value,
              });
            }
            return newData;
          };

          const history = Object.entries(j.results)
            .map(([k, v]) => [k, structuredClone(v as UpcForecast).history])
            .map(([id, obj], idx) =>
              convertData(
                id as string,
                obj as { date: string; value: number }[],
                idx
              )
            );

          const forecast = Object.entries(j.results)
            .map(([k, v]) => [k, structuredClone(v as UpcForecast).forecast])
            .map(([id, obj], idx) =>
              convertData(
                id as string,
                obj as { date: string; value: number }[],
                idx,
                "forecast"
              )
            );

          const upcList = Object.keys(j.results).map((k, idx) => ({
            label: k,
            value: k,
            color: colorCodes[idx % colorCodes.length],
            metrics: j.results[k as string].metrics,
          }));

          // const { data, metrics } = formatForecastExport(j.results);
          // dispatch(setForecastExport(data));
          // dispatch(setForecastMetricExport(metrics));
          dispatch(setForecastData(forecast));
          dispatch(setForecastHistory(history));
          dispatch(setUpcList(upcList));
          dispatch(setUpcCount(j.upc_count));
          dispatch(setDataLoaded(true));
        }
      })
      .catch((err: JsonError) => {
        toast.error(err.message);
      })
      .finally(() => cleanUp());
  };

  const cleanUp = () => {
    dispatch(setIsLoading(false));
    dispatch(setIndex(0));
    setFile(null);
  };

  // The returned module based on selected mode
  const module = () => {
    if (context.selectedMode == 1) return <SalesComp />;
    if (context.selectedMode == 2) return <Forcast />;
    if (context.selectedMode == 3) return <PriceOpt />;
    if (context.selectedMode == 4) return <TrendDetector />;
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] w-full p-4 relative">
      {context.dataLoaded ? (
        module()
      ) : (
        <div className="flex justify-center items-center min-h-[calc(100vh-3rem)]">
          <UpcWizard
            className={`max-w-2xl mb-16 shadow-lg ${styling}`}
            index={context.index}
          >
            <StepOne
              className={"h-[265px] w-[400px]"}
              file={file}
              setFile={setFile}
            />
            <StepTwo className={"h-[420px] w-[530px]"} getData={getData} />
            <StepThree className="h-[200px] w-[530px]" />
          </UpcWizard>
        </div>
      )}
    </div>
  );
};

export default UpcList;
