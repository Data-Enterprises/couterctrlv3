import { useState } from "react";
import { useAppSelector, useStoreName } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { formatGoliathDate, formatDate } from "../../utils";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import SingleStoreSearchCard from "../../components/SingleStoreSearchCard";
import DatePickers from "../../components/datePickers/DatePickers";
import InventoryTreePanel, { type TreeGroup } from "./InventoryTreePanel";
import InventoryExportModal from "./InventoryExportModal";
import ItemAnalysisPanel from "./ItemAnalysisPanel";
import { useActualPricePoints } from "./useActualPricePoints";
import {
  fetchSubDepts,
  fetchVendors,
  groupProducts,
  type InventoryScope,
  type ProductSummary,
  type VendorSummary,
} from "./inventoryData";

/**
 * Price Opt — Vendor.
 *
 * The sibling of the Sub Department page, and identical from the item rightward
 * — same Item Analysis panel, same register fetch, same suggestion. Only the
 * grouping differs.
 *
 * What isn't identical is the cost of getting there. `vendor_id` exists only on
 * item rows, and item rows come one department at a time, so a vendor cannot be
 * named until every department has been walked. That makes this an up-front
 * load behind a two-step message rather than the department page's expand-on-
 * click — and it's why the two searches are worth keeping as separate pages
 * instead of a toggle that quietly costs forty calls.
 *
 * Departments are never shown here. They're a means of reaching item rows, and
 * surfacing them would just be the other page.
 */
const InventoryVendor = () => {
  const toast = useToast();
  const { url, token } = useAppSelector((s) => s.app);
  const { startDate, endDate, lastStore } = useAppSelector((s) => s.search);
  const { assignedStores } = useAppSelector((s) => s.user);

  const [storeId, setStoreId] = useState(lastStore || 0);
  const [scope, setScope] = useState<InventoryScope | null>(null);
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const [openVendor, setOpenVendor] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProductSummary | null>(null);

  const { actual, loadActual, resetActual } = useActualPricePoints();
  const storeName = useStoreName(scope?.storeid ?? storeId);

  const runSearch = async () => {
    if (!storeId) {
      toast.warn("Please select a store");
      return;
    }
    const next: InventoryScope = {
      url,
      token,
      storeid: storeId,
      start: formatGoliathDate(startDate),
      end: formatGoliathDate(endDate),
    };
    setSearchOpen(false);
    setLoading(true);
    setOpenVendor(null);
    setSelected(null);
    resetActual();
    try {
      // Named steps rather than one undifferentiated spinner — the second is
      // one call per department and is where the wait actually is.
      setLoadingMessage("Finding departments…");
      const depts = await fetchSubDepts(next);
      if (depts.length === 0) {
        toast.warn("No departments sold in that window");
        setVendors([]);
        return;
      }
      setLoadingMessage(`Reading ${depts.length} departments…`);
      const found = await fetchVendors(
        next,
        depts.map((d) => d.id),
      );
      if (found.length === 0) toast.warn("No vendors sold in that window");
      setVendors(found);
      setScope(next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load vendors");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  // Every row is already held, so opening a vendor is a regroup rather than a
  // fetch — no loading state and no race to guard.
  const products = openVendor
    ? groupProducts(vendors.find((v) => v.vendorId === openVendor)?.rows ?? [])
    : [];

  const toggleVendor = (id: string) => {
    setOpenVendor(id === openVendor ? null : id);
  };

  const selectProduct = (p: ProductSummary) => {
    if (!scope) return;
    setSelected(p);
    // Description, not UPC — that is the only search `cashier_table` offers.
    // The over-match it causes is filtered out again on product_code.
    loadActual(
      p.productCode,
      p.description,
      scope.storeid,
      scope.start,
      scope.end,
    );
  };

  const groups: TreeGroup[] = vendors.map((v) => ({
    id: v.vendorId,
    label: v.vendorName,
    sales: v.sales,
    itemCount: v.itemCount,
  }));

  const entry = (
    <SingleStoreSearchCard
      title="Price Opt — Vendor"
      description="Pick a store and a date range, then open a vendor to compare an item's estimated prices against what the registers actually rang."
      buttonLabel="Load vendors"
      stores={assignedStores}
      selectedStoreId={storeId}
      onStoreSelect={setStoreId}
      onSearch={runSearch}
      loading={loading}
      loadingMessage={loadingMessage || "Loading vendors..."}
      notice="Vendors live on item rows, so this reads every department in the window. Expect it to take longer than the Sub Department page."
      datePicker={<DatePickers showBtn={false} stacked />}
    />
  );

  if (loading) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] relative">
        <LoadingIndicator message={loadingMessage || "Loading vendors..."} />
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

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      {/* Re-search is an overlay, never a return to the entry screen — losing
          a load this expensive to change one field is exactly what that pattern
          prevents. */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>{entry}</div>
        </div>
      )}

      {/* Every vendor's items, not just the open one — the rows are all in hand
          here, so scoping the export to the open vendor would withhold data
          already paid for. Rolled up inside the conditional so the whole store
          isn't regrouped on every render. */}
      {exportOpen && (
        <InventoryExportModal
          onClose={() => setExportOpen(false)}
          groupNoun="Vendor"
          pageSlug="vendor"
          storeName={storeName}
          dateLabel={`${formatDate(scope.start)} – ${formatDate(scope.end)}`}
          groups={groups}
          itemGroups={vendors.map((v) => ({
            label: v.vendorName,
            products: groupProducts(v.rows),
          }))}
          selected={selected}
          // Same staleness guard the panel applies — a response for the
          // previously-clicked UPC must not be exported under this one's name.
          lines={
            selected && actual.upc === selected.productCode ? actual.lines : []
          }
        />
      )}

      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        <InventoryTreePanel
          title="Price Opt — Vendor"
          storeName={storeName}
          dateLabel={`${formatDate(scope.start)} – ${formatDate(scope.end)}`}
          filterPlaceholder="Filter vendors and items…"
          groups={groups}
          openGroup={openVendor}
          products={products}
          productsLoading={false}
          selectedUpc={selected?.productCode ?? null}
          onToggleGroup={toggleVendor}
          onSelectProduct={selectProduct}
          onSearchOpen={() => setSearchOpen(true)}
          onExportOpen={() => setExportOpen(true)}
        />

        {selected ? (
          <ItemAnalysisPanel product={selected} actual={actual} />
        ) : (
          <div className="flex-1 min-w-0 shadow-lg">
            <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full items-center justify-center">
              <p className="text-[13px] text-content/60">
                Open a vendor and pick an item
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryVendor;
