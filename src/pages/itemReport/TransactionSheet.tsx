import { useEffect, useMemo, useState } from "react";
import { XMarkIcon, ArrowLeftIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../components/modals/ResizableModalShell";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import { useAppSelector } from "../../hooks";
import { getTransactionList } from "../../api/lossPrevention";
import { fetchAllPages } from "../../utils/paging";
import { formatCurrency2, formatDateSimple } from "../../utils";
import { ACTION_TONE } from "./actionTone";
import type { ActionKind } from "./itemReportMetrics";
import type { TransactionListItem } from "../../interfaces";

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

interface Props {
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
 * The receipt number a person would read off a till roll.
 *
 * `transaction_id` comes back empty on `transaction_list` — the identifier that
 * is actually populated is `sale_id`, a composite whose second segment is the
 * transaction number. Cashier Sales already derives it exactly this way; this
 * is that same derivation rather than a second guess at it.
 */
const saleNumber = (saleId: string): string =>
  saleId.split("-")[1] || saleId || "—";

const cell = "text-[12px] font-medium text-content truncate";
const num = `${cell} text-right tabular-nums`;

/** No Qty column: `exact` price points are single-unit rings by definition, so
 *  it could only ever read 1. The space goes to the two fields that explain the
 *  ring instead — who put it through, and under what price type. */
const LIST_COLS = "84px 92px 62px 1fr 82px 44px 72px";
const BASKET_COLS = "1fr 92px 48px 72px 76px";

const TransactionSheet = ({
  productCode,
  itemDescription,
  price,
  lines,
  action,
  onClose,
}: Props) => {
  const { url, token } = useAppSelector((s) => s.app);
  const [openSale, setOpenSale] = useState<TransactionListItem | null>(null);
  const [basket, setBasket] = useState<TransactionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!openSale) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getTransactionList(url, token, [openSale.sale_id], 1, "Sale")
      .then(async (resp) => {
        const body = resp.data;
        if (body.error !== 0) throw new Error(body.msg ?? "Could not load it");
        return fetchAllPages(
          body,
          (body.transactions ?? []) as TransactionListItem[],
          async (page) => {
            try {
              const r = await getTransactionList(
                url,
                token,
                [openSale.sale_id],
                page,
                "Sale",
              );
              return r.data.error === 0 ? r.data.transactions : [];
            } catch {
              return [];
            }
          },
        );
      })
      .then((all) => {
        if (cancelled) return;
        // Line order, so the modal reads like the receipt it represents.
        setBasket([...all].sort((a, b) => a.line_number - b.line_number));
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : "Could not load that transaction",
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [openSale, url, token]);

  const inBasket = openSale !== null;
  const basketTotal = basket.reduce((s, l) => s + l.net_sales, 0);

  /**
   * One row per product, not per scan.
   *
   * The register writes a line per scan, so four of the same six-pack is four
   * identical rows — twelve lines of a basket that only holds five things. The
   * repetition tells you nothing the quantity doesn't say better, and it costs
   * the modal most of its height.
   *
   * Price type is kept as a set rather than a first-wins value. Two scans of the
   * same item at different price types is a genuine finding — exactly the kind
   * of thing this view exists to catch — and collapsing it to whichever came
   * first would erase it.
   */
  /**
   * One row per transaction, not per scan — the same repetition the basket had.
   * An item rung four times in one sale was four rows here, all carrying the
   * same receipt number, which reads like four separate customers.
   *
   * Quantity and net are summed so a row says what that customer actually took
   * and paid, which is the question the list is for.
   */
  const sales = useMemo(() => {
    const bySale = new Map<
      string,
      {
        sale: TransactionListItem;
        qty: number;
        net: number;
        priceTypes: Set<string>;
      }
    >();
    for (const l of lines) {
      const found = bySale.get(l.sale_id);
      const q = l.qty ?? 1;
      if (found) {
        found.qty += q;
        found.net += l.net_sales;
        found.priceTypes.add(l.price_type);
      } else {
        bySale.set(l.sale_id, {
          sale: l,
          qty: q,
          net: l.net_sales,
          priceTypes: new Set([l.price_type]),
        });
      }
    }
    return [...bySale.values()].sort((a, b) =>
      a.sale.sale_date.localeCompare(b.sale.sale_date),
    );
  }, [lines]);

  const soldUnits = sales.reduce((s, r) => s + r.qty, 0);

  const grouped = useMemo(() => {
    const byCode = new Map<
      string,
      {
        code: string;
        description: string;
        qty: number;
        net: number;
        coupon: number;
        priceTypes: Set<string>;
        firstLine: number;
      }
    >();
    for (const l of basket) {
      const code = String(l.product_code);
      const found = byCode.get(code);
      // `qty` is optional on the line; a scan with none is one unit.
      const q = l.qty ?? 1;
      if (found) {
        found.qty += q;
        found.net += l.net_sales;
        found.coupon += l.coupon_amount;
        found.priceTypes.add(l.price_type);
      } else {
        byCode.set(code, {
          code,
          description: l.product_description,
          qty: q,
          net: l.net_sales,
          coupon: l.coupon_amount,
          priceTypes: new Set([l.price_type]),
          firstLine: l.line_number,
        });
      }
    }
    // Kept in the order the register rang them, so it still reads like the
    // receipt it represents.
    return [...byCode.values()].sort((a, b) => a.firstLine - b.firstLine);
  }, [basket]);

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="item-report:transaction-sheet"
      defaultWidth={760}
      defaultHeight={600}
    >
      <div className="bg-[#1e2a4a] px-4 py-2.5 flex-shrink-0 flex items-center gap-2.5">
        {inBasket && (
          <button
            onClick={() => setOpenSale(null)}
            className="text-custom-white/85 hover:text-custom-white transition-colors flex-shrink-0"
            aria-label="Back to the list"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
        )}
        <div className="min-w-0">
          <p className="text-custom-white text-[13px] font-semibold truncate">
            {inBasket
              ? `Transaction ${saleNumber(openSale.sale_id)}`
              : `${soldUnits} sold at ${formatCurrency2(price)} · ${sales.length} transaction${
                  sales.length === 1 ? "" : "s"
                }`}
          </p>
          <p className="text-custom-white/85 text-[12px] truncate">
            {inBasket
              ? `${formatDateSimple(openSale.sale_date)} · terminal ${openSale.terminal} · ${openSale.cashier_name}`
              : `${itemDescription} · ${productCode}`}
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="text-custom-white/85 hover:text-custom-white transition-colors flex-shrink-0"
          aria-label="Close"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
        {inBasket && loading ? (
          <div className="relative h-full min-h-[240px]">
            <LoadingIndicator message="Opening transaction" />
          </div>
        ) : inBasket && error ? (
          <div className="px-4 py-6 text-[12px] text-content">{error}</div>
        ) : inBasket ? (
          <>
            <div
              className="sticky top-0 z-10 grid gap-3 px-4 py-1.5 border-b border-gray-100 bg-gray-50 text-[11.5px] font-semibold uppercase tracking-wide text-content/85"
              style={{ gridTemplateColumns: BASKET_COLS }}
            >
              <span>Item</span>
              <span>Price type</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit</span>
              <span className="text-right">Net</span>
            </div>
            {grouped.map((l, i) => {
              const isItem = l.code === productCode;
              // Applied per cell, not inherited — every cell sets its own
              // `text-content`, which would win over anything on the row.
              const ink =
                isItem && action ? ACTION_TONE[action].text : "text-content";
              return (
                <div
                  key={l.code}
                  className={`grid gap-3 px-4 py-2 items-center border-b border-gray-100 ${
                    // The line you came for, marked among the rest of the
                    // basket — that contrast is the whole point of the view,
                    // and it wears the action's colour so it matches the chip
                    // on the sheet behind.
                    isItem
                      ? action
                        ? ACTION_TONE[action].row
                        : "bg-gray-100"
                      : i % 2 === 1
                        ? "bg-row_stripe"
                        : ""
                  }`}
                  style={{ gridTemplateColumns: BASKET_COLS }}
                >
                  <div className="min-w-0">
                    <div className={`text-[13px] font-medium truncate ${ink}`}>
                      {l.description}
                    </div>
                    <div
                      className={`text-[12px] font-medium truncate ${
                        isItem ? ink : "text-content/85"
                      }`}
                    >
                      {l.code}
                      {l.coupon > 0 && ` · ${formatCurrency2(l.coupon)} coupon`}
                      {isItem && " · this item"}
                    </div>
                  </div>
                  {/* Every price type this item rang under. More than one is
                      worth seeing, so they are joined rather than reduced. */}
                  <span className={`${cell} ${ink}`}>
                    {[...l.priceTypes].join(" · ")}
                  </span>
                  <span className={`${num} ${ink}`}>{l.qty}</span>
                  {/* Per unit, because with quantity aggregated the line total
                      no longer says what anything actually rang at — and the
                      unit price is what you compare against the price row you
                      arrived from. */}
                  <span className={`${num} ${ink}`}>
                    {l.qty > 0 ? formatCurrency2(l.net / l.qty) : "—"}
                  </span>
                  <span className={`${num} ${ink}`}>
                    {formatCurrency2(l.net)}
                  </span>
                </div>
              );
            })}
            {grouped.length > 0 && (
              <div className="px-4 py-2 text-[12px] font-medium text-content flex items-center justify-between">
                <span>
                  {grouped.length} item{grouped.length === 1 ? "" : "s"} ·{" "}
                  {basket.length} line{basket.length === 1 ? "" : "s"}
                </span>
                <span className="tabular-nums">
                  {formatCurrency2(basketTotal)}
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            <div
              className="sticky top-0 z-10 grid gap-3 px-4 py-1.5 border-b border-gray-100 bg-gray-50 text-[11.5px] font-semibold uppercase tracking-wide text-content/85"
              style={{ gridTemplateColumns: LIST_COLS }}
            >
              <span>Transaction</span>
              <span>Date</span>
              <span>Terminal</span>
              <span>Cashier</span>
              <span>Price type</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Net</span>
            </div>
            {sales.map((r, i) => (
              <div
                key={r.sale.sale_id}
                onClick={() => setOpenSale(r.sale)}
                className={`grid gap-3 px-4 py-2 items-center border-b border-gray-100 cursor-pointer hover:bg-[#1e2a4a]/[0.06] ${
                  i % 2 === 1 ? "bg-row_stripe" : ""
                }`}
                style={{ gridTemplateColumns: LIST_COLS }}
              >
                <span className="text-[12px] font-medium text-[#1e2a4a] underline underline-offset-2 truncate">
                  {saleNumber(r.sale.sale_id)}
                </span>
                <span className={cell}>
                  {formatDateSimple(r.sale.sale_date)}
                </span>
                <span className={cell}>{r.sale.terminal}</span>
                <span className={cell}>{r.sale.cashier_name}</span>
                {/* Why it rang at this price. `TPR` is a planned promotion and
                    needs no action; `Regular` at a promotional price is the
                    shelf being wrong, which is the whole reason to look. */}
                <span className={cell}>{[...r.priceTypes].join(" · ")}</span>
                <span className={num}>{r.qty}</span>
                <span className={num}>{formatCurrency2(r.net)}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </ResizableModalShell>
  );
};

export default TransactionSheet;
