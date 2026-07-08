import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector, useStoreName } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getItemLookupSingleStore } from "../../../api/itemLookup";
import {
  setItemsLoaded,
  setProductCode,
  setDescription,
  setCategoryDescription,
  setHistoryMetrics,
  setItemLookupHistory,
  setPause,
  reQueryUpc,
  setSelectedStore,
  addRecentLookup,
} from "../../../features/itemLookupSlice";
import { setError } from "../../../features/itemScanSlice";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import LookupEntryScreen from "./LookupEntryScreen";
import LookupResultScreen from "./LookupResultScreen";
import { buildDayBuckets, computeMargin, computeTrend, findGaps } from "./lookupMetrics";

const ItemLookupDev = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { url, token } = useAppSelector((s) => s.app);
  const { assignedStores } = useAppSelector((s) => s.user);
  const {
    selectedStore,
    itemsLoaded,
    productCode,
    description,
    categoryDescription,
    itemLookupHistory,
    totalSales,
    totalQty,
    daysSold,
  } = useAppSelector((s) => s.item);
  const [isLoading, setIsLoading] = useState(false);
  const storeName = useStoreName(selectedStore);

  useEffect(() => {
    if (!selectedStore && assignedStores.length) {
      dispatch(setSelectedStore(assignedStores[0].storeid));
    }
  }, [assignedStores]);

  const handleSearch = (upc: string) => {
    if (!upc || !selectedStore) return;
    dispatch(reQueryUpc({ isResettingUpcCode: true }));
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
          dispatch(setCategoryDescription(j.category_description));
          dispatch(setItemsLoaded(true));

          const margin = computeMargin(j.history, j.total_sales, j.total_qty);
          dispatch(
            addRecentLookup({
              productCode: j.product_code,
              description: j.description,
              marginPct: margin.marginPct,
            }),
          );
        } else {
          dispatch(
            setError(`We're sorry, that item was not found in your inventory`),
          );
          dispatch(setItemsLoaded(false));
          dispatch(reQueryUpc({ isResettingUpcCode: true }));
          dispatch(setPause(true));
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  };

  const handleBack = () => {
    dispatch(reQueryUpc({ isResettingUpcCode: true }));
  };

  if (!itemsLoaded) {
    return (
      <div className="relative">
        {isLoading && <LoadingIndicator message="Looking up item..." />}
        <LookupEntryScreen
          storeName={storeName}
          onSearch={handleSearch}
          onSelectRecent={handleSearch}
        />
      </div>
    );
  }

  const buckets = buildDayBuckets(itemLookupHistory);

  return (
    <div className="relative">
      {isLoading && <LoadingIndicator message="Looking up item..." />}
      <LookupResultScreen
        description={description}
        productCode={productCode}
        categoryDescription={categoryDescription}
        storeName={storeName}
        onBack={handleBack}
        onSelectRecent={handleSearch}
        margin={computeMargin(itemLookupHistory, totalSales, totalQty)}
        totalQty={totalQty}
        daysSold={daysSold}
        buckets={buckets}
        trend={computeTrend(buckets)}
        gaps={findGaps(buckets)}
      />
    </div>
  );
};

export default ItemLookupDev;
