// Hooks
import { useState } from "react";
import { useStoreName } from "../../../hooks";
import { usePriceOptCtx, useItemSelection, useSubDeptData } from "./hooks";

// Utils
import { formatDate } from "../../../utils";
import { currentItemReads } from "./utils";

// Components
import LoadingIndicator from "../../../components-dev/loading/LoadingIndicator";
import SingleStoreSearchCard from "../../../components-dev/SingleStoreSearchCard";
import DatePickers from "../../../components-dev/datePickers/DatePickers";
import SearchPopup from "../../../components-dev/SearchPopup";
import InventoryTreePanel from "./components/InventoryTreePanel";
import NoItemPanel from "./components/NoItemPanel";
import InventoryExportModal from "./export/InventoryExportModal";
import ItemAnalysisPanel from "./itemPanel/ItemAnalysisPanel";

/**
 * Price Opt: Sub Department. Estimated against actual price points for one
 * item, reached by opening a department and picking a UPC. The fetch lives
 * in useSubDeptData, except the register fetch, whose hook carries a
 * staleness guard.
 */
const InventorySubDept = () => {
  const ctx = usePriceOptCtx();
  const [storeId, setStoreId] = useState(ctx.lastStore || 0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const item = useItemSelection();
  const data = useSubDeptData(ctx, storeId, item.clearItem, () =>
    setSearchOpen(false),
  );
  const { scope, subDepts, openSubDept, products, groups } = data;
  const storeName = useStoreName(scope?.storeid ?? storeId);

  const entry = (
    <SingleStoreSearchCard
      title="Price Opt — Sub Department"
      description="Pick a store and a date range, then open a department to compare an item's estimated prices against what the registers actually rang."
      buttonLabel="Load departments"
      stores={ctx.assignedStores}
      selectedStoreId={storeId}
      onStoreSelect={setStoreId}
      onSearch={data.runSearch}
      loading={data.loading}
      loadingMessage="Loading departments..."
      datePicker={<DatePickers showBtn={false} stacked />}
    />
  );

  if (data.loading) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] relative">
        <LoadingIndicator message="Loading departments..." />
      </div>
    );
  }

  if (!scope || subDepts.length === 0) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] flex items-center justify-center p-4">
        {entry}
      </div>
    );
  }

  const dateLabel = `${formatDate(scope.start)} – ${formatDate(scope.end)}`;

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      {/* Re-search is an overlay, never a return to the entry screen — losing
          the loaded window to change one field is what that pattern prevents. */}
      {searchOpen && (
        <SearchPopup onClose={() => setSearchOpen(false)}>{entry}</SearchPopup>
      )}

      {/* Built here, not held in state: the roll-up only needs to exist
          while the modal is open. */}
      {exportOpen && (
        <InventoryExportModal
          onClose={() => setExportOpen(false)}
          groupNoun="Department"
          pageSlug="sub-department"
          storeName={storeName}
          dateLabel={dateLabel}
          groups={groups}
          itemGroups={
            openSubDept !== null && products.length > 0
              ? [
                  {
                    label:
                      subDepts.find((d) => d.key === openSubDept)
                        ?.description ?? openSubDept,
                    products,
                  },
                ]
              : []
          }
          selected={item.selected}
          invoice={item.invoice}
          {...currentItemReads(item.selected, item.prices, item.receipts)}
        />
      )}

      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        <InventoryTreePanel
          helpPage="price-opt-sub-dept"
          title="Price Opt — Sub Department"
          storeName={storeName}
          dateLabel={dateLabel}
          filterPlaceholder="Filter departments and items…"
          groups={groups}
          openGroup={openSubDept}
          products={products}
          productsLoading={data.productsLoading}
          selectedUpc={item.selected?.productCode ?? null}
          onToggleGroup={data.toggleSubDept}
          onSelectProduct={(p) => item.selectProduct(scope, p)}
          onSearchOpen={() => setSearchOpen(true)}
          onExportOpen={() => setExportOpen(true)}
        />

        {item.selected ? (
          <ItemAnalysisPanel
            product={item.selected}
            prices={item.prices}
            receipts={item.receipts}
            onLoadReceipts={item.loadReceipts}
            invoice={item.invoice}
          />
        ) : (
          <NoItemPanel message="Open a department and pick an item" />
        )}
      </div>
    </div>
  );
};

export default InventorySubDept;
