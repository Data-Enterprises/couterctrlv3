// Hooks
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { usePricePoints } from "../../../../hooks/usePricePoints";

// Redux
import {
  patchSubDeptView,
  patchVendorView,
  cacheSubDeptProducts,
} from "../../../../features/dev/devPriceOptSlice";

// Utils
import { formatGoliathDate } from "../../../../utils";
import { fetchInvoiceCost } from "../utils/invoiceCost";
import {
  fetchSubDepts,
  fetchProducts,
  fetchVendors,
  fetchVendorTotals,
  groupProducts,
} from "../utils";

// Interfaces
import type {
  InvoiceCostState,
  InvoiceCost,
  InventoryScope,
  ProductSummary,
  SubDeptSummary,
  TreeGroup,
  VendorSummary,
} from "../interfaces";

/** What both Price Opt pages read from Redux: the session, the search picker
 *  and each page's kept view. */
export const usePriceOptCtx = () => {
  const { url, token } = useAppSelector((s) => s.app);
  const { startDate, endDate, lastStore } = useAppSelector((s) => s.search);
  const { assignedStores } = useAppSelector((s) => s.user);
  const { subDept, vendor } = useAppSelector((s) => s.dev.priceOpt);

  return {
    url,
    token,
    startDate,
    endDate,
    lastStore,
    assignedStores,
    subDeptView: subDept,
    vendorView: vendor,
  };
};

export type PriceOptCtx = ReturnType<typeof usePriceOptCtx>;

const initial: InvoiceCostState = { upc: null, cost: null, loading: false };

/**
 * The latest invoiced cost for the item on screen, beside
 * `useActualPricePoints`. A failure means no invoice, and the page falls back
 * to the item-file cost.
 */
export const useInvoiceCost = () => {
  const [state, setState] = useState<InvoiceCostState>(initial);
  const wanted = useRef<string | null>(null);

  const loadInvoiceCost = useCallback(
    async (scope: InventoryScope, upc: string) => {
      wanted.current = upc;
      setState({ upc, cost: null, loading: true });
      let cost: InvoiceCost | null = null;
      try {
        cost = await fetchInvoiceCost(scope, upc);
      } catch {
        cost = null;
      }
      if (wanted.current !== upc) return;
      setState({ upc, cost, loading: false });
    },
    [],
  );

  const resetInvoiceCost = useCallback(() => {
    wanted.current = null;
    setState(initial);
  }, []);

  return { invoice: state, loadInvoiceCost, resetInvoiceCost };
};

/**
 * The item on screen and its three reads: the price table, the receipts behind
 * one price, and the invoice cost. Clearing it drops all three.
 */
export const useItemSelection = () => {
  const [selected, setSelected] = useState<ProductSummary | null>(null);
  const { prices, loadPrices, resetPrices, receipts, loadReceipts } =
    usePricePoints();
  const { invoice, loadInvoiceCost, resetInvoiceCost } = useInvoiceCost();

  const clearItem = () => {
    setSelected(null);
    resetPrices();
    resetInvoiceCost();
  };

  const selectProduct = (scope: InventoryScope | null, p: ProductSummary) => {
    if (!scope) return;
    setSelected(p);
    // Description, not UPC — that is the only search `cashier_table` offers.
    // The over-match it causes is filtered out again on product_code.
    loadPrices(p.productCode, scope.storeid, scope.start, scope.end);
    loadInvoiceCost(scope, p.productCode);
  };

  return {
    selected,
    prices,
    receipts,
    loadReceipts,
    invoice,
    clearItem,
    selectProduct,
  };
};

/** The search window on screen, with the session's token added each render
 *  (never kept in the slice). */
const useScope = (
  searchWindow: PriceOptCtx["subDeptView"]["window"],
  ctx: PriceOptCtx,
) =>
  useMemo<InventoryScope | null>(
    () =>
      searchWindow ? { url: ctx.url, token: ctx.token, ...searchWindow } : null,
    [searchWindow, ctx.url, ctx.token],
  );

/**
 * Sub Department's data: the departments for the searched window, the open
 * one, and its items out of the slice's cache. Kept in the slice so a return
 * visit lands on the last result.
 */
