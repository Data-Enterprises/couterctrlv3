import { useState, useEffect } from "react";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getItemLookup, getItemLookupSingleStore } from "../../api/itemLookup";
import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  setItems,
  resetLookupSlice,
  setItemsLoaded,
  setProductCode,
  setDescription,
  setMetrics,
  setHistoryMetrics,
  setItemLookupHistory,
  setPause,
  setSelectedStore,
} from "../../features/itemLookupSlice";
import "./scanner.css";

import LoadingIndicator from "../../components/loading/LoadingIndicator";
import UpcScanner from "../../components/scanner/UpcScanner";
import { setError, setUpcCode } from "../../features/itemScanSlice";
import SingleSelect from "../../components/SingleSelect";
import ItemHIstory from "./ItemHistory";

const ItemLookup = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { itemsLoaded, selectedStore } = useAppSelector((state) => state.item);
  const { upcCode, error } = useAppSelector((state) => state.itemScan);
  const { assignedStores } = useAppSelector((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      dispatch(setUpcCode(""));
      dispatch(resetLookupSlice());
    };
  }, []);

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
          dispatch(
            setError(`We're sorry, that item was not found in your inventory`),
          );
          dispatch(setItemsLoaded(false));
          dispatch(resetLookupSlice());
          dispatch(setPause(true));
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
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
          dispatch(
            setError(
              `We're sorry, item ${
                j.product_code.split(".")[0]
              } was not found in your inventory`,
            ),
          );
          dispatch(setItemsLoaded(false));
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  };

  const clear = () => {
    const storeid = selectedStore;
    dispatch(resetLookupSlice());
    dispatch(setSelectedStore(storeid));
    dispatch(setUpcCode(""));
    dispatch(setError(""));
  };

  // This may not work
  const scanItem = (upcCode: string) => {
    return selectedStore > 0 ? getSingleStoreData(upcCode) : getData(upcCode);
  };

  const handleStoreSelect = (id: string | number) => {
    dispatch(setSelectedStore(Number(id)));
  };

  const findStoreName = () => {
    const store = assignedStores.find((s) => s.storeid === selectedStore);
    return store ? store.store_name : "";
  };

  return (
    <div
      id="item-lookup-body"
      className="px-4 py-2 h-[calc(100vh-56px)] overflow-hidden lg:w-1/4 lg:mx-auto"
    >
      <div className={`${isLoading ? "block z-50 " : "hidden z-0"}`}>
        <LoadingIndicator message={`Looking up item: ${upcCode}`} />
      </div>
      <div className="bg-custom-white p-2 rounded-lg shadow-md space-y-2 mb-2">
        <SingleSelect
          label="Store"
          data={assignedStores}
          displayKey="store_name"
          valueKey="storeid"
          onSelect={handleStoreSelect}
          defaultQuery={`${selectedStore > 0 ? findStoreName() : ""}`}
          innerClass="text-sm"
          listClass="text-sm"
        />
        <UpcScanner handleScan={scanItem} onClear={clear} />
      </div>
      {itemsLoaded ? <ItemHIstory /> : null}
      {error.length > 0 ? (
        <div className="text-content mt-8 text-center">{error}</div>
      ) : null}
    </div>
  );
};

export default ItemLookup;
