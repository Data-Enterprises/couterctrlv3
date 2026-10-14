import axios from "axios";

/**
 * What a scanned barcode is, at one store.
 *
 * Takes the code exactly as the scanner emitted it — check digit, leading
 * zero and all. The matching happens on the server, which tries every form the
 * code might be stored as and lets the database say which one exists. That is
 * not a detail the frontend can do for it: `product_code` keeps the leading
 * digit when the UPC did not begin with zero and loses it when it did, so
 * trimming to one form here would turn a real item into a blank for half the
 * catalogue.
 *
 * No date window. A slow mover that last sold in March is still a real item,
 * and a window only turns a found item into a blank one.
 */

export interface ScanLookupResp {
  /** 0 on an answer, 1 when the lookup itself fell over. */
  error: number;
  success: boolean;
  /** Echoed back as it was sent. */
  upc: string;
  /**
   * Null is an ordinary answer, not a failure — the item may never have sold
   * at this store, or the wrong tag was scanned. It arrives as a 200, so the
   * row reads as unverified rather than broken.
   */
  product_code: string | null;
  product_description: string | null;
  /** Only on `error: 1`. */
  msg?: string;
}

export const getScanLookup = (
  url: string,
  token: string,
  storeId: number,
  upc: string,
  signal?: AbortSignal,
) =>
  axios<ScanLookupResp>({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: `${url}scanner/lookup/${storeId}`,
    params: { upc },
    signal,
  });