export const useSubDeptData = (
  ctx: PriceOptCtx,
  storeId: number,
  clearItem: () => void,
  closeSearch: () => void,
) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const view = ctx.subDeptView;
  const scope = useScope(view.window, ctx);
  const subDepts = view.subDepts;
  const openSubDept = view.openSubDept;
  /** The open department's items, out of the cache. Derived rather than held
   *  beside it so the list on screen is always the one that was cached. */
  const products = useMemo(
    () =>
      openSubDept === null ? [] : (view.productsBySubDept[openSubDept] ?? []),
    [openSubDept, view.productsBySubDept],
  );
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  /** The department whose items are wanted on screen; a response that no
   *  longer matches lost a race and is discarded. */
  const wantedSubDept = useRef<string | null>(null);

  const setScope = (next: InventoryScope) =>
    dispatch(
      patchSubDeptView({
        window: { storeid: next.storeid, start: next.start, end: next.end },
      }),
    );
  const setSubDepts = (next: SubDeptSummary[]) =>
    dispatch(patchSubDeptView({ subDepts: next }));
  const setOpenSubDept = (next: string | null) =>
    dispatch(patchSubDeptView({ openSubDept: next }));

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
      url: ctx.url,
      token: ctx.token,
      storeid: storeId,
      start: formatGoliathDate(ctx.startDate),
      end: formatGoliathDate(ctx.endDate),
    };
    closeSearch();
    setLoading(true);
    // A new window invalidates everything below it, including any register
    // fetch still in flight for an item from the old one.
    wantedSubDept.current = null;
    // The cache belongs to the window it was read in, so a new search empties
    // it rather than letting a previous store's items answer for this one.
    dispatch(patchSubDeptView({ openSubDept: null, productsBySubDept: {} }));
    clearItem();
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

  const toggleSubDept = async (id: string) => {
    if (!scope) return;
    if (id === openSubDept) {
      wantedSubDept.current = null;
      setOpenSubDept(null);
      return;
    }
    // Opening a different one closes the item panel (the item belongs to the
    // old list); collapsing the open one keeps it.
    clearItem();
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

  const groups: TreeGroup[] = subDepts.map((d) => ({
    id: d.key,
    label: d.description,
    sales: d.sales,
    itemCount: d.itemCount,
  }));

  return {
    scope,
    subDepts,
    openSubDept,
    products,
    loading,
    productsLoading,
    runSearch,
    toggleSubDept,
    groups,
  };
};

/**
 * Vendor's data: the vendor totals first, so the tree draws in a moment, then
 * every item row behind them. Opening a vendor is a regroup, not a fetch.
 */
export const useVendorData = (
  ctx: PriceOptCtx,
  storeId: number,
  clearItem: () => void,
  closeSearch: () => void,
) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const view = ctx.vendorView;
  const scope = useScope(view.window, ctx);
  const vendors = view.vendors;
  const openVendor = view.openVendor;
  const setScope = (next: InventoryScope) =>
    dispatch(
      patchVendorView({
        window: { storeid: next.storeid, start: next.start, end: next.end },
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
  const itemsMissing =
    vendors.length > 0 && vendors.every((v) => v.itemCount === null);

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

  /**
   * Every item's name and UPC per vendor, as one lowercased string, so the
   * filter finds items in closed vendors with a substring test per vendor.
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

  const runSearch = async () => {
    if (!storeId) {
      toast.warn("Please select a store");
      return;
    }
    const next: InventoryScope = {
      url: ctx.url,
      token: ctx.token,
      storeid: storeId,
      start: formatGoliathDate(ctx.startDate),
      end: formatGoliathDate(ctx.endDate),
    };
    closeSearch();
    setLoading(true);
    setOpenVendor(null);
    clearItem();
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
    // Opening a different one closes the item panel (the item belongs to the
    // old list); collapsing the open one keeps it.
    clearItem();
    setOpenVendor(id);
  };

  const groups: TreeGroup[] = vendors.map((v) => ({
    id: v.vendorId,
    label: v.vendorName,
    sales: v.sales,
    itemCount: v.itemCount,
  }));

  return {
    scope,
    vendors,
    openVendor,
    products,
    loading,
    loadingMessage,
    itemsLoading,
    runSearch,
    toggleVendor,
    groupHasItem,
    groups,
  };
};
