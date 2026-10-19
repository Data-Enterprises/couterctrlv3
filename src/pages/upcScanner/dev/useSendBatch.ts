import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { setSending, setSent } from "../../../features/dev/devUpcScannerSlice";
import { buildTagFile, tagFileName } from "./tagFile";

/**
 * Sending the batch.
 *
 * There is no endpoint for this yet: nothing in `src/api` writes a UPC list
 * anywhere, and the S3 side is still being settled. So this writes the file to
 * the device instead of posting it — which is not a placeholder so much as the
 * thing that makes the format reviewable. You can walk an aisle, scan fifty
 * tags and come back holding the actual file, which beats describing it.
 *
 * When the endpoint lands, the shape to copy is Sales Export: client posts,
 * the backend writes to S3 under a prefix taken from the caller's own token,
 * and the response carries bucket, path, row count and a presigned link (see
 * `api/salesExport` and the note at the top of `api/exportBuilds`). Only the
 * marked block below changes; the slice, the screen and the file builder do
 * not know which way it went.
 */
export const useSendBatch = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { rows, storeId } = useAppSelector((s) => s.dev.upcScanner);
  const { assignedStores } = useAppSelector((s) => s.user);

  /** True when the batch went, so the caller can close over it. */
  return useCallback(async (): Promise<boolean> => {
    if (!rows.length || !storeId) return false;
    const store = assignedStores.find((s) => s.storeid === storeId);
    const at = new Date();
    const name = tagFileName(store?.store_number ?? String(storeId), rows.length, at);

    dispatch(setSending(true));
    try {
      // --- the part that becomes a POST ---
      const file = buildTagFile(rows, storeId);
      const link = document.createElement("a");
      const blob = new Blob([file], { type: "text/csv;charset=utf-8" });
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
      // Freeing it immediately cancels the download in some builds of Chrome;
      // a tick is enough and the object is gone on the next navigation anyway.
      setTimeout(() => URL.revokeObjectURL(link.href), 0);
      // --- end ---

      dispatch(setSent({ count: rows.length, at: at.getTime(), file: name }));
      return true;
    } catch {
      dispatch(setSending(false));
      // The batch is still on screen — nothing was cleared — so retrying is
      // safe and the toast says that rather than leaving them guessing.
      toast.error("Could not write the file. The batch is still here, try again.");
      return false;
    }
  }, [assignedStores, dispatch, rows, storeId, toast]);
};
