import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { useAppSelector } from "../../../hooks";
import { useSendBatch } from "./useSendBatch";

/**
 * The last look before a batch goes.
 *
 * It answers one question — what am I about to send — and answers it the way
 * the person holding the scanner would ask it: how many tags, for which store,
 * and which items. The file's own shape is not part of that. A store manager
 * does not need to know there is a file, let alone see its columns.
 */

/** Enough items to recognise the batch, before it turns into a wall of text. */
const PREVIEW_ROWS = 5;

const SendSheet = ({ onClose }: { onClose: () => void }) => {
  const { rows, storeId, sending } = useAppSelector((s) => s.dev.upcScanner);
  const { assignedStores } = useAppSelector((s) => s.user);
  const send = useSendBatch();

  // `store_name` already leads with the store's number, so it reads on its own.
  const storeName =
    assignedStores.find((s) => s.storeid === storeId)?.store_name ?? "";
  const unverified = rows.filter((r) => r.status !== "named").length;
  const shown = rows.slice(0, PREVIEW_ROWS);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-brand_navy/40"
      />
      <div className="relative max-h-full overflow-y-auto rounded-t-[20px] bg-custom-white px-4 pb-5 pt-2.5 shadow-lg">
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-brand_navy/20" />

        <h2 className="font-display text-[18px] font-extrabold tracking-tight text-content/95">
          Send {rows.length} {rows.length === 1 ? "tag" : "tags"}
        </h2>
        <div className="mt-1 text-[12px] font-semibold text-content/95">{storeName}</div>

        <div className="mt-3 overflow-hidden rounded-xl border border-brand_line bg-brand_paper">
          {shown.map((row) => (
            <div
              key={row.raw}
              className="border-b border-brand_line px-3 py-2 last:border-b-0"
            >
              <div className="truncate text-[13px] font-semibold text-content/95">
                {row.description || "No item name"}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-brand_slate/95">
                {row.productCode ?? row.raw}
              </div>
            </div>
          ))}
          {rows.length > shown.length && (
            <div className="border-t border-brand_line px-3 py-2 text-[12px] font-semibold text-brand_slate/95">
              and {rows.length - shown.length} more
            </div>
          )}
        </div>

        {unverified > 0 && (
          <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-brand_danger_line bg-brand_danger_bg px-3 py-2.5">
            <ExclamationTriangleIcon className="mt-px h-4 w-4 shrink-0 text-brand_danger" />
            <span className="text-[11.5px] leading-snug text-content/95">
              {unverified === 1 ? "One tag has" : `${unverified} tags have`} no item
              name. That is normal for something new — but it is also what a tag
              scanned off the wrong shelf looks like.
            </span>
          </div>
        )}

        <button
          type="button"
          disabled={sending || rows.length === 0}
          onClick={async () => {
            // Closes only on success: a failed send leaves the batch and the
            // sheet exactly where they were, so the retry is one tap.
            if (await send()) onClose();
          }}
          className="mt-3 h-12 w-full rounded-xl bg-brand_navy font-display text-[15px] font-bold tracking-tight text-custom-white shadow-md disabled:bg-brand_navy/20 disabled:text-content/40 disabled:shadow-none"
        >
          {sending ? "Sending…" : "Send for tags"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-1.5 h-11 w-full rounded-xl text-[13.5px] font-semibold text-content/95"
        >
          Keep scanning
        </button>

        <p className="mt-2 text-center text-[11px] leading-relaxed text-brand_slate/95">
          Your tag printer picks these up. Nothing here changes a price.
        </p>
      </div>
    </div>
  );
};

export default SendSheet;
