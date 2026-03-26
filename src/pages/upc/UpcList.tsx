import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { useUpcContext } from "./hooks";

// modules
import SalesComp from "./modules/salesComp/SalesComp";
import PriceOpt from "./modules/priceOpt/PriceOpt";
import TrendDetector from "./modules/trend/TrendDetector";
import {
  resetDeeperLvlQueryUpcs,
  setBottomFiveTrends,
  setDataLoaded,
  setFileName,
  setForecastExport,
  setForecastMetricExport,
  setForecastQtyData,
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
} from "../../features/upcSlice";
import {
  getForecasting,
  getPriceOpt,
  getSalesComp,
  getTrendDetect,
} from "../../api/upc";
import type {
  JsonError,
  UpcForecast,
  UpcForecastData,
  UpcItem,
  UpcPriceOpt,
  UpcTrend,
} from "../../interfaces";
import { colorCodes } from "./components";
import { formatForecastExport } from "./utils";

import ModeSelect from "./components/ModeSelect";
import StoreDatePicker from "./components/StoreDatePicker";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import UpcAssociation from "./modules/associate/UpcAssociation";
import UpcSelector from "./components/UpcSelector";
import Forecast from "./modules/forecast/Forecast";

const UpcList = () => {
  const toast = useToast();
  const context = useUpcContext();
  const dispatch = useAppDispatch();
  const [_, setFile] = useState<File | null>(null);
  const { uploadedUpcs } = useAppSelector((state) => state.upc);

  useEffect(() => {
    return () => {
      dispatch(setRadioId(0));
      if (
        context.salesComp.length === 0 &&
        context.forecast.length === 0 &&
        context.optBestPrices.length === 0 &&
        context.upcTrends.length === 0
      ) {
        dispatch(setFileName(""));
      }
    };
  }, []);

  useEffect(() => {
    // On mount, if radioId is 0, set to 1 (Stores)
    if (context.radioId === 0) {
      dispatch(setRadioId(1));
    }
  }, [context.radioId]);

  const getModuleData = () => {
    if (context.selectedMode === 0) {
      toast.warn("Please select a mode");
      return;
    }
    dispatch(setIsLoading(true));
    if (context.selectedMode == 1) {
      getCompData();
    } else if (context.selectedMode == 2) {
      getForecastData();
    } else if (context.selectedMode == 3) {
      getPriceOptData();
    } else if (context.selectedMode == 4) {
      getTrendData();
    } else if (context.selectedMode === 5) {
      getAssData();
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
      uploadedUpcs.join(","),
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
      uploadedUpcs.join(","),
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0 && j.qty_results !== null) {
          const qtyResults: UpcForecastData[] = Object.entries(
            j.qty_results,
          ).map(([k, v]) => {
            const prices = Object.entries(
              (v as UpcForecast).metrics.prices,
            ).map(([price, qty]) => ({
              price,
              qty: typeof qty === "number" ? qty : (qty as any).qty,
            }));
            const dataObj = v as UpcForecast;
            dataObj.metrics.prices = prices;
            return { product_code: k, data: dataObj };
          });

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
          dispatch(setForecastQtyData(qtyResults));
          dispatch(setForecastExport(qty.data));
          dispatch(setForecastMetricExport(qty.metrics));
          dispatch(setUpcItems(upcItems));
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
      uploadedUpcs.join(","),
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0 && j.best_prices_by_upc.length > 0) {
          const upcItems = [...j.best_prices_by_upc].map(
            (item: UpcPriceOpt) => ({
              product_code: item.product_code,
              description: item.product_description,
            }),
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
      uploadedUpcs.join(","),
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

  const getAssData = () => {
    dispatch(resetDeeperLvlQueryUpcs());
    const upcItems = [...context.uploadedUpcs].map((item) => ({
      product_code: item,
      description: `Item ${item}`,
    }));
    dispatch(setUpcItems(upcItems));
    dispatch(setDataLoaded(true));
    dispatch(setIsLoading(false));
  };

  const cleanUp = () => {
    dispatch(setIsLoading(false));
    dispatch(setIndex(0));
  };

  // The returned module based on selected mode
  const module = () => {
    if (context.selectedMode == 1)
      return context.salesComp.length > 0 ? (
        <SalesComp />
      ) : (
        <UpcSelector setFile={setFile} getData={getModuleData} />
      );
    if (context.selectedMode == 2)
      return context.forecastQtyData.length > 0 ? (
        <Forecast />
      ) : (
        <UpcSelector setFile={setFile} getData={getModuleData} />
      );
    if (context.selectedMode == 3)
      return context.optBestPrices.length > 0 ? (
        <PriceOpt />
      ) : (
        <UpcSelector setFile={setFile} getData={getModuleData} />
      );
    if (context.selectedMode == 4)
      return context.upcTrends.length > 0 ? (
        <TrendDetector />
      ) : (
        <UpcSelector setFile={setFile} getData={getModuleData} />
      );
    if (context.selectedMode == 5) {
      return context.upcItems.length ? (
        <UpcAssociation />
      ) : (
        <UpcSelector setFile={setFile} getData={getModuleData} />
      );
    }
  };

  return (
    <div
      data-testid="upc-list-page"
      className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] w-full p-4 relative"
    >
      <div className="w-full h-full grid grid-cols-[17%_83%] gap-4">
        <div className="space-y-4">
          <StoreDatePicker />
          <ModeSelect />
        </div>

        {context.dataLoaded && !context.isLoading ? module() : null}
        {context.isLoading && <LoadingIndicator className="ml-28" />}
        {context.selectedMode === 0 ? (
          <div className="w-full h-full flex justify-center items-center pt-28">
            <div className="bg-custom-white p-4 rounded-lg shadow-lg text-center">
              <div className="text-lg font-medium">No mode selected</div>
              <div className="text-content/70">
                Please select a mode with your date range
              </div>
              <div className="text-content/70">
                and your selected Stores or Group
              </div>
            </div>
          </div>
        ) : context.selectedMode > 0 &&
          !context.dataLoaded &&
          !context.isLoading ? (
          <UpcSelector setFile={setFile} getData={getModuleData} />
        ) : null}
      </div>
    </div>
  );
};

export default UpcList;
