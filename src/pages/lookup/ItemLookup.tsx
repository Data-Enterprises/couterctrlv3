import { useState, useEffect } from "react";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getItemLookup, getItemLookupSingleStore } from "../../api/itemLookup";
import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  setUpcCode,
  setItems,
  resetLookupSlice,
  setItemsLoaded,
  setProductCode,
  setDescription,
  setMetrics,
  setHistoryMetrics,
  setItemLookupHistory,
  setPause,
} from "../../features/itemLookupSlice";
import "./scanner.css";
import { useHeight } from "./utils";

import LoadingIndicator from "../../components/loading/LoadingIndicator";
import TopStoreLookup from "./TopStoreLookup";
import BottomStoreLookup from "./BottomStoreLookup";
import ItemLookupHeader from "./ItemLookupHeader";
import HistoryItemCard from "./HistoryItemCard";
import UpcScanner from "../../components/scanner/UpcScanner";
import { setError } from "../../features/itemScanSlice";

const ItemLookup = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { itemsLoaded, selectedStore, itemLookupHistory } = useAppSelector(
    (state) => state.item,
  );
  const { upcCode, error } = useAppSelector((state) => state.itemScan);
  const { assignedStores } = useAppSelector((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const { height, topRef, bottomRef } = useHeight();

  useEffect(() => {
    return () => {
      dispatch(setUpcCode(""));
    };
  }, []);

  useEffect(() => {
    return () => {
      dispatch(setUpcCode(""));
      dispatch(resetLookupSlice());
    };
  }, [dispatch]);

  const getSingleStoreData = (upc: string) => {
    setIsLoading(true);
    getItemLookupSingleStore(url, token, upc, selectedStore)
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
        } else {
          // If item is not found
          dispatch(setError(`We're sorry, that item was not found in your inventory`));
          dispatch(setItemsLoaded(false));
          dispatch(resetLookupSlice());
          dispatch(setPause(true));
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => {
        dispatch(setUpcCode(""));
        setIsLoading(false);
      });
  };

  const getData = (upc: string) => {
    setIsLoading(true);
    getItemLookup(url, token, upc)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const itemsPayload = {
            top_store_sales: j.top_store_sales,
            lowest_store_sales: j.lowest_store_sales,
            top_store_qty: j.top_store_qty,
            lowest_store_qty: j.lowest_store_qty,
            highest_price_store: j.highest_price_store,
            lowest_price_store: j.lowest_price_store,
          };
          dispatch(setItems(itemsPayload));
          dispatch(setProductCode(j.product_code));
          dispatch(setDescription(j.description));
          dispatch(
            setMetrics({
              totalStores: j.total_stores,
              totalSales: j.total_sales,
              totalQty: j.total_qty,
              avgPrice: j.average_price,
            }),
          );
          dispatch(setItemsLoaded(true));
        } else {
          dispatch(setError(
            `We're sorry, item ${
              j.product_code.split(".")[0]
            } was not found in your inventory`,
          ));
          dispatch(setItemsLoaded(false));
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => {
        dispatch(setUpcCode(""));
        setIsLoading(false);
      });
  };

  const clear = () => {
    dispatch(resetLookupSlice());
  };

  const scanItem = () => {
    return selectedStore > 0 ? getSingleStoreData(upcCode) : getData(upcCode);
  };

  return (
    <div
      id="item-lookup-body"
      className="px-4 py-2 h-[calc(100vh-56px)] overflow-hidden lg:w-1/4 lg:mx-auto"
    >
      <div className={`${isLoading ? "block z-50 " : "hidden z-0"}`}>
        <LoadingIndicator message={`Looking up item: ${upcCode}`} />
      </div>
      <UpcScanner handleScan={scanItem} onClear={clear} />
      <div ref={topRef} className="text-center font-bold underline">
        {assignedStores.find((s) => s.storeid === selectedStore)?.store_name}
      </div>
      {itemsLoaded ? (
        <>
          <ItemLookupHeader />
          {!selectedStore ? (
            <>
              <TopStoreLookup />
              <BottomStoreLookup />
            </>
          ) : (
            <>
              <div
                className="space-y-2 overflow-y-auto mb-3"
                style={{ maxHeight: `${height}px` }}
              >
                {itemLookupHistory.map((item, i) => (
                  <HistoryItemCard key={i} item={item} />
                ))}
              </div>
            </>
          )}
          <button
            ref={bottomRef}
            data-testid="lookup-clear"
            className="btn-themeBlue w-full text-[15px]"
            onClick={clear}
          >
            Clear Item
          </button>
        </>
      ) : null}
      {error.length > 0 ? (
        <div className="text-content mt-8 text-center">{error}</div>
      ) : null}
    </div>
  );
};

export default ItemLookup;
