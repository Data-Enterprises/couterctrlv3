// Hooks
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { useTriStateSort } from "../../../../utils/useTriStateSort";
import { useCouponSalesCtx } from "../hooks";

// Redux
import {
  setCouponBreakdown,
  setCouponReceiptLines,
  type CouponTier,
  type CouponTierFilter,
} from "../../../../features/dev/devCouponSalesSlice";

// API
import { getCashierTransaction } from "../../../../api/lossPrevention";

// Utils
import { downloadCsv } from "../../../../utils/csvExport";
import {
  buildBreakdownRows,
  buildTransactions,
  sectionKeyOf,
  totalsFor,
  type CouponTransaction,
  type GradingOptions,
} from "../utils";
import { transactionCsv } from "./utils";

// Interfaces
import type { CouponItem, JsonError, TransactionListItem } from "../../../../interfaces";
import type { SectionSortCol, TxSortCol } from "./interfaces";

// Components
import CpnSalesDayCards from "../components/CpnSalesDayCards";
import DetailTitleBar from "./components/DetailTitleBar";
import DetailKpiStrip from "./components/DetailKpiStrip";
import BreakdownTabs from "./components/BreakdownTabs";
import SectionList from "./components/SectionList";
import ReceiptPane from "./components/ReceiptPane";
import TransactionsPane from "./components/TransactionsPane";

interface CpnSalesDetailPanelProps {
  /** Coupons for the selected store only. */
  storeCoupons: CouponItem[];
  storeLabel: string;
  /** Grade of the selected store — the header is tinted with it, the way LP
   *  and Sales' detail popup both announce the selection. */
  storeTier: CouponTier;
  rangeLabel: string;
  /** Flat-dollar outlier threshold — still used directly for transaction
   *  grading, which has no baseline. */
  threshold: number;
  /** Full grading config for the breakdown rows: dollar threshold, trend
   *  threshold, and the store-scoped baseline. */
  grading: GradingOptions;
}

/** The open store's coupon report: its figures, its days, its breakdown and
 *  the transactions behind it. */
