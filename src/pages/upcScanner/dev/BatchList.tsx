import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { normalizeUpc } from "../../../components-dev/scanner";
import {
  beginEdit,
  removeRow,
  replaceRow,
  retryRow,
  type ScanRow,
} from "../../../features/dev/devUpcScannerSlice";
import { isEnterableUpc } from "./upcEntry";

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
  if (row.status === "pending") return "Checking…";
  if (row.status === "error") return "Couldn't check";
  return "No item name";
};

const EditRow = ({ row }: { row: ScanRow }) => {
  const dispatch = useAppDispatch();
  const [draft, setDraft] = useState(row.raw);

  // A re-scan while this row is open replaces what is being corrected, which
  // is the fastest fix there is: open the bad row, point at the tag, pull.
  useEffect(() => setDraft(row.raw), [row.raw]);

  const save = () => {
    const next = draft.trim();
    if (!isEnterableUpc(next)) return;
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
      <div className="text-[14px] font-bold text-content">Fix this code</div>
      <input
        autoFocus
        type="text"
        inputMode="numeric"
        value={draft}
        aria-label="Correct this UPC"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
        className="basic-input bg-custom-white mt-2 h-14 font-mono text-[19px] font-semibold tracking-wider text-content"
      />
      <p className="mt-1.5 text-[14px] text-content">Or re-scan the tag to replace it.</p>
      {/* Three across, all full-height: on a handheld every one of these has to
          be comfortably hittable, which the old corner Cancel was not. */}
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={() => dispatch(beginEdit(null))}
          className="h-12 flex-1 rounded-lg border border-brand_line_2 text-[15px] font-bold text-content"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => dispatch(removeRow(row.raw))}
          className="h-12 flex-1 rounded-lg border border-brand_danger_line text-[15px] font-bold text-brand_danger"
        >
          Remove
        </button>
        {row.status === "error" && draft.trim() === row.raw ? (
          // Nothing is wrong with the code — the lookup just never answered —
          // so the useful action is asking again, not retyping digits that are
          // probably already right.
          <button
            type="button"
            onClick={() => dispatch(retryRow(row.raw))}
            className="h-12 flex-1 rounded-lg bg-brand_navy text-[15px] font-bold text-custom-white"
          >
            Check again
          </button>
        ) : (
          <button
            type="button"
            onClick={save}
            disabled={!isEnterableUpc(draft) || draft.trim() === row.raw}
            className="h-12 flex-1 rounded-lg bg-brand_navy text-[15px] font-bold text-custom-white disabled:bg-brand_navy/20 disabled:text-content/40"
          >
            Save
          </button>
        )}
      </div>
    </div>
  );
};

const BatchList = () => {
  const dispatch = useAppDispatch();
  const { rows, editing } = useAppSelector((s) => s.dev.upcScanner);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
      <div>
        {rows.length === 0 ? (
          <div className="px-5 py-7 text-center">
            <div className="font-display text-[16px] font-bold text-content">
              Scanned items land here
            </div>
            <p className="mt-1 text-[14px] text-content">Modify or remove from here.</p>
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
                {/* The item's name leads. It is what the clerk is checking
                    against the shelf in front of them; the digits are only
                    there to be corrected, so they sit underneath. */}
                <button
                  type="button"
                  onClick={() => dispatch(beginEdit(row.raw))}
                  className="min-w-0 flex-1 py-0.5 text-left"
                >
                  <div className="flex items-center gap-2">
                    {row.status === "pending" && (
                      // Same inline spinner the rest of the dev tree uses.
                      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brand_line_2 border-t-brand_navy" />
                    )}
                    <span className="truncate text-[16px] font-semibold text-content">
                      {noteFor(row)}
                    </span>
                  </div>
                  <div className="mt-0.5 font-mono text-[13px] tracking-wider text-brand_slate">
                    {row.raw}
                  </div>
                </button>
                {row.repeatedAt !== undefined && (
                  <span className="shrink-0 rounded bg-brand_navy/[0.09] px-2 py-1 text-[12px] font-bold text-brand_navy">
                    Already in
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`Remove ${row.raw} from the batch`}
                  onClick={() => dispatch(removeRow(row.raw))}
                  className="-my-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-brand_slate/95"
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
