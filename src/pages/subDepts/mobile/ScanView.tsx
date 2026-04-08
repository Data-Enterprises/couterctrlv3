import { useEffect, useState } from "react";
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
import { setUpcCode } from "../../../features/itemScanSlice";

const ScanView = () => {
  const ctx = useSubMarginCtx();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const scan = useAppSelector((state) => state.itemScan);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    if (!ctx.viewDaily && ctx.scannedItemMobile && !scan.upcCode.length) {
      dispatch(setUpcCode(ctx.scannedItemMobile.product_code));
    }
  }, [ctx.viewDaily]);

  const handleScan = () => {
    setMsg("");
    const upc = scan.upcCode;
    const item = ctx.itemDataMobile.find((item) => item.product_code === upc);
    if (!item) {
      setMsg("Item not found in current data");
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

  const clear = () => {
    dispatch(setScannedItemMobile(null));
    dispatch(setScannedItemHistory([]));
    dispatch(setUpcCode(""));
  };

  return (
    <div className="space-y-2">
      <UpcScanner handleScan={handleScan} onClear={clear} />
      {msg.length ? (
        <div className="h-16 font-medium flex items-center justify-center">
          <div className="text-content/60 bg-custom-white p-2 rounded-lg shadow-md">{msg}</div>
        </div>
      ) : null}
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
