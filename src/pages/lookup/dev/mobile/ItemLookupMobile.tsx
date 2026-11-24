// Hooks
import { useStoreName } from "../../../../hooks";
import { useLookupCtx } from "../hooks";
import { usePhoneLookup } from "./hooks/lookup";

// Utils
import { applyStoreNumberToName } from "../../../../utils/storeIdentity";
import { buildDayBuckets, computeMargin, computeTrend } from "../utils";

// Components
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import LookupEntryScreen from "./LookupEntryScreen";
import LookupItemReport from "./LookupItemReport";

/** The phone Item lookup page. It looks up one UPC at a store, keeps the full history so switching store location
 *  re-derives the figures, and shows the entry screen or the item report. */
const ItemLookupMobile = () => {
  const {
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
  const { isLoading, handleStoreNumberChange, handleSearch, handleBack } =
    usePhoneLookup();
  const resolvedStoreName = useStoreName(selectedStore);
  // Co-located stores resolve to one assignedStores record — rewrite the
  // embedded number to the location on screen. See utils/storeIdentity.
  const storeName = applyStoreNumberToName(
    resolvedStoreName,
    selectedStoreNumber ?? "",
    selectedStoreNumber ? availableStoreNumbers : [],
  );

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
