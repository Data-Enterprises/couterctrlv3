// Hooks
import { useItemAnalysis } from "./hooks";

// Interfaces
import type { InvoiceCostState, ProductSummary } from "../interfaces";
import type { ActualFetchState } from "../../../../hooks/useActualPricePoints";
import type { PricePointsState } from "../../../../hooks/usePricePoints";

// Components
import { InformationCircleIcon } from "@heroicons/react/20/solid";
import ItemKpiStrip from "./components/ItemKpiStrip";
import SuggestionBand from "./components/SuggestionBand";
import PatternNote from "./components/PatternNote";
import EstimatedColumn from "./components/EstimatedColumn";
import ActualColumn from "./components/ActualColumn";

interface ItemAnalysisPanelProps {
  product: ProductSummary;
  /** The price table, for whichever item `prices.upc` names. */
  prices: PricePointsState;
  /** The item's receipt lines, read only once a price is opened. */
  receipts: ActualFetchState;
  onLoadReceipts: () => void;
  /** The latest invoice cost lookup for the item on screen. */
  invoice: InvoiceCostState;
}

/**
 * One item, read two ways, and only one gets a vote. Estimated (left) is from
 * daily roll-ups; actual (right) is `cashiers/price_points`, every receipt
 * line bucketed on the server. A price on the left with no counterpart on the
 * right never existed.
 *
 * The suggestion reads the **actual** side only: estimated divides a day's
 * dollars by its units, giving prices nobody was charged. The actual side
 * keeps its full height while it loads.
 */
const ItemAnalysisPanel = ({
  product,
  prices,
  receipts,
  onLoadReceipts,
  invoice,
}: ItemAnalysisPanelProps) => {
  const {
    isCurrent,
    receiptsHere,
    cost,
    estimated,
    act,
    pattern,
    suggestion,
    withheld,
    linesFor,
    totals,
  } = useItemAnalysis(product, prices, receipts, invoice);

  // The panel's loading and error states are the price table's. The receipts
  // only ever load under an opened row, and say so there.
  const actual = prices;
  const showPattern = isCurrent && !actual.loading && !actual.error;

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="cc-panel shadow-sm h-full">
        <div className="flex-shrink-0 px-4 py-[10px] bg-brand_navy">
          <div className="text-[14px] cc-navy-title leading-tight truncate">
            {product.description}
          </div>
          <div className="text-[11px] mt-0.5 text-custom-white truncate">
            {product.productCode}
          </div>
        </div>

        <ItemKpiStrip
          totals={totals}
          costNote={
            cost.source === "invoice" && cost.invoice
              ? `invoice ${cost.invoice.date.slice(5).replace("-", "/")}`
              : invoice.loading && invoice.upc === product.productCode
                ? "checking invoices…"
                : "item file"
          }
          transLoading={actual.loading && isCurrent}
        />

        {/* The page's headline now that its job is optimisation. Sits above the
            pattern line because it's the answer; the pattern is the caveat. */}
        {withheld && (
          <div className="px-4 pt-3 flex-shrink-0">
            <div className="rounded-lg border border-line_field bg-fill_soft px-3 py-2 flex gap-2 items-start">
              <InformationCircleIcon className="w-4 h-4 text-content/95 flex-shrink-0 mt-px" />
              <p className="text-[13px] text-content leading-snug">
                {withheld}
              </p>
            </div>
          </div>
        )}

        {suggestion && <SuggestionBand suggestion={suggestion} />}

        {showPattern && <PatternNote pattern={pattern} />}

        <div className="flex-1 min-h-0 grid grid-cols-2 divide-x divide-line_hair overflow-hidden">
          <EstimatedColumn estimated={estimated} />
          <ActualColumn
            isCurrent={isCurrent}
            loading={actual.loading}
            error={actual.error}
            act={act}
            bestPoint={suggestion?.best.point}
            linesFor={linesFor}
            receiptsLoading={receiptsHere && receipts.loading}
            receiptsError={receiptsHere ? receipts.error : null}
            onOpenReceipts={onLoadReceipts}
          />
        </div>
      </div>
    </div>
  );
};

export default ItemAnalysisPanel;
