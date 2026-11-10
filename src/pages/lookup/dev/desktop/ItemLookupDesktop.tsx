// Hooks
import { useState } from "react";
import { useStoreName } from "../../../../hooks";
import { useLookupCtx } from "../hooks";
import { useLookupQueue } from "./hooks";

// Utils
import { applyStoreNumberToName } from "../../../../utils/storeIdentity";
import {
  buildDayBuckets,
  buildSaleTypeBreakdown,
  computeMargin,
  computeTrend,
  findGaps,
  rowsOfSaleType,
} from "../utils";

// Components
import SearchPopup from "../../../../components-dev/SearchPopup";
import LookupDesktopEntry from "./components/LookupDesktopEntry";
import LookupQueuePanel from "./components/LookupQueuePanel";
import LookupReportPanel from "./components/LookupReportPanel";
import LookupExportModal from "./components/LookupExportModal";

/** The desktop Item lookup page: the search card first, then the item queue beside the selected item's report,
 *  with the search and export pop-ups. */
const ItemLookupDesktop = () => {
  const { selectedStore } = useLookupCtx();
  const resolvedStoreName = useStoreName(selectedStore);
  const {
    queue,
    selectedUpc,
    setSelectedUpc,
    runBatch,
    availableStoreNumbers,
    selectedStoreNumber,
    applyStoreScope,
  } = useLookupQueue();
  // Co-located stores resolve to one assignedStores record, so the name embeds
  // only one of the numbers — rewrite it to the location on screen.
  const storeName = applyStoreNumberToName(
    resolvedStoreName,
    selectedStoreNumber ?? "",
    selectedStoreNumber ? availableStoreNumbers : [],
  );
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  // Remembered against the item it was picked on, so selecting another item
  // lands on its sales rather than a type it may not even have.
  const [saleTypePick, setSaleTypePick] = useState<{ upc: string | null; type: string }>({
    upc: null,
    type: "Sale",
  });

  const handleSearch = (upcs: string[]) => {
    if (!selectedStore) return;
    setSearchModalOpen(false);
    runBatch(upcs, selectedStore);
  };

  if (queue.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3rem)]">
        <LookupDesktopEntry onSearch={handleSearch} />
      </div>
    );
  }

  const selectedItem = queue.find((q) => q.upc === selectedUpc && q.status === "loaded");
  const buckets = selectedItem?.history ? buildDayBuckets(selectedItem.history) : [];
  const margin = selectedItem?.history
    ? computeMargin(selectedItem.history, selectedItem.totalSales ?? 0, selectedItem.totalQty ?? 0)
    : null;
  const historyAll = selectedItem?.historyAll ?? selectedItem?.history ?? [];
  const saleTypes = buildSaleTypeBreakdown(historyAll);
  const selectedSaleType =
    saleTypePick.upc === selectedUpc &&
    saleTypes.some((s) => s.saleType === saleTypePick.type)
      ? saleTypePick.type
      : "Sale";
  const timeline =
    selectedSaleType === "Sale"
      ? buckets
      : buildDayBuckets(rowsOfSaleType(historyAll, selectedSaleType));

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4 flex gap-4">
      {searchModalOpen && (
        <SearchPopup onClose={() => setSearchModalOpen(false)}>
          <LookupDesktopEntry onSearch={handleSearch} />
        </SearchPopup>
      )}

      <LookupQueuePanel
        storeName={storeName}
        queue={queue}
        selectedUpc={selectedUpc}
        onSelect={setSelectedUpc}
        onOpenSearch={() => setSearchModalOpen(true)}
        storeNumbers={availableStoreNumbers}
        selectedStoreNumber={selectedStoreNumber}
        onStoreNumberChange={applyStoreScope}
      />

      {selectedItem?.history ? (
        <LookupReportPanel
          description={selectedItem.description ?? ""}
          productCode={selectedItem.productCode ?? ""}
          categoryDescription={selectedItem.categoryDescription ?? ""}
          margin={margin!}
          totalQty={selectedItem.totalQty ?? 0}
          daysSold={selectedItem.daysSold ?? 0}
          buckets={buckets}
          trend={computeTrend(buckets)}
          gaps={findGaps(buckets)}
          saleTypes={saleTypes}
          selectedSaleType={selectedSaleType}
          onSelectSaleType={(type) => setSaleTypePick({ upc: selectedUpc, type })}
          timeline={timeline}
          onExportOpen={() => setExportModalOpen(true)}
        />
      ) : (
        <div className="flex-1 min-w-0 shadow-lg">
          <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full items-center justify-center">
            <p className="text-[13px] text-content/95">Select an item from the queue</p>
          </div>
        </div>
      )}

      {exportModalOpen && (
        <LookupExportModal
          queue={queue}
          selectedDescription={selectedItem?.description ?? ""}
          buckets={timeline}
          selectedSaleType={selectedSaleType}
          weighed={margin?.weighed ?? false}
          onClose={() => setExportModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ItemLookupDesktop;
