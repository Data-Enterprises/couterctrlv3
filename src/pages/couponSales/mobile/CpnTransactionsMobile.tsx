import { useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getCashierTransaction } from "../../../api/lossPrevention";
import { setTransactionDrillDown } from "../../../features/lossPreventionSlice";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import BottomSheet from "../../../components/BottomSheet";
import SevBadge from "../../../components/SevBadge";
import Transaction from "../../lossPrevention/Transaction";
import { formatCurrency2, formatBigNumber } from "../../../utils";
import type {
  CouponItem,
  JsonError,
  TransactionListItem,
} from "../../../interfaces";
import { COUPON_THRESHOLD_DEFAULT } from "../../../features/couponSalesSlice";
import {
  buildTransactions,
  couponPillClass,
  couponValueOf,
  sectionKeyOf,
  type CouponTransaction,
} from "../shared/couponGrading";
import { badgeTier } from "./couponTierUi";

/**
 * The receipts behind one section — screen three, and the end of the drill.
 *
 * Rows are graded on the flat-dollar outlier rule regardless of which metric
 * the rest of the page is on, because a single sale has no prior two weeks of
 * its own: "this receipt versus its own baseline" isn't a question that means
 * anything. The only sensible read here is whether the coupon coming off it
 * was unusually large.
 *
 * Tapping a row opens the **whole receipt** in a sheet, matching what the
 * desktop panel does. That fetch is the point of it: `coupons/` returns only
 * the coupon lines, so on its own this screen can't show what the discount was
 * actually applied against — which is the first thing anyone asks when a
 * coupon looks too big. The receipt comes from LP's endpoint and renders
 * through LP's own `Transaction` component, so a receipt looks identical
 * wherever it is opened from.
 */
interface Props {
  /** Every coupon line for the selected store, the full week. */
  storeCoupons: CouponItem[];
  storeLabel: string;
  rangeLabel: string;
  onBack: () => void;
}

