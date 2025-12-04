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
  setBottomFiveTrends,
  setDataLoaded,
  setForecastData,
  setForecastExport,
  setForecastHistory,
  setForecastMetricExport,
  setIndex,
  setIsLoading,
  setOptBestPrices,
  setOptBestPricesByUpc,
  setSalesComp,
  setTopFiveTrends,
  setUpcCount,
  setUpcItems,
  setUpcList,
  setUpcTrends,
} from "../../../features/upcSlice";
import {
  getForecasting,
  getPriceOpt,
  getSalesComp,
  getTrendDetect,
} from "../../../api/upc";
import type {
  JsonError,
  UpcForecast,
  UpcItem,
  UpcPriceOpt,
  UpcTrend,
} from "../../../interfaces";
import { colorCodes } from "../components";
import { convertData, formatForecastExport } from "../utils";

const UpcList = () => {
  const toast = useToast();
  const context = useUpcContext();
  const dispatch = useAppDispatch();
  const [file, setFile] = useState<File | null>(null);
  const [styling, setStyling] = useState<string>("h-[265px] w-[400px]");

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
      getPriceOptData();
    } else if (context.selectedMode == 4) {
      getTrendData();
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
          // Both of these need to have the naming conventions changed to match qty
          // then need to add the logic for the sales forecast as well
          const history = Object.entries(j.qty_results)
            .map(([k, v]) => [k, structuredClone(v as UpcForecast).history])
            .map(([id, obj], idx) =>
              convertData(
                id as string,
                obj as { date: string; value: number }[],
                idx,
                "history",
                j.qty_results
              )
            );

          const forecast = Object.entries(j.qty_results)
            .map(([k, v]) => [k, structuredClone(v as UpcForecast).forecast])
            .map(([id, obj], idx) =>
              convertData(
                id as string,
                obj as { date: string; value: number }[],
                idx,
                "forecast",
                j.qty_results
              )
            );

          // This is the new way to set the upc items and upc list from the rest of the endpoints
          const upcItems = Object.keys(j.qty_results).map((k) => ({
            product_code: k,
            description: j.qty_results[k as string].metrics.description,
          }));

          const upcList = Object.keys(j.qty_results).map((k, idx) => ({
            label: k,
            value: k,
            color: colorCodes[idx % colorCodes.length],
            metrics: j.qty_results[k as string].metrics,
          }));

          const qty = formatForecastExport(j.qty_results);
          // Setting this up for later use when sales forecast is added
          // const sales = formatForecastExport(j.sales_results);

          dispatch(setForecastExport(qty.data));
          dispatch(setForecastMetricExport(qty.metrics));
          dispatch(setUpcItems(upcItems));
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

  const getPriceOptData = () => {
    getPriceOpt(
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
          const upcItems = [...j.best_prices_by_upc].map(
            (item: UpcPriceOpt) => ({
              product_code: item.product_code,
              description: item.product_description,
            })
          );
          dispatch(setUpcItems(upcItems));
          dispatch(setUpcCount(j.best_prices_by_upc.length));
          dispatch(setOptBestPrices(j.best_prices));
          dispatch(setOptBestPricesByUpc(j.best_prices_by_upc));
          dispatch(setDataLoaded(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => cleanUp());
  };

  const getTrendData = () => {
    getTrendDetect(
      context.url,
      context.token,
      context.storeids,
      context.startDate,
      context.endDate,
      parseInt(context.trendPeriods),
      file!
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const upcItems = [...j.trends].map((item: UpcTrend) => ({
            product_code: item.product_code,
            description: item.product_description,
          }));
          dispatch(setUpcItems(upcItems));
          dispatch(setUpcTrends(j.trends));
          dispatch(setTopFiveTrends(j.top_5));
          dispatch(setBottomFiveTrends(j.bottom_5));
          dispatch(setDataLoaded(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
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
    <div data-testid="upc-list-page" className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] w-full p-4 relative">
      {context.dataLoaded ? (
        module()
      ) : (
        <div data-testid="upcwizard-container" className="flex justify-center items-center translate-y-2/3">
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
