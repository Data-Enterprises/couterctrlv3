import { useState } from "react";
import { applyStoreNumberToName } from "../../../../utils/storeIdentity";
import { useAppSelector, useStoreName } from "../../../../hooks";
import LookupDesktopEntry from "./LookupDesktopEntry";
import LookupQueuePanel from "./LookupQueuePanel";
import LookupReportPanel from "./LookupReportPanel";
import LookupExportModal from "./LookupExportModal";
import { useLookupQueue } from "./useLookupQueue";
import {
  buildDayBuckets,
  buildSaleTypeBreakdown,
  computeMargin,
  computeTrend,
  findGaps,
  rowsOfSaleType,
} from "../lookupMetrics";

const ItemLookupDesktop = () => {
  const { selectedStore } = useAppSelector((s) => s.item);
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchModalOpen(false)}
        >
          <div className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <LookupDesktopEntry onSearch={handleSearch} />
          </div>
        </div>
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
            <p className="text-[13px] text-content/60">Select an item from the queue</p>
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