const CpnTransactionsMobile = ({
  storeCoupons,
  storeLabel,
  rangeLabel,
  onBack,
}: Props) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { url, token } = useAppSelector((s) => s.app);
  const { breakdown, selectedSectionKey, threshold } = useAppSelector(
    (s) => s.couponSales,
  );
  // The receipt lands in LP's slice because it is LP's endpoint and LP's
  // renderer — duplicating it into couponSales would give the same receipt two
  // homes and no rule about which one is current.
  const receipt = useAppSelector(
    (s) => s.lossPrevention.transactionDrillDown[0] ?? null,
  );

  const [expanded, setExpanded] = useState<number | null>(null);
  const [openTx, setOpenTx] = useState<CouponTransaction | null>(null);
  const [openLine, setOpenLine] = useState<CouponItem | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const sheetCloseRef = useRef<(() => void) | null>(null);

  const activeThreshold = threshold ?? COUPON_THRESHOLD_DEFAULT;

  const sectionCoupons = useMemo(
    () =>
      selectedSectionKey === null
        ? []
        : storeCoupons.filter(
            (c) => sectionKeyOf(c, breakdown) === selectedSectionKey,
          ),
    [storeCoupons, breakdown, selectedSectionKey],
  );

  const transactions = useMemo(
    () => buildTransactions(sectionCoupons, activeThreshold),
    [sectionCoupons, activeThreshold],
  );

  // Sale id the receipt endpoint expects, assembled exactly as the desktop
  // panel assembles it: month and day are NOT zero-padded, and the date parts
  // come off the untouched ISO value rather than the display string.
  const joinedSaleId = (t: CouponTransaction) => {
    const [y, m, d] = t.rawSaleDate.split("T")[0].split("-");
    return `${t.storeid}-${t.sale_id}-${t.terminal}-${parseInt(m)}-${parseInt(d)}-${y}`;
  };

  const openReceipt = (t: CouponTransaction, line: CouponItem) => {
    setOpenTx(t);
    setOpenLine(line);
    setLoadingReceipt(true);
    dispatch(setTransactionDrillDown([]));
    getCashierTransaction(
      url,
      token,
      t.rawSaleDate.split("T")[0],
      joinedSaleId(t),
      t.storeid,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) return;
        const lines: TransactionListItem[] = [...j.transaction].map(
          (item: TransactionListItem) => ({
            ...item,
            transaction_id: item.sale_id.split("-")[1],
            qty: item.qty ? item.qty : 0,
          }),
        );
        dispatch(setTransactionDrillDown([lines]));
      })
      .catch((err: JsonError) => {
        setOpenTx(null);
        setOpenLine(null);
        toast.error("Error fetching transaction: " + err.message);
      })
      .finally(() => setLoadingReceipt(false));
  };

  const closeReceipt = () => {
    setOpenTx(null);
    setOpenLine(null);
    dispatch(setTransactionDrillDown([]));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Same inner-nav header as the breakdown screen — the subtitle names the
          section you drilled through rather than repeating the page. */}
      <div className="bg-[#1e2a4a] px-4 pt-3 pb-4 flex items-start gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          aria-label="Back to breakdown"
          className="text-custom-white/85 mt-0.5 flex-shrink-0"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <div className="text-custom-white font-semibold text-[13px] truncate">
            {storeLabel}
          </div>
          <div className="text-custom-white/85 text-[11px] truncate">
            {selectedSectionKey ?? "Transactions"} · {rangeLabel}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 bg-custom-white">
        <p className="text-[11px] text-content">
          {formatBigNumber(transactions.length, 0)} transaction
          {transactions.length === 1 ? "" : "s"} · graded against the $
          {activeThreshold} average
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pb-14 thin-scrollbar">
        {transactions.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
            No transactions
          </div>
        ) : (
          transactions.map((t) => {
            const isOpen = expanded === t.sale_id;
            return (
              <div key={t.sale_id} className="border-b border-gray-100">
                <button
                  onClick={() => setExpanded(isOpen ? null : t.sale_id)}
                  aria-expanded={isOpen}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <SevBadge sev={badgeTier(t.tier)} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-content truncate">
                        {t.cashier_name || "Unknown cashier"}
                      </div>
                      <div className="text-[11px] text-content truncate">
                        {t.sale_date} · Term {t.terminal} · #{t.sale_id}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap pl-[30px]">
                    <span
                      className={`flex items-baseline gap-1 rounded px-1.5 py-0.5 ${couponPillClass[t.tier]}`}
                    >
                      <span className="text-[11px] opacity-85">Avg</span>
                      <span className="text-[11px] font-semibold">
                        {formatCurrency2(t.avgAmount)}
                      </span>
                    </span>
                    <span className="flex items-baseline gap-1 rounded px-1.5 py-0.5 bg-gray-100 text-content">
                      <span className="text-[11px] opacity-85">Total</span>
                      <span className="text-[11px] font-semibold">
                        {formatCurrency2(t.amount)}
                      </span>
                    </span>
                    <span className="flex items-baseline gap-1 rounded px-1.5 py-0.5 bg-gray-100 text-content">
                      <span className="text-[11px] opacity-85">Coupons</span>
                      <span className="text-[11px] font-semibold">
                        {formatBigNumber(t.lines, 0)}
                      </span>
                    </span>
                    <span className="flex items-baseline gap-1 rounded px-1.5 py-0.5 bg-gray-100 text-content">
                      <span className="text-[11px] opacity-85">Qty</span>
                      <span className="text-[11px] font-semibold">
                        {formatBigNumber(t.qty, 0)}
                      </span>
                    </span>
                  </div>
                </button>

                {/* The coupon lines are already in memory, so opening them
                    costs nothing. Tapping one is what fetches the receipt —
                    the sub row says which coupon you are asking about, and
                    the sheet answers what it came off. */}
                {isOpen && (
                  <div className="bg-row_stripe">
                    {t.items.map((line, i) => (
                      <button
                        key={`${line.line_number}-${i}`}
                        onClick={() => openReceipt(t, line)}
                        className="w-full flex items-baseline gap-2 px-4 py-2 pl-[46px] text-left border-t border-gray-100 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                      >
                        <span className="text-[11px] text-content flex-1 min-w-0 truncate">
                          {line.product_description ||
                            line.product_code ||
                            "Unknown item"}
                        </span>
                        <span className="text-[11px] font-semibold text-content tabular-nums flex-shrink-0">
                          {formatCurrency2(couponValueOf(line))}
                        </span>
                        <ChevronRightIcon className="w-3.5 h-3.5 text-content/85 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Receipt sheet — the same shell and the same renderer LP's mobile
          transactions use, so the two pages can't drift on what a receipt
          looks like. */}
      {openTx && (
        <BottomSheet onClose={closeReceipt} closeRef={sheetCloseRef}>
          <div className="flex flex-col" style={{ maxHeight: "80vh" }}>
            <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100">
              <p className="text-[12px] font-semibold text-content truncate">
                {openTx.cashier_name || "Unknown cashier"} · #{openTx.sale_id}
              </p>
              <p className="text-[11px] text-content truncate">
                {openLine
                  ? `${openLine.product_description || openLine.product_code || "Coupon"} · ${formatCurrency2(couponValueOf(openLine))}`
                  : `${openTx.sale_date} · Term ${openTx.terminal}`}
              </p>
            </div>
            {loadingReceipt ? (
              <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
                Loading receipt…
              </div>
            ) : !receipt || receipt.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
                No line items found.
              </div>
            ) : (
              <Transaction trans={receipt} compact />
            )}
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

export default CpnTransactionsMobile;
