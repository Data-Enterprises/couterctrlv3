import { useEffect, useMemo, useRef, useState } from "react";
import {
  useAppDispatch,
  useAppSelector,
  useStoreName,
} from "../../../hooks";
import { patchVendorView } from "../../../features/dev/devPriceOptSlice";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { formatGoliathDate, formatDate } from "../../../utils";
import LoadingIndicator from "../../../components-dev/loading/LoadingIndicator";
import SingleStoreSearchCard from "../../../components-dev/SingleStoreSearchCard";
import DatePickers from "../../../components-dev/datePickers/DatePickers";
import InventoryTreePanel, { type TreeGroup } from "./InventoryTreePanel";
import InventoryExportModal from "./InventoryExportModal";
import ItemAnalysisPanel from "./ItemAnalysisPanel";
import { usePricePoints } from "../../../hooks/usePricePoints";
import { useInvoiceCost } from "./useInvoiceCost";
import {
  fetchVendors,
  fetchVendorTotals,
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

  const dispatch = useAppDispatch();
  const [storeId, setStoreId] = useState(lastStore || 0);
  // Kept in the slice so a return visit lands on the last result instead of an
  // empty form (dev board review, finding K). The slice holds the store and
  // dates; the token comes from the session each render, so a re-login can't
  // leave a stale one behind.
  const view = useAppSelector((s) => s.dev.priceOpt.vendor);
  const scope = useMemo<InventoryScope | null>(
    () => (view.window ? { url, token, ...view.window } : null),
    [view.window, url, token],
  );
  const vendors = view.vendors;
  const openVendor = view.openVendor;
  const setScope = (next: InventoryScope | null) =>
    dispatch(
      patchVendorView({
        window: next
          ? { storeid: next.storeid, start: next.start, end: next.end }
          : null,
      }),
    );
  const setVendors = (next: VendorSummary[]) =>
    dispatch(patchVendorView({ vendors: next }));
  const setOpenVendor = (next: string | null) =>
    dispatch(patchVendorView({ openVendor: next }));
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  /** The item rows, read behind the vendor totals. */
  const [itemsLoading, setItemsLoading] = useState(false);
  const itemsSeq = useRef(0);
  /** The vendors have names and sales but no items yet: the totals landed and
   *  the item rows did not, or the page was left before they did. */
  const itemsMissing = vendors.length > 0 && vendors.every((v) => v.itemCount === null);

  /** Read the item rows for the search on screen and fill the tree in. */
  const loadItems = (forScope: InventoryScope) => {
    const seq = ++itemsSeq.current;
    setItemsLoading(true);
    fetchVendors(forScope)
      .then((found) => {
        if (seq !== itemsSeq.current) return;
        setVendors(found);
      })
      .catch(() => {
        if (seq !== itemsSeq.current) return;
        toast.error("Couldn't load the items. Search again to retry.");
      })
      .finally(() => {
        if (seq === itemsSeq.current) setItemsLoading(false);
      });
  };

  // A return visit to a search whose items never landed reads them now, so a
  // vendor never opens onto nothing.
  useEffect(() => {
    if (scope && itemsMissing && !itemsLoading) loadItems(scope);
    // Mount only: the search itself starts the read every other time.
  }, []);
  const [searchOpen, setSearchOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const [selected, setSelected] = useState<ProductSummary | null>(null);

  /**
   * Every item's name and UPC, per vendor, for the filter.
   *
   * "Filter vendors and items" found nothing for an item name with no vendor
   * open, though every item row was already loaded (dev board review, finding
   * J). One lowercased string per vendor makes each keystroke a substring test
   * per vendor rather than a walk over thousands of rows.
   */
  const itemText = useMemo(
    () =>
      new Map(
        vendors.map((v) => [
          v.vendorId,
          v.rows
            .map((r) => `${r.product_description} ${r.product_code}`)
            .join(" | ")
            .toLowerCase(),
        ]),
      ),
    [vendors],
  );
  const groupHasItem = (id: string, term: string) =>
    itemText.get(id)?.includes(term) ?? false;

  const { prices, loadPrices, resetPrices, receipts, loadReceipts } =
    usePricePoints();
  const { invoice, loadInvoiceCost, resetInvoiceCost } = useInvoiceCost();
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
    resetPrices();
    resetInvoiceCost();
    try {
      // The vendor totals first, from `subs/rollup`, so the tree draws in a
      // moment; the item rows follow behind it.
      setLoadingMessage("Finding vendors…");
      itemsSeq.current++;
      const found = await fetchVendorTotals(next);
      if (found.length === 0) toast.warn("No vendors sold in that window");
      setVendors(found);
      setScope(next);
      if (found.length > 0) loadItems(next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load vendors");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  // Once the item rows are in, opening a vendor is a regroup rather than a
  // fetch. Until then the tree says the items are loading.
  const products = openVendor
    ? groupProducts(vendors.find((v) => v.vendorId === openVendor)?.rows ?? [])
    : [];

  const toggleVendor = (id: string) => {
    if (id === openVendor) {
      setOpenVendor(null);
      return;
    }
    // A different one opening takes the item panel with it: the item belongs
    // to the list it was picked from, and leaving it up read as the new
    // list's item (dev board review, finding H). Collapsing the open one
    // keeps it.
    setSelected(null);
    resetPrices();
    resetInvoiceCost();
    setOpenVendor(id);
  };

  const selectProduct = (p: ProductSummary) => {
    if (!scope) return;
    setSelected(p);
    // Description, not UPC — that is the only search `cashier_table` offers.
    // The over-match it causes is filtered out again on product_code.
    loadPrices(p.productCode, scope.storeid, scope.start, scope.end);
    loadInvoiceCost(scope, p.productCode);
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
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
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
          invoice={invoice}
          prices={
            selected && prices.upc === selected.productCode ? prices.rows : []
          }
          lines={
            selected && receipts.upc === selected.productCode ? receipts.lines : []
          }
        />
      )}

      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        <InventoryTreePanel
          helpPage="price-opt-vendor"
          title="Price Opt — Vendor"
          storeName={storeName}
          dateLabel={`${formatDate(scope.start)} – ${formatDate(scope.end)}`}
          filterPlaceholder="Filter vendors and items…"
          groups={groups}
          openGroup={openVendor}
          products={products}
          productsLoading={itemsLoading && !!openVendor}
          selectedUpc={selected?.productCode ?? null}
          onToggleGroup={toggleVendor}
          onSelectProduct={selectProduct}
          onSearchOpen={() => setSearchOpen(true)}
          onExportOpen={() => setExportOpen(true)}
          groupHasItem={groupHasItem}
        />

        {selected ? (
          <ItemAnalysisPanel
            product={selected}
            prices={prices}
            receipts={receipts}
            onLoadReceipts={loadReceipts}
            invoice={invoice}
          />
        ) : (
          <div className="flex-1 min-w-0 shadow-lg">
            <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full items-center justify-center">
              <p className="text-[14px] text-content/85">
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
