import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { getScanLookup } from "../../../api/scanner";
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
 * The raw scan is what goes out, untouched. `scanner/lookup` generates every
 * form the code might be stored as and asks the database which exists, because
 * the stored `product_code` keeps its leading digit when the UPC did not begin
 * with a zero and drops it when it did — a split nothing on this side can tell
 * apart from the barcode alone. `normalizeUpc` is still used for dedupe, where
 * one stable key per scan is all that is wanted, but it has no part in the
 * lookup.
 */

/**
 * Codes with a lookup already in the air.
 *
 * Module scope, not a ref, and that is the point: a ref dies with the
 * component, so leaving the screen and coming back — or React's development
 * double-mount — would ask again for a row that was already being fetched.
 * Nothing strands here either, because the `finally` below runs whether or not
 * anything is still mounted to see the answer.
 *
 * Keyed by store as well as code, since the same UPC at a different store is a
 * different question.
 */
const inFlight = new Set<string>();

export const useScanResolve = () => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((s) => s.app);
  const storeId = useAppSelector((s) => s.dev.upcScanner.storeId);

  return useCallback(
    async (row: ScanRow) => {
      if (!storeId) return;
      const key = `${storeId}:${row.code}`;
      if (inFlight.has(key)) return;
      inFlight.add(key);
      try {
        const { data } = await getScanLookup(url, token, storeId, row.raw);
        // `error: 1` is the lookup falling over, which says nothing about
        // whether the item exists. A 200 with a null code is the answer "not
        // sold here" — an ordinary one, and the row says unverified rather
        // than claiming something is wrong.
        if (data.error !== 0) {
          dispatch(markRowError(row.code));
          return;
        }
        if (!data.product_description) {
          dispatch(markUnnamed(row.code));
          return;
        }
        dispatch(
          nameRow({
            code: row.code,
            description: data.product_description,
            productCode: data.product_code ?? undefined,
          }),
        );
      } catch {
        // Never asked, or never answered. Same reasoning: unexplained, not
        // absent.
        dispatch(markRowError(row.code));
      } finally {
        inFlight.delete(key);
      }
    },
    [dispatch, url, token, storeId],
  );
};
