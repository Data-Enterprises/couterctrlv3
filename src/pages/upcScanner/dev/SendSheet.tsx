import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { useAppSelector } from "../../../hooks";
import { tagFileLines, TAG_FILE_HEADER } from "./tagFile";
import { useSendBatch } from "./useSendBatch";

/**
 * The last look before a batch goes.
 *
 * Shows the file itself rather than describing it. Two columns and a handful
 * of rows is small enough to print, and seeing `041220576401,018` is what
 * makes the store scope and the code format checkable — both of which are
 * invisible in a list of item names.
 *
 * Unverified codes are named here but do not block the send. They are mostly
 * new items, which is what tags get made for; refusing to send them would make
 * the page useless for its main job.
 */

/** Enough of the file to recognise it, without turning the sheet into a table. */
const PREVIEW_ROWS = 3;

const SendSheet = ({ onClose }: { onClose: () => void }) => {
  const { rows, storeId, sending } = useAppSelector((s) => s.dev.upcScanner);
  const { assignedStores } = useAppSelector((s) => s.user);
  const send = useSendBatch();

  const store = assignedStores.find((s) => s.storeid === storeId);
  const lines = tagFileLines(rows, storeId);
  const unverified = rows.filter((r) => r.status !== "named").length;

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

        <h2 className="font-display text-[18px] font-extrabold tracking-tight text-content/85">
          Send {rows.length} {rows.length === 1 ? "UPC" : "UPCs"} for tags
        </h2>
        <div className="mt-1 font-mono text-[9.5px] uppercase tracking-wide text-brand_slate/85">
          {store ? `Store ${store.store_number} · ${store.store_name}` : `Store ${storeId}`}
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-brand_line bg-brand_paper">
          <div className="flex items-center justify-between border-b border-brand_line px-3 py-2">
            <span className="font-mono text-[9.5px] uppercase tracking-wide text-brand_slate/85">
              What gets sent
            </span>
            <span className="font-mono text-[9.5px] uppercase tracking-wide text-brand_slate/85">
              {lines.length} {lines.length === 1 ? "row" : "rows"}
            </span>
          </div>
          <div className="px-3 pb-2.5 pt-2 font-mono text-[11.5px] leading-relaxed text-content/85">
            {TAG_FILE_HEADER && (
              <div className="font-semibold text-brand_slate/85">{TAG_FILE_HEADER}</div>
            )}
            {lines.slice(0, PREVIEW_ROWS).map((line) => (
              <div key={line}>{line}</div>
            ))}
            {lines.length > PREVIEW_ROWS && (
              <div className="mt-1 font-mono text-[9.5px] uppercase tracking-wide text-brand_slate/85">
                …{lines.length - PREVIEW_ROWS} more{" "}
                {lines.length - PREVIEW_ROWS === 1 ? "row" : "rows"}
              </div>
            )}
          </div>
        </div>

        {unverified > 0 && (
          <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-brand_danger_line bg-brand_danger_bg px-3 py-2.5">
            <ExclamationTriangleIcon className="mt-px h-4 w-4 shrink-0 text-brand_danger" />
            <span className="text-[11.5px] leading-snug text-content/85">
              {unverified} {unverified === 1 ? "code has" : "codes have"} no item
              name at this store. That is normal for a new item — but it is also
              what a tag scanned off the wrong shelf looks like.
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
          {sending ? "Sending…" : "Send the batch"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-1.5 h-11 w-full rounded-xl text-[13.5px] font-semibold text-content/85"
        >
          Keep scanning
        </button>

        <p className="mt-2 text-center text-[11px] leading-relaxed text-brand_slate/85">
          Writes the file for your tag printer to pick up. Nothing here changes a
          price.
        </p>
      </div>
    </div>
  );
};

export default SendSheet;
