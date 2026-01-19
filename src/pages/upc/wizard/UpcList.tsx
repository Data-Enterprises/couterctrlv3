import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
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
  setSelectedStores,
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
import { useResizeContext } from "../../forecast/hooks";

import ModelSelect from "./components/ModeSelect";
import FileInput from "../../forecast/controls/FileInput";
import { setUpcs } from "../../../features/upcUploadSlice";
import StoreDatePicker from "../components/StoreDatePicker";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";

const UpcList = () => {
  const toast = useToast();
  const context = useUpcContext();
  const { height } = useResizeContext("");
  const dispatch = useAppDispatch();
  const [file, setFile] = useState<File | null>(null);
  const { upcs } = useAppSelector((state) => state.upcs);

  // Dismount cleanup
  useEffect(() => {
    return () => {
      dispatch(setSelectedStores([]));
      dispatch(setRadioId(0));
      dispatch(setUpcs([]));
    };
  }, []);

  useEffect(() => {
    // On mount, if radioId is 0, set to 1 (Stores)
    if (context.radioId === 0) {
      dispatch(setRadioId(1));
    }
  }, [context.radioId]);

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
          const upcItems = [...j.trends].map((item: UpcTrend) => ({
            product_code: item.product_code,
            description: item.product_description,
          })).reduce((acc: UpcItem[], cur) => {
            if (!acc.find((item) => item.product_code === cur.product_code)) {
              acc.push(cur);
            }
            return acc;
          }, []);
          console.log(upcItems);
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
    // setFile(null);
  };

  // The returned module based on selected mode
  const module = () => {
    if (context.selectedMode == 1) return <SalesComp />;
    if (context.selectedMode == 2) return <Forcast />;
    if (context.selectedMode == 3) return <PriceOpt />;
    if (context.selectedMode == 4) return <TrendDetector />;
    return null;
  };

  return (
    <div
      data-testid="upc-list-page"
      className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] w-full p-4 relative"
    >
      <div className="w-full h-full grid grid-cols-[20%_80%] gap-4">
        <div className="space-y-4">
          <StoreDatePicker />
          <ModelSelect />
          <div className="bg-custom-white rounded-lg shadow-lg px-4 pb-3">
            <div className="bg-blue-500 text-custom-white -mx-4 py-0.5 px-4 rounded-t-lg font-medium flex justify-between">
              <div>UPC list from file</div>
              <div className={`${upcs.length === 0 && "hidden"}`}>
                {upcs.length}
              </div>
            </div>
            <div
              className={`bg-bkg shadow rounded-lg grid grid-cols-3 text-xs ${height} overflow-y-scroll no-scrollbar my-2`}
            >
              {upcs.map((u, i) => (
                <div
                  key={i}
                  data-testid={`forecast-upc-item-${u}-${i}`}
                  className="px-2 py-0.5 font-medium cursor-default"
                >
                  {u}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FileInput
                file={file}
                fileExt={[".csv"]}
                setFile={setFile}
                className="w-full py-0"
              />
              <button
                data-testid="forecast-search-btn"
                className="btn-themeBlue py-1"
                onClick={getData}
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {context.dataLoaded && !context.isLoading ? module() : null}
        {context.isLoading && <LoadingIndicator className="ml-28" />}
      </div>
    </div>
  );
};

export default UpcList;