const CpnSalesDetailPanel = ({
  storeCoupons,
  storeLabel,
  storeTier,
  rangeLabel,
  threshold,
  grading,
}: CpnSalesDetailPanelProps) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { url, token, receiptLines: txLines, breakdown, selectedSectionKey, selectedStoreKey, sectionFilter } =
    useCouponSalesCtx();

  // Which transaction the right pane is showing, if any. Local like dev
  // Coupons' own selectedSaleId — it's view state for one pane, not something
  // a re-search or another panel needs to read.
  const [openSaleId, setOpenSaleId] = useState("");

  // Which day of the week the panel is scoped to; "" is the whole week. Local
  // like the section filter — it's a view control on this panel, not page
  // state another component reads.
  const [selectedDay, setSelectedDay] = useState("");

  // Fetches the whole receipt from LP's endpoint and renders it in place. The
  // coupons/ payload only carries the coupon lines, so on its own it can't
  // show what the discount was actually applied against.
  const openTransaction = (t: CouponTransaction) => {
    const saleDate = t.rawSaleDate.split("T")[0];
    const [y, m, d] = saleDate.split("-");
    const joinedSaleId = `${t.storeid}-${t.sale_id}-${t.terminal}-${parseInt(m)}-${parseInt(d)}-${y}`;
    if (joinedSaleId === openSaleId) return;

    setOpenSaleId(joinedSaleId);
    dispatch(setCouponReceiptLines([]));
    getCashierTransaction(url, token, saleDate, joinedSaleId, t.storeid)
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
        dispatch(setCouponReceiptLines(lines));
      })
      .catch((err: JsonError) => {
        setOpenSaleId("");
        toast.error("Error fetching transaction: " + err.message);
      });
  };

  const handleBackFromTransaction = () => {
    setOpenSaleId("");
    dispatch(setCouponReceiptLines([]));
  };

  const exportTransaction = () => {
    if (!txLines.length) return;
    const { csv, filename } = transactionCsv(txLines);
    downloadCsv(csv, filename);
  };

  // Switching the breakdown tab, picking a different row in the left column, or
  // changing store all replace what this panel is about — an open receipt from
  // the previous context would otherwise stay on screen, unrelated to what is
  // now selected. Backing out here covers every path that changes them,
  // including the store switch (which nulls the section in the slice) and the
  // "clear selection" button, rather than each call site remembering to.
  useEffect(() => {
    setOpenSaleId("");
    dispatch(setCouponReceiptLines([]));
  }, [breakdown, selectedSectionKey, selectedStoreKey, dispatch]);

  // A day filter from one store means nothing on the next one, so it resets
  // with the store — but NOT with the breakdown tab, where narrowing to a day
  // and then switching between sub dept / cashier is the point.
  useEffect(() => {
    setSelectedDay("");
  }, [selectedStoreKey]);

  // Local like LP's cashier filter — it's a view control on one column, not
  // page state worth persisting across selections.
  const [sectionTierFilter, setSectionTierFilter] = useState<CouponTierFilter>("all");
  const sectionSort = useTriStateSort<SectionSortCol>();
  const txSort = useTriStateSort<TxSortCol>();

  // Everything beneath the day strip reads this, so picking a day narrows the
  // KPIs, the breakdown rows and the transactions in one move.
  const dayCoupons = useMemo(
    () =>
      selectedDay === ""
        ? storeCoupons
        : storeCoupons.filter((c) => c.sale_date.split("T")[0] === selectedDay),
    [storeCoupons, selectedDay],
  );

  const totals = useMemo(() => totalsFor(dayCoupons), [dayCoupons]);

  // The same figures over the baseline window, for the strip.
  //
  // Amount, coupons and transactions are TOTALS over two weeks against one, so
  // they're halved to read as a comparable week — the same convention LP's
  // strip uses. The average is NOT halved: it is already per-coupon, and
  // halving it would invent a 50% drop on every store.
  const baselineTotals = useMemo(() => {
    const rows = grading.baseline ?? [];
    if (rows.length === 0) return null;
    const t = totalsFor(rows);
    return {
      amount: t.amount / 2,
      lines: t.lines / 2,
      transactions: t.transactions / 2,
      avgAmount: t.avgAmount,
    };
  }, [grading.baseline]);

  // Grading a single day still compares against the whole baseline window for
  // that group — the day strip is where day-vs-same-weekday lives, and doing
  // it here too would compare one day against one weekday twice over.
  const sectionRows = useMemo(
    () => buildBreakdownRows(dayCoupons, grading, breakdown),
    [dayCoupons, grading, breakdown],
  );

  const critCount = sectionRows.filter((r) => r.tier === "critical").length;
  const watchCount = sectionRows.filter((r) => r.tier === "watch").length;
  const okCount = sectionRows.filter((r) => r.tier === "ok").length;

  const visibleSections = useMemo(() => {
    const byTier =
      sectionTierFilter === "all"
        ? sectionRows
        : sectionRows.filter((r) => r.tier === sectionTierFilter);
    const q = sectionFilter.trim().toLowerCase();
    const filtered = q
      ? byTier.filter((r) => r.label.toLowerCase().includes(q))
      : byTier;
    return sectionSort.applySort(filtered, (r, col) =>
      col === "amount"
        ? r.amount
        : col === "trans"
          ? r.transactions
          : col === "count"
            ? r.lines
            : r.avgAmount,
    );
  }, [sectionRows, sectionTierFilter, sectionFilter, sectionSort.sort]);

  // With nothing picked the right side shows every transaction in the store,
  // so the panel is useful the moment a store is selected rather than sitting
  // empty until a second click.
  const scopedCoupons = useMemo(
    () =>
      selectedSectionKey === null
        ? dayCoupons
        : dayCoupons.filter(
            (c) => sectionKeyOf(c, breakdown) === selectedSectionKey,
          ),
    [dayCoupons, breakdown, selectedSectionKey],
  );

  const transactions = useMemo(
    () =>
      txSort.applySort(
        buildTransactions(scopedCoupons, threshold),
        (r, col) => (col === "amount" ? r.amount : r.lines),
      ),
    [scopedCoupons, threshold, txSort.sort],
  );

  const selectedSection = sectionRows.find((r) => r.key === selectedSectionKey);

  return (
    <div className="cc-panel min-w-0 h-full shadow-sm">
      <DetailTitleBar storeTier={storeTier} storeLabel={storeLabel} rangeLabel={rangeLabel} />

      <DetailKpiStrip totals={totals} baselineTotals={baselineTotals} />

      {/* ── Day of week — narrows everything below to one day, graded
             against the same weekday in the baseline weeks ──────────────── */}
      <CpnSalesDayCards
        coupons={storeCoupons}
        baseline={grading.baseline ?? []}
        selectedDay={selectedDay}
        onSelect={setSelectedDay}
      />

      {/* ── Breakdown tabs — choose what the left column lists ─────────── */}
      <BreakdownTabs
        onTab={(key) => {
          dispatch(setCouponBreakdown(key));
          setSectionTierFilter("all");
        }}
      />

      {/* ── Split: section list | transactions ─────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        <SectionList
          grading={grading}
          critCount={critCount}
          watchCount={watchCount}
          okCount={okCount}
          sectionTierFilter={sectionTierFilter}
          setSectionTierFilter={setSectionTierFilter}
          sectionSort={sectionSort}
          visibleSections={visibleSections}
        />

        {/* Right: transactions for the selection. Clicking one opens the full
            receipt in the shared TransactionModal — the coupons/ payload only
            has the coupon lines, so it can't show what was discounted. */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          {openSaleId ? (
            <ReceiptPane onBack={handleBackFromTransaction} onExport={exportTransaction} />
          ) : (
            <TransactionsPane
              selectedSection={selectedSection}
              transactions={transactions}
              scopedCoupons={scopedCoupons}
              txSort={txSort}
              onOpen={openTransaction}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CpnSalesDetailPanel;
