import { useMemo, useState } from "react";
import { useAppSelector } from "../../../hooks";
import MobilePerfHeader from "../../../components/mobile/MobilePerfHeader";
import SevBadge from "../../../components/SevBadge";
import { formatCurrency2, formatBigNumber } from "../../../utils";
import type { CouponItem } from "../../../interfaces";
import { COUPON_THRESHOLD_DEFAULT } from "../../../features/couponSalesSlice";
import { COUPON_SALES_INFO } from "../couponSalesInfo";
import {
  buildTransactions,
  couponPillClass,
  couponValueOf,
  sectionKeyOf,
} from "../shared/couponGrading";
import { badgeTier } from "./couponTierUi";

/**
 * The receipts behind one section — screen three, and the end of the drill.
 *
 * Graded on the flat-dollar outlier rule regardless of which metric the rest
 * of the page is on, because a single sale has no prior two weeks of its own:
 * "this receipt versus its own baseline" isn't a question that means anything.
 * The only sensible read here is whether the coupon coming off it was large.
 *
 * Lines are collapsed by default. A receipt with one coupon is the common
 * case, and expanding every one of them by default buries the rare receipt
 * carrying six.
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
  const { breakdown, selectedSectionKey, threshold } = useAppSelector(
    (s) => s.couponSales,
  );
  const [openSale, setOpenSale] = useState<number | null>(null);

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

  return (
    <div className="flex flex-col h-full">
      <MobilePerfHeader
        pageName={selectedSectionKey ?? "Transactions"}
        dateRange={rangeLabel}
        storeName={storeLabel}
        onBack={onBack}
        info={COUPON_SALES_INFO}
      />

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
            const isOpen = openSale === t.sale_id;
            return (
              <div key={t.sale_id} className="border-b border-gray-100">
                <button
                  onClick={() => setOpenSale(isOpen ? null : t.sale_id)}
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

                {isOpen && (
                  <div className="bg-row_stripe px-4 pb-3 pt-1">
                    {t.items.map((line, i) => (
                      <div
                        key={`${line.line_number}-${i}`}
                        className="flex items-baseline gap-2 py-1 border-t border-gray-100 first:border-t-0"
                      >
                        <span className="text-[11px] text-content flex-1 min-w-0 truncate">
                          {line.product_description ||
                            line.product_code ||
                            "Unknown item"}
                        </span>
                        <span className="text-[11px] text-content tabular-nums flex-shrink-0">
                          {formatCurrency2(couponValueOf(line))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CpnTransactionsMobile;
