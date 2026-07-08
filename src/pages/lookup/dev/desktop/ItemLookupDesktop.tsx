import { useState } from "react";
import { useAppSelector, useStoreName } from "../../../../hooks";
import LookupDesktopEntry from "./LookupDesktopEntry";
import LookupQueuePanel from "./LookupQueuePanel";
import LookupReportPanel from "./LookupReportPanel";
import LookupExportModal from "./LookupExportModal";
import { useLookupQueue } from "./useLookupQueue";
import { buildDayBuckets, computeMargin, computeTrend, findGaps } from "../lookupMetrics";

const ItemLookupDesktop = () => {
  const { selectedStore } = useAppSelector((s) => s.item);
  const storeName = useStoreName(selectedStore);
  const { queue, selectedUpc, setSelectedUpc, runBatch } = useLookupQueue();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

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
      />

      {selectedItem?.history ? (
        <LookupReportPanel
          description={selectedItem.description ?? ""}
          productCode={selectedItem.productCode ?? ""}
          categoryDescription={selectedItem.categoryDescription ?? ""}
          margin={computeMargin(selectedItem.history, selectedItem.totalSales ?? 0, selectedItem.totalQty ?? 0)}
          totalQty={selectedItem.totalQty ?? 0}
          daysSold={selectedItem.daysSold ?? 0}
          buckets={buckets}
          trend={computeTrend(buckets)}
          gaps={findGaps(buckets)}
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
          buckets={buckets}
          onClose={() => setExportModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ItemLookupDesktop;
