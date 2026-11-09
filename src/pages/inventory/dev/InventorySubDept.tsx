// Hooks
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useAppDispatch,
  useAppSelector,
  useStoreName,
} from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { usePricePoints } from "../../../hooks/usePricePoints";
import { useInvoiceCost } from "./hooks";

// Redux
import {
  patchSubDeptView,
  cacheSubDeptProducts,
} from "../../../features/dev/devPriceOptSlice";

// Utils
import { formatGoliathDate, formatDate } from "../../../utils";
import { fetchSubDepts, fetchProducts } from "./utils";

// Interfaces
import type {
  TreeGroup,
  InventoryScope,
  ProductSummary,
  SubDeptSummary,
} from "./interfaces";

// Components
import LoadingIndicator from "../../../components-dev/loading/LoadingIndicator";
import SingleStoreSearchCard from "../../../components-dev/SingleStoreSearchCard";
import DatePickers from "../../../components-dev/datePickers/DatePickers";
import InventoryTreePanel, {  } from "./components/InventoryTreePanel";
import InventoryExportModal from "./export/InventoryExportModal";
import ItemAnalysisPanel from "./components/ItemAnalysisPanel";

/**
 * Price Opt: Sub Department. Estimated against actual price points for one
 * item, reached by opening a department and picking a UPC. The fetch lives
 * here, except the register fetch, whose hook carries a staleness guard.
 */
