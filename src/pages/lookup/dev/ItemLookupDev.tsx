import { useEffect, useRef, useState } from "react";
import { applyStoreNumberToName, scopeToStoreNumber, storeNumbersIn } from "../../../utils/storeIdentity";
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
  setLookupStoreNumbers,
  setLookupSelectedStoreNumber,
  type ItemLookupHistory,
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
  const resolvedStoreName = useStoreName(selectedStore);
  const availableStoreNumbers = useAppSelector((s) => s.item.availableStoreNumbers);
  const selectedStoreNumber = useAppSelector((s) => s.item.selectedStoreNumber);
  // Co-located stores resolve to one assignedStores record — rewrite the
  // embedded number to the location on screen. See utils/storeIdentity.
  const storeName = applyStoreNumberToName(
    resolvedStoreName,
    selectedStoreNumber ?? "",
    selectedStoreNumber ? availableStoreNumbers : [],
  );

  // Full unscoped history, so switching locations re-derives without refetching.
  const rawHistoryRef = useRef<ItemLookupHistory[]>([]);

  // The lookup is by storeid, so its history covers both locations. Every
  // headline figure is derived from those rows, so scoping re-derives all.
  const applyScope = (history: ItemLookupHistory[], storeNumber: string | null) => {
    const rows = storeNumber ? scopeToStoreNumber(history, storeNumber) : history;
    const totalSales = rows.reduce((acc, h) => acc + h.total_sales, 0);
    const totalQty = rows.reduce((acc, h) => acc + h.qty, 0);
    dispatch(setItemLookupHistory(rows));
    dispatch(
      setHistoryMetrics({
        totalSales,
        totalQty,
        avgPrice: totalQty > 0 ? totalSales / totalQty : 0,
        daysSold: new Set(rows.map((h) => h.sale_date.split("T")[0])).size,
      }),
    );
    return { rows, totalSales, totalQty };
  };

  const handleStoreNumberChange = (storeNumber: string | null) => {
    dispatch(setLookupSelectedStoreNumber(storeNumber));
    // rawHistoryRef is component-local and empties on remount. Re-deriving from
    // an empty cache would zero out the metrics on screen, so leave the current
    // view alone rather than blanking it.
    if (rawHistoryRef.current.length === 0) return;
    applyScope(rawHistoryRef.current, storeNumber);
  };

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
          rawHistoryRef.current = j.history;
          const numbers = storeNumbersIn(j.history);
          dispatch(setLookupStoreNumbers(numbers));
          const scope = numbers.length > 1 ? numbers[0] : null;
          dispatch(setLookupSelectedStoreNumber(scope));
          const scopedResult = applyScope(j.history, scope);
          dispatch(setProductCode(j.product_code));
          dispatch(setDescription(j.description));
          dispatch(setCategoryDescription(j.category_description));
          dispatch(setItemsLoaded(true));

          const margin = computeMargin(
            scopedResult.rows,
            scopedResult.totalSales,
            scopedResult.totalQty,
          );
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
        storeNumbers={availableStoreNumbers}
        selectedStoreNumber={selectedStoreNumber}
        onStoreNumberChange={handleStoreNumberChange}
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
