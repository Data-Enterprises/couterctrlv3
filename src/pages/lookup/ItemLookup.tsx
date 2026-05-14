import { useState } from "react";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getItemLookupSingleStore } from "../../api/itemLookup";
import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  setItemsLoaded,
  setProductCode,
  setDescription,
  setHistoryMetrics,
  setItemLookupHistory,
  setPause,
  reQueryUpc,
  setILView,
} from "../../features/itemLookupSlice";
import "./scanner.css";

import LoadingIndicator from "../../components/loading/LoadingIndicator";
import { setError } from "../../features/itemScanSlice";
import LookupCharts from "./LookupCharts";
import ItemHIstory from "./ItemHistory";
import ItemDaily from "./ItemDaily";
import LookupChartsTablet from "./tablet/LookupChartsTablet";
import ItemHIstoryTablet from "./tablet/ItemHistoryTablet";
import ItemDailyTablet from "./tablet/ItemDailyTablet";
import LookupSearchCard from "./desktop/LookupSearchCard";
import ItemHistoryDesktop from "./desktop/ItemHistoryDesktop";
import ItemDailyDesktop from "./desktop/ItemDailyDesktop";
import TotalsSummary from "./desktop/TotalsSummary";

const ItemLookup = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, isTablet, isDesktop } = useAppSelector(
    (state) => state.app,
  );
  const { selectedStore, viewHistory, viewDaily, viewSearch } = useAppSelector(
    (state) => state.item,
  );
  const { upcCode, error } = useAppSelector((state) => state.itemScan);
  const [isLoading, setIsLoading] = useState(false);

  const getSingleStoreData = (upc: string) => {
    dispatch(reQueryUpc({ isResettingUpcCode: !isDesktop }));
    dispatch(setError(""));
    setIsLoading(true);

    getItemLookupSingleStore(url, token, upc, selectedStore, 14)
      .then((resp) => {
        const j = resp.data;
        if (j.error == 0) {
          dispatch(setItemLookupHistory(j.history));
          dispatch(
            setHistoryMetrics({
              totalSales: j.total_sales,
              totalQty: j.total_qty,
              avgPrice: j.average_price,
              daysSold: j.days_sold,
            }),
          );
          dispatch(setProductCode(j.product_code));
          dispatch(setDescription(j.description));
          dispatch(setItemsLoaded(true));
          if (isTablet) {
            dispatch(setILView("history"));
          }
        } else {
          // If item is not found
          dispatch(
            setError(`We're sorry, that item was not found in your inventory`),
          );
          dispatch(setItemsLoaded(false));
          dispatch(reQueryUpc({ isResettingUpcCode: !isDesktop }));
          dispatch(setPause(true));
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  };

  if (isDesktop) {
    return (
      <div
        id="item-lookup-body"
        className="p-2 max-h-[calc(100vh-3rem)] overflow-hidden grid grid-cols-[16%_auto] gap-3"
      >
        <div className="space-y-2">
          <LookupSearchCard getItemData={getSingleStoreData} />
          <TotalsSummary />
        </div>
        <div className="grid grid-cols-[45%_auto] gap-3">
          <ItemDailyDesktop />
          <ItemHistoryDesktop />
        </div>
      </div>
    );
  }

  const renderView = () => {
    if (viewHistory) return isTablet ? <ItemHIstoryTablet /> : <ItemHIstory />;
    if (viewDaily) return isTablet ? <ItemDailyTablet /> : <ItemDaily />;
    return isTablet ? null : <LookupCharts getItemData={getSingleStoreData} />;
  };

  if (isTablet) {
    return (
      <div
        data-testid="item-lookup-body"
        className="p-2 h-[calc(100vh-56px)] grid grid-cols-[30%_69%] gap-3"
      >
        <div>
          <div
            className={`grid ${isTablet ? "grid-cols-2" : "grid-cols-3"} gap-2 mb-2`}
          >
            {!isTablet ? (
              <button
                className={`${viewSearch ? "btn-themeGreen" : "btn-themeBlue"} text-[13px] py-1.5 px-0`}
                onClick={() => dispatch(setILView("search"))}
              >
                Search
              </button>
            ) : null}
            <button
              className={`${viewHistory ? "btn-themeGreen" : "btn-themeBlue"} text-[13px] py-1.5 px-0`}
              onClick={() => dispatch(setILView("history"))}
            >
              Overview
            </button>
            <button
              className={`${viewDaily ? "btn-themeGreen" : "btn-themeBlue"} text-[13px] py-1.5 px-0`}
              onClick={() => dispatch(setILView("daily"))}
            >
              Daily
            </button>
          </div>
          <div className={`${isLoading ? "block z-50 " : "hidden z-0"}`}>
            <LoadingIndicator message={`Looking up item: ${upcCode}`} />
          </div>
          {error.length > 0 ? (
            <div className="text-content mt-8 text-center">{error}</div>
          ) : null}
          <LookupChartsTablet getItemData={getSingleStoreData} />
        </div>
        {renderView()}
      </div>
    );
  }

  return (
    <div
      data-testid="item-lookup-body"
      className="p-2 min-h-[calc(100vh-56px)] max-h-[calc(100vh-56px)] overflow-hidden lg:w-1/4 lg:mx-auto"
    >
      <div className="grid grid-cols-3 gap-2 mb-2">
        <button
          className={`${viewSearch ? "btn-themeGreen" : "btn-themeBlue"} text-[13px] py-1.5 px-0`}
          onClick={() => dispatch(setILView("search"))}
        >
          Search
        </button>
        <button
          className={`${viewHistory ? "btn-themeGreen" : "btn-themeBlue"} text-[13px] py-1.5 px-0`}
          onClick={() => dispatch(setILView("history"))}
        >
          Overview
        </button>
        <button
          className={`${viewDaily ? "btn-themeGreen" : "btn-themeBlue"} text-[13px] py-1.5 px-0`}
          onClick={() => dispatch(setILView("daily"))}
        >
          Daily
        </button>
      </div>
      <div className={`${isLoading ? "block z-50 " : "hidden z-0"}`}>
        <LoadingIndicator message={`Looking up item: ${upcCode}`} />
      </div>
      {renderView()}
      {error.length > 0 ? (
        <div className="text-content mt-8 text-center">{error}</div>
      ) : null}
    </div>
  );
};

export default ItemLookup;
