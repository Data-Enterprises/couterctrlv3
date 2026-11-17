// Hooks
import { useMemo, useState } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useCouponContext } from "../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import { setCouponReceiptLines } from "../../../../features/dev/devCouponSlice";

// API
import { getCashierTransaction } from "../../../../api/lossPrevention";

// Utils
import { buildSaleId, receiptTotals } from "../utils";
import { aggregateSectionCoupons, downloadReceiptCsv } from "./utils";
import { reasonOf } from "../../../../utils/serverError";

// Interfaces
import type { AggUse } from "./interfaces";
import type { CouponItem } from "../../../../interfaces";

// Components
import MobilePerfDetail from "../../../../components-dev/mobile/MobilePerfDetail";
import CpnTotalsCard from "./components/CpnTotalsCard";
import CpnProductRow from "./components/CpnProductRow";
import CpnReceiptSheet from "./components/CpnReceiptSheet";

interface CpnSectionDetailProps {
  coupons: CouponItem[];
  sectionLabel: string;
  /** "Sub dept" | "Date" | "Cashier" — the tab this section came from. */
  tabLabel: string;
  dateRangeLabel: string;
  sortMetric: "amount" | "qty";
  onBack: () => void;
}

/** The phone Coupons detail for one section: a totals card and its coupons grouped by product, each expanding to
 *  its uses. Tapping a use opens that transaction's receipt in a bottom sheet, with a CSV export. */
const CpnSectionDetail = ({
  coupons,
  sectionLabel,
  tabLabel,
  dateRangeLabel,
  sortMetric,
  onBack,
}: CpnSectionDetailProps) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { url, token, receiptLines } = useCouponContext();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedSaleId, setSelectedSaleId] = useState<string>("");

  const aggRows = useMemo(
    () => aggregateSectionCoupons(coupons, sortMetric),
    [coupons, sortMetric],
  );

  const totals = receiptTotals(receiptLines);

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleUseClick = (use: AggUse) => {
    const saleId = buildSaleId(use.row);
    dispatch(setCouponReceiptLines([]));
    setSelectedSaleId(saleId);
    getCashierTransaction(url, token, use.sale_date, saleId, use.storeid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const transactions = [...(j.transaction ?? [])].map((item: any) => ({
            ...item,
            transaction_id: item.sale_id?.split("-")[1] ?? "",
            qty: item.qty ?? 0,
          }));
          dispatch(setCouponReceiptLines(transactions));
        }
      })
      .catch((err) => toast.error(reasonOf(err)));
  };

  const handleSheetClose = () => {
    setSelectedSaleId("");
    dispatch(setCouponReceiptLines([]));
  };

  const handleExport = () => {
    if (receiptLines.length === 0) return;
    downloadReceiptCsv(receiptLines, totals);
  };

  // The deepest level, in the same wrapper. One tab, so no tab row is drawn;
  // the tab it came from names the level.
  return (
    <>
      <MobilePerfDetail
        tabs={[{ key: "products" as const, label: tabLabel }]}
        active="products"
        onTab={() => {}}
        scopeName={sectionLabel}
        when={dateRangeLabel}
        backLabel="Back to coupons"
        onBack={onBack}
        levelKey={`cpnSection|${sectionLabel}`}
      >
        <div className="flex flex-col gap-3">
          <CpnTotalsCard coupons={coupons} caption={`${tabLabel} total`} />

          <section className="cc-card-phone">
            {/* No scroll container and no pb-14 of its own: MobilePerfDetail owns
          the scroll and already clears the fixed tab bar. */}
            <div>
              {aggRows.map((agg) => (
                <CpnProductRow
                  key={agg.product_code}
                  agg={agg}
                  expanded={expanded.has(agg.product_code)}
                  onToggle={() => toggleExpanded(agg.product_code)}
                  onUse={handleUseClick}
                />
              ))}
            </div>
          </section>
        </div>
      </MobilePerfDetail>

      {/* Transaction bottom sheet */}
      {selectedSaleId && (
        <CpnReceiptSheet
          txLines={receiptLines}
          totals={totals}
          onExport={handleExport}
          onClose={handleSheetClose}
        />
      )}
    </>
  );
};

export default CpnSectionDetail;
