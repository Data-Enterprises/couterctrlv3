import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { normalizeUpc } from "../../../components-dev/scanner";
import {
  beginEdit,
  removeRow,
  replaceRow,
  type ScanRow,
} from "../../../features/dev/devUpcScannerSlice";

/**
 * What has been scanned, newest first, with any row correctable in place.
 *
 * The note under each code is the only check on a misread, and it is read as a
 * confirmation rather than a verdict: a name means the digits are right, and no
 * name means nothing either way. That is why nothing here is graded or
 * coloured. The lookup is a sales query, so an item that has never rung has no
 * name to return — and a brand new item is exactly what gets a new shelf tag.
 * A red row on every new item would train the clerk to ignore the one signal
 * that matters.
 */

/** The note under the code, for each thing the lookup can tell us. */
const noteFor = (row: ScanRow): string => {
  if (row.status === "named") return row.description ?? "";
  if (row.status === "pending") return "Looking up…";
  if (row.status === "error") return "Couldn't check this one";
  return "No sales on record — unverified";
};

const ENTERABLE = /^\d{8,14}$/;

const EditRow = ({ row }: { row: ScanRow }) => {
  const dispatch = useAppDispatch();
  const [draft, setDraft] = useState(row.raw);

  // A re-scan while this row is open replaces what is being corrected, which
  // is the fastest fix there is: open the bad row, point at the tag, pull.
  useEffect(() => setDraft(row.raw), [row.raw]);

  const save = () => {
    const next = draft.trim();
    if (!ENTERABLE.test(next)) return;
    dispatch(
      replaceRow({
        raw: row.raw,
        nextRaw: next,
        nextCode: normalizeUpc(next),
        at: Date.now(),
      }),
    );
  };

  return (
    <div className="border-b border-gray-100 bg-brand_paper px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-wide text-brand_slate/85">
          Fix this code
        </span>
        <button
          type="button"
          onClick={() => dispatch(beginEdit(null))}
          className="font-mono text-[9.5px] uppercase tracking-wide text-content/85 underline"
        >
          Cancel
        </button>
      </div>
      <input
        autoFocus
        type="text"
        inputMode="numeric"
        value={draft}
        aria-label="Correct this UPC"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
        className="basic-input bg-custom-white mt-1.5 h-11 font-mono text-[17px] font-semibold tracking-wider"
      />
      <p className="mt-1.5 text-[11px] text-content/85">
        Re-scan the tag to replace it, or type the digits off the package.
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => dispatch(removeRow(row.raw))}
          className="h-11 flex-1 rounded-lg border border-brand_danger_line text-[13px] font-semibold text-brand_danger"
        >
          Drop it
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!ENTERABLE.test(draft.trim()) || draft.trim() === row.raw}
          className="h-11 flex-1 rounded-lg bg-brand_navy text-[13px] font-semibold text-custom-white disabled:bg-brand_navy/20 disabled:text-content/40"
        >
          Save
        </button>
      </div>
    </div>
  );
};

const BatchList = () => {
  const dispatch = useAppDispatch();
  const { rows, editing } = useAppSelector((s) => s.dev.upcScanner);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-3 pb-2 pt-2.5">
        <span className="font-mono text-[9.5px] uppercase tracking-wide text-brand_slate/85">
          In this batch
        </span>
        <span className="font-mono text-[9.5px] uppercase tracking-wide text-brand_slate/85">
          {rows.length ? "Newest first" : "Nothing yet"}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-7 py-6 text-center">
            <div className="font-display text-[14px] font-bold text-content/85">
              Nothing scanned yet
            </div>
            <p className="text-[11.5px] text-content/85">
              Scan a shelf tag and it lands here with the item name beside it.
              Fix anything that looks wrong, then send the batch for tags.
            </p>
          </div>
        ) : (
          rows.map((row) =>
            editing === row.raw ? (
              <EditRow key={row.raw} row={row} />
            ) : (
              <div
                key={row.raw}
                className="flex items-center gap-2 border-b border-gray-100 px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => dispatch(beginEdit(row.raw))}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="font-mono text-[13.5px] font-semibold tracking-wider text-content/85">
                    {row.raw}
                  </div>
                  <div className="truncate text-[11px] font-medium text-brand_slate/85">
                    {noteFor(row)}
                  </div>
                </button>
                {row.repeatedAt !== undefined && (
                  <span className="shrink-0 rounded bg-brand_navy/[0.09] px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wide text-brand_navy">
                    Already in
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`Remove ${row.raw} from the batch`}
                  onClick={() => dispatch(removeRow(row.raw))}
                  className="-my-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-brand_slate/85"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ),
          )
        )}
      </div>
    </section>
  );
};

export default BatchList;
