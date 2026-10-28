import type { UpdateFileResp } from "../../../../interfaces";

interface Props {
  receipt: UpdateFileResp | null;
  /** How many order files the Submit sent. */
  orderCount: number;
  editedCount: number;
  addedCount: number;
  onClose: () => void;
  onEditAgain: () => void;
}

/**
 * What came back from a submission.
 *
 * Laid over the grid rather than beside it, the same way the investigation
 * rail is: taking its width out of the row would reflow every column
 * underneath, so the lines a reader was looking at move the moment the panel
 * opens.
 *
 * It says submitted, not saved, because that is what happened — the file is in
 * the import bucket and the `orders` table still holds the old figures. The
 * page does not refetch afterwards for the same reason: `all_orders` would
 * hand back exactly what was there before the edit and look like the save had
 * been thrown away.
 */
const SubmitReceipt = ({
  receipt,
  orderCount,
  editedCount,
  addedCount,
  onClose,
  onEditAgain,
}: Props) => (
  <div
    className={`absolute top-0 right-0 bottom-0 z-40 w-[400px] max-w-full bg-custom-white shadow-rail transition-transform duration-200 ease-out motion-reduce:transition-none flex flex-col ${
      receipt ? "translate-x-0" : "translate-x-full"
    }`}
  >
    <div className="bg-brand_navy px-3 pt-2 pb-2.5 flex-shrink-0 flex items-center gap-2">
      <span className="text-custom-white font-medium text-[13px] flex-1">
        Submission
      </span>
      <button
        onClick={onClose}
        className="rounded-md border border-custom-white/30 px-2 py-0.5 text-[11.5px] font-semibold text-custom-white/95 transition-colors hover:bg-custom-white/10"
      >
        Close
      </button>
    </div>

    {receipt && (
      <div className="flex-1 min-h-0 overflow-auto thin-scrollbar p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[15.5px] font-bold text-content">
            {orderCount > 1
              ? `${orderCount} order updates submitted`
              : "Order update submitted"}
          </span>
          <span className="text-[12px] leading-snug text-content">
            Changes appear in the grid after the next provider import. Loading
            the order again before then still shows the old figures.
          </span>
        </div>

        <div className="rounded-lg bg-severity_watch_bg px-3 py-2 text-[11.5px] leading-snug text-severity_watch_text">
          <span className="font-bold">Not a save.</span> The file is in the
          import bucket, not in the <span className="font-mono">orders</span>{" "}
          table. Nothing has been written over yet.
        </div>

        <div className="flex flex-col gap-1.5">
          {orderCount > 1 && (
            <Row label="Orders sent" value={orderCount.toLocaleString()} />
          )}
          <Row label="Bucket" value={receipt.bucket} />
          <Row
            label={orderCount > 1 ? "Last key" : "Key"}
            value={receipt.key}
          />
          <Row
            label={orderCount > 1 ? "Lines in last file" : "Lines sent"}
            value={receipt.line_count.toLocaleString()}
          />
          <Row label="Of those, edited" value={String(editedCount)} />
          <Row label="Of those, new" value={String(addedCount)} />
          <Row label="Logged" value={receipt.logged ? "true" : "false"} />
        </div>

        <p className="rounded-lg border border-brand_line bg-bkg px-3 py-2 text-[11.5px] leading-snug text-content">
          The key is the handle for tracing this submission in{" "}
          <span className="font-mono">table_update_log</span>.
          {!receipt.logged && (
            <>
              {" "}
              This one came back <span className="font-mono">logged: false</span>{" "}
              — the audit insert failed, which is independent of the drop. The
              file still landed.
            </>
          )}
        </p>

        <button
          onClick={onEditAgain}
          className="self-start rounded-full border border-content/20 px-3 py-1 text-[11.5px] font-semibold text-content transition-colors hover:border-content/35"
        >
          Edit the order again
        </button>
      </div>
    )}
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-brand_line pb-1">
    <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide text-content">
      {label}
    </span>
    <span className="font-mono text-[11px] text-right text-content break-all">
      {value}
    </span>
  </div>
);

export default SubmitReceipt;
