import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ProductSummary,
  SubDeptSummary,
  VendorSummary,
} from "../../pages/inventory/dev/inventoryData";

/**
 * What the two Price Opt pages have already loaded, kept across navigation.
 *
 * The pages held their results in component state, so leaving and coming back
 * emptied the form. On the Vendor page that meant another full read of every
 * item row in the store-week to get back to where you were (dev board review,
 * finding K). The older pages keep their last result; these now do too.
 *
 * Dev only: Price Opt is a Coming Soon page with no prod tree, so there is no
 * prod twin and it is listed in `DEV_ONLY_SLICES`.
 *
 * What is NOT kept: the selected item. Its receipts and invoice cost are
 * fetched by hooks that live with the page, and picking it again costs one
 * small request. Keeping it without them would show an item with an empty
 * right-hand table.
 *
 * The search window holds the store and dates and never the API token. The
 * page rebuilds its scope from the current session on every render, so a
 * kept result can't carry a token that a re-login has since replaced.
 */

export interface SearchWindow {
  storeid: number;
  /** yyyy-mm-dd */
  start: string;
  end: string;
}

export interface VendorView {
  window: SearchWindow | null;
  vendors: VendorSummary[];
  openVendor: string | null;
}

export interface SubDeptView {
  window: SearchWindow | null;
  subDepts: SubDeptSummary[];
  openSubDept: number | null;
  /**
   * Items per department, for every department opened in this window.
   *
   * Was a single `products` list for whichever department was open, so
   * closing one and reopening it fetched the same items again -- a loop a
   * user walking a store does constantly. The items cannot change inside a
   * fixed store and date range, so the second read was never going to say
   * anything new.
   *
   * Keyed by department id and emptied whenever the window moves, which is
   * the only thing that can invalidate it. The open department's list is
   * derived from this rather than stored beside it, so the two cannot
   * disagree about what is on screen.
   */
  productsBySubDept: Record<number, ProductSummary[]>;
}

interface PriceOptState {
  vendor: VendorView;
  subDept: SubDeptView;
}

const initialState: PriceOptState = {
  vendor: { window: null, vendors: [], openVendor: null },
  subDept: {
    window: null,
    subDepts: [],
    openSubDept: null,
    productsBySubDept: {},
  },
};

const priceOptSlice = createSlice({
  name: "devPriceOpt",
  initialState,
  reducers: {
    patchVendorView: (state, action: PayloadAction<Partial<VendorView>>) => {
      Object.assign(state.vendor, action.payload);
    },
    patchSubDeptView: (state, action: PayloadAction<Partial<SubDeptView>>) => {
      Object.assign(state.subDept, action.payload);
    },
    /** One department's items into the cache, leaving the rest alone. */
    cacheSubDeptProducts: (
      state,
      action: PayloadAction<{ subDept: number; products: ProductSummary[] }>,
    ) => {
      state.subDept.productsBySubDept[action.payload.subDept] =
        action.payload.products;
    },
  },
});

export const { patchVendorView, patchSubDeptView, cacheSubDeptProducts } =
  priceOptSlice.actions;
export default priceOptSlice.reducer;