const InventorySubDept = () => {
  const toast = useToast();
  const { url, token } = useAppSelector((s) => s.app);
  const { startDate, endDate, lastStore } = useAppSelector((s) => s.search);
  const { assignedStores } = useAppSelector((s) => s.user);

  const dispatch = useAppDispatch();
  const [storeId, setStoreId] = useState(lastStore || 0);
  // Kept in the slice so a return visit lands on the last result. The token
  // comes from the session each render, never from the slice.
  const view = useAppSelector((s) => s.dev.priceOpt.subDept);
  const scope = useMemo<InventoryScope | null>(
    () => (view.window ? { url, token, ...view.window } : null),
    [view.window, url, token],
  );
  const subDepts = view.subDepts;
  const openSubDept = view.openSubDept;
  /** The open department's items, out of the cache. Derived rather than held
   *  beside it so the list on screen is always the one that was cached. */
  const products = useMemo(
    () =>
      openSubDept === null
        ? []
        : (view.productsBySubDept[openSubDept] ?? []),
    [openSubDept, view.productsBySubDept],
  );
  const setScope = (next: InventoryScope | null) =>
    dispatch(
      patchSubDeptView({
        window: next
          ? { storeid: next.storeid, start: next.start, end: next.end }
          : null,
      }),
    );
  const setSubDepts = (next: SubDeptSummary[]) =>
    dispatch(patchSubDeptView({ subDepts: next }));
  const setOpenSubDept = (next: number | null) =>
    dispatch(patchSubDeptView({ openSubDept: next }));
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const [productsLoading, setProductsLoading] = useState(false);
  const [selected, setSelected] = useState<ProductSummary | null>(null);

  const { prices, loadPrices, resetPrices, receipts, loadReceipts } =
    usePricePoints();
  const { invoice, loadInvoiceCost, resetInvoiceCost } = useInvoiceCost();
  const storeName = useStoreName(scope?.storeid ?? storeId);

  /** The department whose items are wanted on screen; a response that no
   *  longer matches lost a race and is discarded. */
  const wantedSubDept = useRef<number | null>(null);

  // An open department with no items had its fetch cut off when the page was
  // left, so it is closed rather than shown empty.
  useEffect(() => {
    // Nothing cached for it means the fetch was still in flight, not that the
    // department is empty -- a cached empty department keeps its entry.
    if (openSubDept !== null && !(openSubDept in view.productsBySubDept)) {
      setOpenSubDept(null);
    }
    // Once, on arrival: this is about what the slice kept, not what changes.
  }, []);

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
    // A new window invalidates everything below it, including any register
    // fetch still in flight for an item from the old one.
    wantedSubDept.current = null;
    // The cache belongs to the window it was read in, so a new search empties
    // it rather than letting a previous store's items answer for this one.
    dispatch(
      patchSubDeptView({ openSubDept: null, productsBySubDept: {} }),
    );
    setSelected(null);
    resetPrices();
    resetInvoiceCost();
    try {
      const depts = await fetchSubDepts(next);
      if (depts.length === 0) toast.warn("No departments sold in that window");
      setSubDepts(depts);
      setScope(next);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not load departments",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSubDept = async (id: number) => {
    if (!scope) return;
    if (id === openSubDept) {
      wantedSubDept.current = null;
      setOpenSubDept(null);
      return;
    }
    // Opening a different one closes the item panel (the item belongs to the
    // old list); collapsing the open one keeps it.
    setSelected(null);
    resetPrices();
    resetInvoiceCost();
    wantedSubDept.current = id;
    setOpenSubDept(id);

    // Already read in this window: a department's items can't change inside
    // a fixed store and range, so reopening is a render, not a request.
    if (id in view.productsBySubDept) return;

    setProductsLoading(true);
    try {
      const rows = await fetchProducts(scope, id);
      if (wantedSubDept.current !== id) return;
      dispatch(cacheSubDeptProducts({ subDept: id, products: rows }));
    } catch (e) {
      if (wantedSubDept.current !== id) return;
      // Left out of the cache deliberately, so reopening it tries again.
      toast.error(e instanceof Error ? e.message : "Could not load items");
    } finally {
      // Only the winning request clears the spinner.
      if (wantedSubDept.current === id) setProductsLoading(false);
    }
  };

  const selectProduct = (p: ProductSummary) => {
    if (!scope) return;
    setSelected(p);
    // Description, not UPC — that is the only search `cashier_table` offers.
    // The over-match it causes is filtered out again on product_code.
    loadPrices(p.productCode, scope.storeid, scope.start, scope.end);
    loadInvoiceCost(scope, p.productCode);
  };

  const groups: TreeGroup[] = subDepts.map((d) => ({
    id: String(d.id),
    label: d.description,
    sales: d.sales,
    itemCount: d.itemCount,
  }));

  const entry = (
    <SingleStoreSearchCard
      title="Price Opt — Sub Department"
      description="Pick a store and a date range, then open a department to compare an item's estimated prices against what the registers actually rang."
      buttonLabel="Load departments"
      stores={assignedStores}
      selectedStoreId={storeId}
      onStoreSelect={setStoreId}
      onSearch={runSearch}
      loading={loading}
      loadingMessage="Loading departments..."
      datePicker={<DatePickers showBtn={false} stacked />}
    />
  );

  if (loading) {
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

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      {/* Re-search is an overlay, never a return to the entry screen — losing
          the loaded window to change one field is what that pattern prevents. */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>{entry}</div>
        </div>
      )}

      {/* Built here, not held in state: the roll-up only needs to exist
          while the modal is open. */}
      {exportOpen && (
        <InventoryExportModal
          onClose={() => setExportOpen(false)}
          groupNoun="Department"
          pageSlug="sub-department"
          storeName={storeName}
          dateLabel={`${formatDate(scope.start)} – ${formatDate(scope.end)}`}
          groups={groups}
          itemGroups={
            openSubDept !== null && products.length > 0
              ? [
                  {
                    label:
                      subDepts.find((d) => d.id === openSubDept)?.description ??
                      String(openSubDept),
                    products,
                  },
                ]
              : []
          }
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
          helpPage="price-opt-sub-dept"
          title="Price Opt — Sub Department"
          storeName={storeName}
          dateLabel={`${formatDate(scope.start)} – ${formatDate(scope.end)}`}
          filterPlaceholder="Filter departments and items…"
          groups={groups}
          openGroup={openSubDept === null ? null : String(openSubDept)}
          products={products}
          productsLoading={productsLoading}
          selectedUpc={selected?.productCode ?? null}
          onToggleGroup={(id) => toggleSubDept(Number(id))}
          onSelectProduct={selectProduct}
          onSearchOpen={() => setSearchOpen(true)}
          onExportOpen={() => setExportOpen(true)}
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
              <p className="text-[14px] text-content/95">
                Open a department and pick an item
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventorySubDept;
