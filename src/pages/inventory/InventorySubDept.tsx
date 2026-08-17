import { useRef, useState } from "react";
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
  fetchProducts,
  type InventoryScope,
  type ProductSummary,
  type SubDeptSummary,
} from "./inventoryData";

/**
 * Price Opt — Sub Department.
 *
 * Estimated against actual price points for one item at a time, reached by
 * opening a department and picking a UPC out of it.
 *
 * The fetch lives here rather than in a panel, per the page pattern — panels
 * render what the container loaded and never reach for data themselves. The
 * exception is the register fetch, which is owned by its own hook because it
 * carries a staleness guard that has to survive the user clicking a second item
 * before the first resolves.
 */
const InventorySubDept = () => {
  const toast = useToast();
  const { url, token } = useAppSelector((s) => s.app);
  const { startDate, endDate, lastStore } = useAppSelector((s) => s.search);
  const { assignedStores } = useAppSelector((s) => s.user);

  const [storeId, setStoreId] = useState(lastStore || 0);
  const [scope, setScope] = useState<InventoryScope | null>(null);
  const [subDepts, setSubDepts] = useState<SubDeptSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const [openSubDept, setOpenSubDept] = useState<number | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selected, setSelected] = useState<ProductSummary | null>(null);

  const { actual, loadActual, resetActual } = useActualPricePoints();
  const storeName = useStoreName(scope?.storeid ?? storeId);

  /** The department whose items are wanted on screen. A response that no longer
   *  matches lost a race and is discarded — clicking a big department and then
   *  a small one would otherwise leave the small one's name above the big one's
   *  items, since the small request resolves first. */
  const wantedSubDept = useRef<number | null>(null);

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
    setOpenSubDept(null);
    setProducts([]);
    setSelected(null);
    resetActual();
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
      setProducts([]);
      return;
    }
    wantedSubDept.current = id;
    setOpenSubDept(id);
    setProducts([]);
    setProductsLoading(true);
    try {
      const rows = await fetchProducts(scope, id);
      if (wantedSubDept.current !== id) return;
      setProducts(rows);
    } catch (e) {
      if (wantedSubDept.current !== id) return;
      toast.error(e instanceof Error ? e.message : "Could not load items");
      setProducts([]);
    } finally {
      // Only the winner clears the spinner; a loser doing so would uncover an
      // empty list while the department the user actually wants is still in
      // flight.
      if (wantedSubDept.current === id) setProductsLoading(false);
    }
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>{entry}</div>
        </div>
      )}

      {/* Built here rather than held in state — the item roll-up only has to
          exist while the modal is open, and the vendor page's equivalent is
          expensive enough that computing it every render would be felt. */}
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
          lines={
            selected && actual.upc === selected.productCode ? actual.lines : []
          }
        />
      )}

      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        <InventoryTreePanel
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
          <ItemAnalysisPanel product={selected} actual={actual} />
        ) : (
          <div className="flex-1 min-w-0 shadow-lg">
            <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full items-center justify-center">
              <p className="text-[13px] text-content/60">
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
