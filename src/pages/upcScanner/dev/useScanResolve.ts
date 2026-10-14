import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { getItemLookupSingleStore } from "../../../api/itemLookup";
import {
  markRowError,
  markUnnamed,
  nameRow,
  type ScanRow,
} from "../../../features/dev/devUpcScannerSlice";

/**
 * Putting a name on a scanned code.
 *
 * This is the whole reason the page talks to an API at all. The file needs no
 * name — the clerk does: a UPC that comes back as "Borden Whole Milk 1 gal"
 * while they are standing at the milk confirms they scanned the tag they meant
 * to, which is the mistake worth catching. A barcode scanner will not hand us
 * garbled digits; it will happily hand us the right digits off the wrong tag.
 *
 * One call site, one function, on purpose: the endpoint underneath it is being
 * replaced, and when it is, nothing outside this file should need to know.
 */

/**
 * How much history to ask for.
 *
 * `items/itemlookup/{storeid}` is a sales query: it answers with register
 * lines, and a name only because those lines carry one. We want the name and
 * throw the rest away, so we ask for the least it will give us.
 *
 * This number goes away entirely once the endpoint returns a description from
 * the item master — which is also the only thing that will let a never-sold
 * item be named, and a never-sold item is exactly what gets a new shelf tag.
 */
const RESOLVE_DAYS = 1;

/**
 * Which of the row's two codes the lookup gets.
 *
 * OPEN — the endpoint is getting server-side normalization. Until that lands,
 * send the normalized code, which is what every existing caller of this
 * endpoint sends. After it lands this becomes `row.raw` and the frontend stops
 * having an opinion about UPC shapes at all.
 */
const codeForLookup = (row: ScanRow) => row.code;

interface LookupResp {
  error: number;
  description?: string | null;
  product_code?: string;
  history?: { product_description?: string; sale_date: string }[];
}

/**
 * The name, from wherever the response happens to carry one.
 *
 * Mirrors `itemDescription` in Item Lookup's `lookupMetrics` rather than
 * importing it: the two page trees are promoted independently, and a shared
 * import between them would mean promoting one could change the other. Three
 * lines is a better price than that coupling.
 */
const describe = (resp: LookupResp): string => {
  if (resp.description) return resp.description;
  const named = (resp.history ?? [])
    .filter((h) => h.product_description)
    .sort((a, b) => b.sale_date.localeCompare(a.sale_date));
  return named[0]?.product_description ?? "";
};

export const useScanResolve = () => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((s) => s.app);
  const storeId = useAppSelector((s) => s.dev.upcScanner.storeId);

  return useCallback(
    async (row: ScanRow) => {
      if (!storeId) return;
      try {
        const resp = await getItemLookupSingleStore(
          url,
          token,
          codeForLookup(row),
          storeId,
          RESOLVE_DAYS,
        );
        const data: LookupResp = resp.data;
        // A non-zero error means the request failed, not that the item is
        // absent — the same distinction Item Lookup's queue keeps, and for the
        // same reason: a row that claims "no such item" because the connection
        // dropped is a lie the clerk would act on.
        if (data.error !== 0) {
          dispatch(markRowError(row.code));
          return;
        }
        const description = describe(data);
        if (!description) {
          dispatch(markUnnamed(row.code));
          return;
        }
        dispatch(
          nameRow({ code: row.code, description, productCode: data.product_code }),
        );
      } catch {
        dispatch(markRowError(row.code));
      }
    },
    [dispatch, url, token, storeId],
  );
};
