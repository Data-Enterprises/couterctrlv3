// Hooks
import { useState } from "react";
import { useStoreName } from "../../../hooks";
import { usePriceOptCtx, useItemSelection, useVendorData } from "./hooks";

// Utils
import { formatDate } from "../../../utils";
import { currentItemReads, groupProducts } from "./utils";

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
 * Price Opt: Vendor. Identical to Sub Department from the item rightward; only
 * the grouping differs. `vendor_id` exists only on item rows, so every
 * department is walked up front before a vendor can be named, which is why the
 * two are separate pages. Departments are never shown here.
 */
const InventoryVendor = () => {
  const ctx = usePriceOptCtx();
  const [storeId, setStoreId] = useState(ctx.lastStore || 0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const item = useItemSelection();
  const data = useVendorData(ctx, storeId, item.clearItem, () =>
    setSearchOpen(false),
  );
  const { scope, vendors, openVendor, groups } = data;
  const storeName = useStoreName(scope?.storeid ?? storeId);

  const entry = (
    <SingleStoreSearchCard
      title="Price Opt — Vendor"
      description="Pick a store and a date range, then open a vendor to compare an item's estimated prices against what the registers actually rang."
      buttonLabel="Load vendors"
      stores={ctx.assignedStores}
      selectedStoreId={storeId}
      onStoreSelect={setStoreId}
      onSearch={data.runSearch}
      loading={data.loading}
      loadingMessage={data.loadingMessage || "Loading vendors..."}
      notice="Vendors live on item rows, so this reads every department in the window. Expect it to take longer than the Sub Department page."
      datePicker={<DatePickers showBtn={false} stacked />}
    />
  );

  if (data.loading) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] relative">
        <LoadingIndicator
          message={data.loadingMessage || "Loading vendors..."}
        />
      </div>
    );
  }

  if (!scope || vendors.length === 0) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] flex items-center justify-center p-4">
        {entry}
      </div>
    );
  }

  const dateLabel = `${formatDate(scope.start)} – ${formatDate(scope.end)}`;

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      {/* Re-search is an overlay, so changing one field never loses this
          expensive load. */}
      {searchOpen && (
        <SearchPopup onClose={() => setSearchOpen(false)}>{entry}</SearchPopup>
      )}

      {/* Every vendor's items, not just the open one: they're all in hand.
          Rolled up inside the conditional, not every render. */}
      {exportOpen && (
        <InventoryExportModal
          onClose={() => setExportOpen(false)}
          groupNoun="Vendor"
          pageSlug="vendor"
          storeName={storeName}
          dateLabel={dateLabel}
          groups={groups}
          itemGroups={vendors.map((v) => ({
            label: v.vendorName,
            products: groupProducts(v.rows),
          }))}
          selected={item.selected}
          invoice={item.invoice}
          {...currentItemReads(item.selected, item.prices, item.receipts)}
        />
      )}

      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        <InventoryTreePanel
          helpPage="price-opt-vendor"
          title="Price Opt — Vendor"
          storeName={storeName}
          dateLabel={dateLabel}
          filterPlaceholder="Filter vendors and items…"
          groups={groups}
          openGroup={openVendor}
          products={data.products}
          productsLoading={data.itemsLoading && !!openVendor}
          selectedUpc={item.selected?.productCode ?? null}
          onToggleGroup={data.toggleVendor}
          onSelectProduct={(p) => item.selectProduct(scope, p)}
          onSearchOpen={() => setSearchOpen(true)}
          onExportOpen={() => setExportOpen(true)}
          groupHasItem={data.groupHasItem}
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
          <NoItemPanel message="Open a vendor and pick an item" />
        )}
      </div>
    </div>
  );
};

export default InventoryVendor;
