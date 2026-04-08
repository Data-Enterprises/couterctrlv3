import { getItemLookupSingleStore } from "../../../api/itemLookup";
import UpcScanner from "../../../components/scanner/UpcScanner";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setFetchingItemHistory,
  setScannedItemMobile,
  setScannedItemHistory,
} from "../../../features/subMarginSlice";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import type { JsonError } from "../../../interfaces";
import { useSubMarginCtx } from "../hooks";
import ItemCardSingle from "./ItemCardSingle";
import ItemHistoryStatic from "./ItemHistoryStatic";

const ScanView = () => {
  const ctx = useSubMarginCtx();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const scan = useAppSelector((state) => state.itemScan);

  const handleScan = () => {
    const upc = scan.upcCode;
    const item = ctx.itemDataMobile.find((item) => item.product_code === upc);
    if (!item) {
      toast.error("Item not found in current data");
      return;
    }

    dispatch(setScannedItemMobile(item));
    dispatch(setScannedItemHistory([]));
    dispatch(setFetchingItemHistory(true));
    getItemLookupSingleStore(ctx.url, ctx.token, upc, ctx.searchValue)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setScannedItemHistory(j.history));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setFetchingItemHistory(false)));
  };

  return (
    <div className="space-y-2">
      <UpcScanner handleScan={handleScan} />
      {ctx.scannedItemMobile ? (
        <div className="text-[13px] max-h-[59vh] overflow-y-auto rounded-lg">
          <ItemCardSingle item={ctx.scannedItemMobile} />
          <ItemHistoryStatic />
        </div>
      ) : null}
    </div>
  );
};

export default ScanView;
