import { useEffect, useState } from "react";
import { useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { useUpcContext } from "./hooks";

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
  setRadioId,
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

import ModeSelect from "./components/ModeSelect";
import StoreDatePicker from "../components/StoreDatePicker";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import NoDataDisplay from "../components/NoDataDisplay";

const UpcList = () => {
  const toast = useToast();
  const context = useUpcContext();
  const dispatch = useAppDispatch();
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    return () => {
      dispatch(setRadioId(0));
    };
  }, []);

  useEffect(() => {
    // On mount, if radioId is 0, set to 1 (Stores)
    if (context.radioId === 0) {
      dispatch(setRadioId(1));
    }
  }, [context.radioId]);

  const getModuleData = (mode: number) => {
    dispatch(setIsLoading(true));
    if (mode == 1) {
      getCompData();
    } else if (mode == 2) {
      getForecastData();
    } else if (mode == 3) {
      getPriceOptData();
    } else if (mode == 4) {
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
        if (j.error === 0 && j.daily.length > 0) {
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
        } else {
          toast.warn("No Records Found");
        }
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
        if (j.error === 0 && j.qty_results !== null) {
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
          dispatch(setForecastExport(qty.data));
          dispatch(setForecastMetricExport(qty.metrics));
          dispatch(setUpcItems(upcItems));
          dispatch(setForecastData(forecast));
          dispatch(setForecastHistory(history));
          dispatch(setUpcList(upcList));
          dispatch(setUpcCount(j.upc_count));
          dispatch(setDataLoaded(true));
        } else {
          toast.warn("No Records Found");
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
        if (j.error === 0 && j.best_prices_by_upc.length > 0) {
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
        } else {
          toast.warn("No Records Found");
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
        if (j.error === 0 && j.trends.length > 0) {
          const upcItems = [...j.trends]
            .map((item: UpcTrend) => ({
              product_code: item.product_code,
              description: item.product_description,
            }))
            .reduce((acc: UpcItem[], cur) => {
              if (!acc.find((item) => item.product_code === cur.product_code)) {
                acc.push(cur);
              }
              return acc;
            }, []);
          dispatch(setUpcItems(upcItems));
          dispatch(setUpcTrends(j.trends));
          dispatch(setTopFiveTrends(j.top_5));
          dispatch(setBottomFiveTrends(j.bottom_5));
          dispatch(setDataLoaded(true));
        } else {
          toast.warn("No Records Found");
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => cleanUp());
  };

  const cleanUp = () => {
    dispatch(setIsLoading(false));
    dispatch(setIndex(0));
  };

  // The returned module based on selected mode
  const module = () => {
    if (context.selectedMode == 1)
      return context.salesComp.length > 0 ? <SalesComp /> : <NoDataDisplay />;
    if (context.selectedMode == 2)
      return context.forecast.length > 0 ? <Forcast /> : <NoDataDisplay />;
    if (context.selectedMode == 3)
      return context.optBestPrices.length > 0 ? (
        <PriceOpt />
      ) : (
        <NoDataDisplay />
      );
    if (context.selectedMode == 4)
      return context.upcTrends.length > 0 ? (
        <TrendDetector />
      ) : (
        <NoDataDisplay />
      );
    return null;
  };

  return (
    <div
      data-testid="upc-list-page"
      className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] w-full p-4 relative"
    >
      <div className="w-full h-full grid grid-cols-[19%_81%] gap-4">
        <div className="space-y-4">
          <StoreDatePicker setFile={setFile} getModuleData={getModuleData} />
          <ModeSelect />
        </div>

        {context.dataLoaded && !context.isLoading ? module() : null}
        {context.isLoading && <LoadingIndicator className="ml-28" />}
      </div>
    </div>
  );
};

export default UpcList;
