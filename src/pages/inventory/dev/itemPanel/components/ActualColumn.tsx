// Interfaces
import type {
  ActualPricePoint,
  linesAtPrice,
  pricePointsFromServer,
} from "../../../../../utils/pricePoints";

// Components
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import ActualPriceRow from "./ActualPriceRow";
import ActualTableHead from "./ActualTableHead";

interface ActualColumnProps {
  /** The price read belongs to the item on screen. */
  isCurrent: boolean;
  loading: boolean;
  error: string | null;
  act: ReturnType<typeof pricePointsFromServer>;
  /** The price the suggestion names, highlighted in its table. */
  bestPoint: ActualPricePoint | undefined;
  linesFor: (
    p: ActualPricePoint,
    averaged: boolean,
  ) => ReturnType<typeof linesAtPrice> | null;
  receiptsLoading: boolean;
  receiptsError: string | null;
  onOpenReceipts: () => void;
}

/** The right column: what the registers actually charged, exact prices and
 *  averaged multi-unit rings, each price opening to its receipts. It holds
 *  its height whatever state it's in. */
const ActualColumn = ({
  isCurrent,
  loading,
  error,
  act,
  bestPoint,
  linesFor,
  receiptsLoading,
  receiptsError,
  onOpenReceipts,
}: ActualColumnProps) => (
  <div
    data-help="actual"
    className="min-h-0 overflow-y-auto thin-scrollbar px-4 py-3"
  >
    <div className="flex items-baseline gap-2 mb-2">
      {/* Paired with "Daily average" so the two headers contrast on
          the thing that matters: one is worked out, this one happened. */}
      <span className="text-[12px] font-semibold text-content">
        Actually charged
      </span>
      {isCurrent && !loading && act.exactCount > 0 && (
        <span className="text-[11px] px-1.5 py-px rounded bg-brand_navy/[0.06] text-brand_navy">
          {act.isWeighted ? "$/lb" : "Exact"} · {act.exactCount} trans
        </span>
      )}
    </div>

    {loading && isCurrent && (
      <div className="py-6 text-center text-[12.5px] text-content/95">
        Reading registers…
      </div>
    )}

    {isCurrent && error && (
      <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-severity_watch_bg">
        <ExclamationTriangleIcon className="w-4 h-4 text-severity_watch_text flex-shrink-0 mt-px" />
        <span className="text-[12.5px] text-severity_watch_text">{error}</span>
      </div>
    )}

    {isCurrent && !loading && !error && (
      <>
        {act.exact.length === 0 && act.averaged.length === 0 && (
          <div className="py-6 text-center text-[12.5px] text-content/95">
            No register lines matched this item
          </div>
        )}

        {act.exact.length > 0 && (
          <>
            <ActualTableHead priceLabel={act.isWeighted ? "$/lb" : "Price"} />
            {act.exact.map((p) => (
              <ActualPriceRow
                key={`e-${p.price}-${p.priceType}`}
                point={p}
                // The band names a price; this is that price in the
                // table. Without the tie the reader has to scan for it.
                isBest={p === bestPoint}
                lines={linesFor(p, false)}
                receiptsLoading={receiptsLoading}
                receiptsError={receiptsError}
                onOpen={onOpenReceipts}
              />
            ))}
          </>
        )}

        {act.averaged.length > 0 && (
          <>
            <div className="mt-3 mb-1">
              <span className="text-[11px] px-1.5 py-px rounded bg-fill_muted text-content">
                Avg · {act.averagedCount} trans
              </span>
            </div>
            <ActualTableHead priceLabel="Price" />
            {/* Never highlighted: a multi-unit ring divided by its
                quantity is derived, and the suggestion only names
                prices customers were charged. */}
            {act.averaged.map((p) => (
              <ActualPriceRow
                key={`a-${p.price}-${p.priceType}`}
                point={p}
                lines={linesFor(p, true)}
                receiptsLoading={receiptsLoading}
                receiptsError={receiptsError}
                onOpen={onOpenReceipts}
              />
            ))}
          </>
        )}
      </>
    )}
  </div>
);

export default ActualColumn;
