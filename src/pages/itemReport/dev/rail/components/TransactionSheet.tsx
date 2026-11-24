// Hooks
import { useMemo, useState } from "react";
import { useBasket } from "../hooks";

// Utils
import { formatCurrency2, formatDateSimple } from "../../../../../utils";
import { saleNumber } from "../utils";
import { groupSales } from "../utils/basket";

// Interfaces
import type { TransactionListItem } from "../../../../../interfaces";
import type { ActionKind } from "../../interfaces";

// Components
import { XMarkIcon, ArrowLeftIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../../../components-dev/modals/ResizableModalShell";
import LoadingIndicator from "../../../../../components-dev/loading/LoadingIndicator";
import SaleList from "./SaleList";
import BasketTable from "./BasketTable";

interface TransactionSheetProps {
  /** The item whose price row was clicked. */
  productCode: string;
  itemDescription: string;
  price: number;
  /** That item's own register lines at this price — already in hand. */
  lines: TransactionListItem[];
  /** The item's suggested action, so its line in a basket wears the same colour
   *  as its chip on the sheet. Undefined until the walk has decided one. */
  action?: ActionKind;
  onClose: () => void;
}

/**
 * The sales behind one price, and the basket behind one sale.
 *
 * Two views in one modal rather than two levels in the rail. The panel is a
 * third of the page and already stacks four sections; a price that rang fifty
 * times would stretch it past usefulness, where a modal simply scrolls.
 *
 * The basket is fetched when it is opened, not held in advance. The register
 * walk covers up to 400 receipts, and keeping every line of all of them so one
 * might be viewed would be a great deal of memory against a small chance of
 * being read. One receipt is one small call.
 *
 * Why the basket matters at all: an item ringing at the wrong price is one
 * story, and an item ringing at the wrong price *only when it is scanned with
 * something else* is a different one. Nothing else on the page can separate
 * them.
 */
const TransactionSheet = ({
  productCode,
  itemDescription,
  price,
  lines,
  action,
  onClose,
}: TransactionSheetProps) => {
  const [openSale, setOpenSale] = useState<TransactionListItem | null>(null);
  const { basket, loading, error } = useBasket(openSale);
  const inBasket = openSale !== null;
  const sales = useMemo(() => groupSales(lines), [lines]);
  const soldUnits = sales.reduce((s, r) => s + r.qty, 0);

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="item-report:transaction-sheet"
      defaultWidth={760}
      defaultHeight={600}
    >
      <div className="bg-brand_navy px-4 py-2.5 flex-shrink-0 flex items-center gap-2.5">
        {inBasket && (
          <button
            onClick={() => setOpenSale(null)}
            className="cc-navy-link flex-shrink-0"
            aria-label="Back to the list"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
        )}
        <div className="min-w-0">
          <p className="cc-navy-title text-[13px] truncate">
            {inBasket
              ? `Transaction ${saleNumber(openSale.sale_id)}`
              : `${soldUnits} sold at ${formatCurrency2(price)} · ${sales.length} transaction${
                  sales.length === 1 ? "" : "s"
                }`}
          </p>
          <p className="text-custom-white/95 text-[12px] truncate">
            {inBasket
              ? `${formatDateSimple(openSale.sale_date)} · terminal ${openSale.terminal} · ${openSale.cashier_name}`
              : `${itemDescription} · ${productCode}`}
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="cc-navy-link flex-shrink-0"
          aria-label="Close"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="cc-scroll">
        {inBasket && loading ? (
          <div className="relative h-full min-h-[240px]">
            <LoadingIndicator message="Opening transaction" />
          </div>
        ) : inBasket && error ? (
          <div className="px-4 py-6 text-[12px] text-content">{error}</div>
        ) : inBasket ? (
          <BasketTable
            basket={basket}
            productCode={productCode}
            action={action}
          />
        ) : (
          <SaleList sales={sales} onOpen={setOpenSale} />
        )}
      </div>
    </ResizableModalShell>
  );
};

export default TransactionSheet;
