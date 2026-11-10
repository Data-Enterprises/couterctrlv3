// Hooks
import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useStoreName } from "../../../../hooks";
import { useLookupCtx } from "../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import {
  setItemsLoaded,
  setProductCode,
  setDescription,
  setCategoryDescription,
  setHistoryMetrics,
  setItemLookupHistory,
  setItemLookupHistoryAll,
  setPause,
  reQueryUpc,
  setSelectedStore,
  addRecentLookup,
  setLookupStoreNumbers,
  setLookupSelectedStoreNumber,
  type ItemLookupHistory,
} from "../../../../features/dev/devItemLookupSlice";
import { setError } from "../../../../features/itemScanSlice";

// API
import { getItemLookupSingleStore } from "../../../../api/itemLookup";

// Utils
import {
  applyStoreNumberToName,
  scopeToStoreNumber,
  storeNumbersIn,
} from "../../../../utils/storeIdentity";
import { isSaleRow } from "../../../../utils/saleType";
import {
  buildDayBuckets,
  computeMargin,
  computeTrend,
  itemDescription, lookupFailureText } from "../utils";

// Components
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import LookupEntryScreen from "./LookupEntryScreen";
import LookupItemReport from "./LookupItemReport";

/** The phone Item lookup page. It looks up one UPC at a store, keeps the full history so switching store location
 *  re-derives the figures, and shows the entry screen or the item report. */
const ItemLookupMobile = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const {
    url,
    token,
    assignedStores,
    availableStoreNumbers,
    selectedStoreNumber,
    selectedStore,
    itemsLoaded,
    productCode,
    description,
    categoryDescription,
    itemLookupHistory,
    itemLookupHistoryAll,
    totalSales,
    totalQty,
  } = useLookupCtx();
  const [isLoading, setIsLoading] = useState(false);
  const resolvedStoreName = useStoreName(selectedStore);
  // Co-located stores resolve to one assignedStores record — rewrite the
  // embedded number to the location on screen. See utils/storeIdentity.
  const storeName = applyStoreNumberToName(
    resolvedStoreName,
    selectedStoreNumber ?? "",
    selectedStoreNumber ? availableStoreNumbers : [],
  );

  // Full unscoped history, every line type, so switching locations re-derives
  // the figures and the sale-type breakdown without refetching.
  const rawHistoryRef = useRef<ItemLookupHistory[]>([]);

  // By storeid, so the history covers both locations; scoping re-derives every
  // figure. Headline figures count Sale rows; the breakdown counts every type.
  const applyScope = (
    allHistory: ItemLookupHistory[],
    storeNumber: string | null,
  ) => {
    const scoped = storeNumber
      ? scopeToStoreNumber(allHistory, storeNumber)
      : allHistory;
    const rows = scoped.filter(isSaleRow);
    dispatch(setItemLookupHistoryAll(scoped));
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
    // rawHistoryRef empties on remount; re-deriving from it would zero the
    // screen, so the current view is left alone.
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
          // Every line type as returned; applyScope splits out the Sale rows.
          const allHistory: ItemLookupHistory[] = j.history;
          rawHistoryRef.current = allHistory;
          const numbers = storeNumbersIn(allHistory);
          dispatch(setLookupStoreNumbers(numbers));
          const scope = numbers.length > 1 ? numbers[0] : null;
          dispatch(setLookupSelectedStoreNumber(scope));
          const scopedResult = applyScope(allHistory, scope);
          const name = itemDescription(j.description, j.history);
          dispatch(setProductCode(j.product_code));
          dispatch(setDescription(name));
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
              description: name,
              marginPct: margin.marginPct,
              qty: scopedResult.totalQty,
              revenue: scopedResult.totalSales,
              unitCost: margin.unitCost,
              // All three already computed for the screen below; they just
              // were not travelling as far as the recent list.
              units: margin.totalUnits,
              weighed: margin.weighed,
              costMissing: margin.costMissing,
            }),
          );
        } else {
          // A non-zero error means the lookup didn't complete (e.g. a leaked
          // KeyError), so nothing is known about stock. The toast carries the
          // server's words; the panel stays vague rather than claim it's not
          // stocked.
          toast.error(lookupFailureText(j.msg));
          dispatch(setError(lookupFailureText(j.msg)));
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
          onSearch={handleSearch}
          onSelectRecent={handleSearch}
        />
      </div>
    );
  }

  const buckets = buildDayBuckets(itemLookupHistory);
  // Identical props either way, so the two screens stay swappable: dev shows
  // the new report, prod keeps LookupResultScreen until promotion.
  const Result = LookupItemReport;

  return (
    <div className="relative">
      {isLoading && <LoadingIndicator message="Looking up item..." />}
      <Result
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
        historyAll={itemLookupHistoryAll}
        buckets={buckets}
        trend={computeTrend(buckets)}
      />
    </div>
  );
};

export default ItemLookupMobile;
