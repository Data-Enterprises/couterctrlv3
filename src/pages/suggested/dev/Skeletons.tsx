/**
 * Loading states shaped like the thing that is arriving.
 *
 * The page used to drop `LoadingIndicator` into whichever panel was waiting.
 * Two problems with that. It is `position: absolute; inset: 0` with no
 * positioned ancestor in the store tree, so it escaped the panel and floated in
 * the middle of the page — a pill that said "Loading stores" nowhere near the
 * store list. And even contained it is a badge over blank space: it says
 * something is happening, not what, and it appeared alongside "Select a store",
 * so the panel told the reader to pick from a list that did not exist yet.
 *
 * These draw the shape of the incoming content instead. The columns line up
 * with the real ones, so the panel does not jump when the data lands, and
 * nobody has to read a label to know what is on its way.
 */

/** One shimmering bar. Widths vary per row so the block reads as a list of
 *  different names rather than a striped placeholder. */
const Bar = ({ w = "100%" }: { w?: string }) => (
  <div
    className="h-3 rounded bg-gray-200 animate-pulse"
    style={{ width: w }}
    aria-hidden
  />
);

/** Deterministic per-index widths — random ones would reshuffle on every
 *  render and make the block flicker while it waits. */
const NAME_W = ["78%", "62%", "85%", "55%", "72%", "68%", "90%", "60%"];

const STORE_COLS = "grid-cols-[1fr_56px_72px_32px]";

/** The store tree, mid-load. Mirrors the real row grid and its `py-3`. */
export const StoreListSkeleton = ({ rows = 8 }: { rows?: number }) => (
  <div
    className="flex-1 overflow-hidden"
    role="status"
    aria-label="Loading stores"
  >
    <div className={`grid ${STORE_COLS} gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-content/85`}>
      <div>Store</div>
      <div className="text-center">Items</div>
      <div className="text-right">Order lb</div>
      <div />
    </div>
    {Array.from({ length: rows }, (_, i) => (
      <div
        key={i}
        className={`grid ${STORE_COLS} items-center gap-2 px-3 py-3 border-b border-[#1e2a4a]/10`}
      >
        <Bar w={NAME_W[i % NAME_W.length]} />
        <div className="flex justify-center">
          <Bar w="60%" />
        </div>
        <div className="flex justify-end">
          <Bar w="70%" />
        </div>
        <div />
      </div>
    ))}
  </div>
);

/**
 * The right panel while a store's items are on the way.
 *
 * Keeps a band where the KPI tiles will be so the table does not slide up the
 * moment they render, then rows in the item grid's proportions.
 */
export const SheetSkeleton = ({ rows = 12 }: { rows?: number }) => (
  <div className="flex-1 overflow-hidden" role="status" aria-label="Loading the sheet">
    <div className="grid grid-cols-5 border-b border-gray-100 bg-gray-50">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="px-6 py-3 border-r border-gray-100 last:border-r-0 flex flex-col items-center gap-1.5"
        >
          <Bar w="55%" />
          <Bar w="75%" />
        </div>
      ))}
    </div>
    {Array.from({ length: rows }, (_, i) => (
      <div
        key={i}
        className="grid grid-cols-[1fr_128px_110px_130px] items-center gap-3 px-3 py-2.5 border-b border-[#1e2a4a]/10"
      >
        <Bar w={NAME_W[i % NAME_W.length]} />
        <Bar w="80%" />
        <div className="flex justify-end">
          <Bar w="60%" />
        </div>
        <div className="flex justify-end">
          <Bar w="70%" />
        </div>
      </div>
    ))}
  </div>
);
