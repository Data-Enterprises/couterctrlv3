import { useEffect, useMemo, useState } from "react";
import { ArrowDownTrayIcon, ArrowLeftIcon } from "@heroicons/react/16/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { formatCurrency2, formatBigNumber, formatDate } from "../../../utils";
import { downloadCsv } from "../../../utils/csvExport";
import {
  setCouponBreakdown,
  setSelectedCouponSection,
  setCouponSectionFilter,
  setCouponExportOpen,
  type CouponBreakdown,
  type CouponTierFilter,
} from "../../../features/couponSalesSlice";
import TextFilter from "../../../components/filters/TextFilter";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getCashierTransaction } from "../../../api/lossPrevention";
import CpnSalesDayCards from "./CpnSalesDayCards";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import { setTransactionDrillDown } from "../../../features/lossPreventionSlice";
import {
  buildBreakdownRows,
  buildTransactions,
  couponDotClass,
  couponHeaderBgClass,
  couponValueOf,
  sectionKeyOf,
  totalsFor,
  type CouponTransaction,
  type GradingOptions,
} from "../shared/couponGrading";
import type { CouponTier } from "../../../features/couponSalesSlice";
import type {
  CouponItem,
  JsonError,
  TransactionListItem,
} from "../../../interfaces";
import SortHeader from "../../../components/SortHeader";
import { useTriStateSort } from "../../../utils/useTriStateSort";

type SectionSortCol = "amount" | "trans" | "count" | "avg";
type TxSortCol = "count" | "amount";

const TABS: { key: CouponBreakdown; label: string }[] = [
  { key: "subdept", label: "Sub Dept" },
  { key: "cashier", label: "Cashier" },
  { key: "item", label: "Items" },
];

const SECTION_COL_LABEL: Record<CouponBreakdown, string> = {
  subdept: "Sub Dept",
  cashier: "Cashier",
  item: "Item",
};

interface Props {
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

/** Percentage move against the baseline, styled like LP's TrendBadge. Up is
 *  the bad direction here — coupons growing past the store's own norm. */
const TrendBadge = ({ pct }: { pct: number | null }) => {
  if (pct === null) return null;
  const isUp = pct > 0;
  return (
    <span
      className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
        isUp
          ? "bg-severity_critical_bg text-severity_critical_text"
          : "bg-severity_healthy_bg text-severity_healthy_text"
      }`}
    >
      {pct !== 0 && (isUp ? "▲" : "▼")} {Math.abs(pct).toFixed(2)}%
    </span>
  );
};

/** Mirrors LP's StripCell: label, the baseline figure, then the value with its
 *  trend badge beside it. */
const Kpi = ({
  label,
  value,
  baselineValue,
  trendPct,
}: {
  label: string;
  value: string;
  baselineValue?: string;
  trendPct?: number | null;
}) => (
  <div className="px-4 pt-2.5 pb-2 text-center">
    <div className="text-[10px] font-bold uppercase tracking-wide text-content">
      {label}
    </div>
    {baselineValue !== undefined && (
      <div
        className="text-[10px] font-bold text-content mb-0.5"
        title="Same figure over the prior 2 weeks"
      >
        Baseline {baselineValue}
      </div>
    )}
    <div className="flex items-baseline justify-center gap-2">
      <span className="text-[14px] font-bold text-content">{value}</span>
      <TrendBadge pct={trendPct ?? null} />
    </div>
  </div>
);

const CpnSalesDetailPanel = ({
  storeCoupons,
  storeLabel,
  storeTier,
  rangeLabel,
  threshold,
  grading,
}: Props) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { url, token } = useAppSelector((s) => s.app);

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
    dispatch(setTransactionDrillDown([]));
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
        dispatch(setTransactionDrillDown([lines]));
      })
      .catch((err: JsonError) => {
        setOpenSaleId("");
        toast.error("Error fetching transaction: " + err.message);
      });
  };

  const handleBackFromTransaction = () => {
    setOpenSaleId("");
    dispatch(setTransactionDrillDown([]));
  };


  // Receipt derivation, matching dev Coupons: sale lines and coupon lines are
  // split so the footer can show gross, discount, tax and net separately.
  const txLines: TransactionListItem[] = useAppSelector((s) =>
    Array.isArray(s.lossPrevention.transactionDrillDown?.[0])
      ? s.lossPrevention.transactionDrillDown[0]
      : [],
  );
  const txMeta = txLines[0] ?? null;
  const txSaleLines = txLines.filter(
    (r) => r.sale_type === "Sale" && r.is_coupon !== 1,
  );
  const txGross = txSaleLines.reduce((acc, r) => acc + (r.total_sales ?? 0), 0);
  const txCoupons = txLines
    .filter((r) => r.is_coupon === 1)
    .reduce((acc, r) => acc + couponValueOf(r), 0);
  const txTax = txSaleLines.reduce(
    (acc, r) => acc + (r.total_rounded_tax ?? 0),
    0,
  );
  const txNet = txGross - txCoupons;
  const txTotal = txNet + txTax;
  // sale_start_time is bare digits and can come back five long (84105 =
  // 08:41:05), which dev Coupons' six-digit regex misses — it then renders the
  // raw number. Pad to an even length first so it always reads as a clock.
  const fmtTime = (t?: string) => {
    if (!t) return "";
    const digits = t.replace(/\D/g, "");
    if (digits.length < 3) return "";
    const padded = digits.length % 2 === 1 ? `0${digits}` : digits;
    return padded.replace(/(\d{2})(\d{2})(\d{2})?/, "$1:$2");
  };

  const exportTransaction = () => {
    if (!txLines.length) return;
    const headers = ["Line", "Description", "Qty", "Sale Type", "Total", "Coupon Amount"];
    const rows = txLines.map((item) => [
      item.line_number,
      `"${(item.product_description ?? "").replace(/"/g, '""')}"`,
      item.qty ?? "",
      item.sale_type ?? "",
      item.is_coupon === 1 ? "" : (item.total_sales ?? ""),
      item.is_coupon === 1 ? couponValueOf(item) : "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const txId = txMeta?.transaction_id ?? txMeta?.sale_id?.split("-")[1] ?? "tx";
    const store = txMeta?.store_name?.replace(/\s+/g, "_") ?? "store";
    const date = txMeta?.sale_date?.split("T")[0] ?? "";
    downloadCsv(csv, `transaction_${store}_${date}_${txId}.csv`);
  };
  const breakdown = useAppSelector((s) => s.couponSales.breakdown);
  // Items stack their metrics under the description; the other two
  // breakdowns keep the aligned column grid.
  const isItemView = breakdown === "item";
  const selectedSectionKey = useAppSelector((s) => s.couponSales.selectedSectionKey);
  const selectedStoreKey = useAppSelector((s) => s.couponSales.selectedStoreKey);
  const sectionFilter = useAppSelector((s) => s.couponSales.sectionFilter);
  // Switching the breakdown tab, picking a different row in the left column, or
  // changing store all replace what this panel is about — an open receipt from
  // the previous context would otherwise stay on screen, unrelated to what is
  // now selected. Backing out here covers every path that changes them,
  // including the store switch (which nulls the section in the slice) and the
  // "clear selection" button, rather than each call site remembering to.
  useEffect(() => {
    setOpenSaleId("");
    dispatch(setTransactionDrillDown([]));
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

  const pctVs = (now: number, base: number | undefined) =>
    base === undefined || base === 0 ? null : ((now - base) / base) * 100;

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
    <div className="flex flex-col min-w-0 h-full bg-custom-white rounded-xl shadow-sm overflow-hidden">
      {/* ── Title bar — tinted to the selected store's grade ────────────── */}
      <div
        className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 flex-shrink-0 ${couponHeaderBgClass[storeTier]}`}
      >
        <span className="text-custom-white text-[13px] font-bold truncate justify-self-start">
          {storeLabel}
        </span>
        <span className="text-custom-white text-[13px] font-bold justify-self-center whitespace-nowrap">
          Coupon Performance · {rangeLabel}
        </span>
        <div className="flex items-center gap-3 justify-self-end">
          <button
            onClick={() => dispatch(setCouponExportOpen(true))}
            title="Export CSV"
            className="text-custom-white transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50">
        <Kpi
          label="Amount"
          value={formatCurrency2(totals.amount)}
          baselineValue={
            baselineTotals ? formatCurrency2(baselineTotals.amount) : undefined
          }
          trendPct={pctVs(totals.amount, baselineTotals?.amount)}
        />
        <Kpi
          label="Coupons"
          value={formatBigNumber(totals.lines, 0)}
          baselineValue={
            baselineTotals ? formatBigNumber(baselineTotals.lines, 0) : undefined
          }
          trendPct={pctVs(totals.lines, baselineTotals?.lines)}
        />
        <Kpi
          label="Avg coupon"
          value={formatCurrency2(totals.avgAmount)}
          baselineValue={
            baselineTotals ? formatCurrency2(baselineTotals.avgAmount) : undefined
          }
          trendPct={pctVs(totals.avgAmount, baselineTotals?.avgAmount)}
        />
        <Kpi
          label="Trans"
          value={formatBigNumber(totals.transactions, 0)}
          baselineValue={
            baselineTotals
              ? formatBigNumber(baselineTotals.transactions, 0)
              : undefined
          }
          trendPct={pctVs(totals.transactions, baselineTotals?.transactions)}
        />
      </div>

      {/* ── Day of week — narrows everything below to one day, graded
             against the same weekday in the baseline weeks ──────────────── */}
      <CpnSalesDayCards
        coupons={storeCoupons}
        baseline={grading.baseline ?? []}
        selectedDay={selectedDay}
        onSelect={setSelectedDay}
      />

      {/* ── Breakdown tabs — choose what the left column lists ─────────── */}
      <div className="flex items-center border-b border-gray-100 px-3 flex-shrink-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              dispatch(setCouponBreakdown(t.key));
              setSectionTierFilter("all");
            }}
            className={`px-3 py-1.5 text-[12px] font-medium border-b-2 transition-colors ${
              breakdown === t.key
                ? "border-[#1e2a4a] text-content"
                : "border-transparent text-content"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Split: section list | transactions ─────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Left: the active tab's graded rows */}
        <div
          className="flex flex-col border-r border-gray-100"
          style={{ width: 330, flexShrink: 0 }}
        >
          <div className="flex-shrink-0 flex items-center gap-1.5 p-2 border-b border-gray-100 bg-gray-100">
            <button
              onClick={() =>
                setSectionTierFilter((f) => (f === "critical" ? "all" : "critical"))
              }
              className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_critical_bg text-severity_critical_text transition-shadow ${
                sectionTierFilter === "critical"
                  ? "ring-2 ring-severity_critical_text/40 shadow-sm"
                  : ""
              }`}
            >
              Crit ({critCount})
            </button>
            {/* Avg $ is a two-tier question, so Watch has nothing to count. */}
            {grading.metric === "trend" && (
            <button
              onClick={() => setSectionTierFilter((f) => (f === "watch" ? "all" : "watch"))}
              className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_watch_bg text-severity_watch_text transition-shadow ${
                sectionTierFilter === "watch"
                  ? "ring-2 ring-severity_watch_text/40 shadow-sm"
                  : ""
              }`}
            >
              Watch ({watchCount})
            </button>
            )}
            <button
              onClick={() => setSectionTierFilter((f) => (f === "ok" ? "all" : "ok"))}
              className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_healthy_bg text-severity_healthy_text transition-shadow ${
                sectionTierFilter === "ok"
                  ? "ring-2 ring-severity_healthy_text/40 shadow-sm"
                  : ""
              }`}
            >
              OK ({okCount})
            </button>
            <div className="flex-1" />
            <TextFilter
              value={sectionFilter}
              onChange={(v) => dispatch(setCouponSectionFilter(v))}
              placeholder="Filter"
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
            <div
              className="sticky top-0 z-10 grid border-b border-gray-100 bg-gray-100"
              style={{ gridTemplateColumns: "1fr 0.62fr 0.4fr 0.4fr 0.55fr" }}
            >
              <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-content text-left">
                {SECTION_COL_LABEL[breakdown]}
              </div>
              <SortHeader
                col="amount"
                label="Amount"
                sort={sectionSort.sort}
                onSort={sectionSort.handleSort}
                className="px-2 py-1 text-[9px] font-bold justify-end uppercase tracking-wide text-content hover:underline"
              />
              <SortHeader
                col="trans"
                label="Trans"
                sort={sectionSort.sort}
                onSort={sectionSort.handleSort}
                className="px-1.5 py-1 text-[9px] font-bold justify-end uppercase tracking-wide text-content hover:underline"
              />
              <SortHeader
                col="count"
                label="Count"
                sort={sectionSort.sort}
                onSort={sectionSort.handleSort}
                className="px-1.5 py-1 text-[9px] font-bold justify-end uppercase tracking-wide text-content hover:underline"
              />
              <SortHeader
                col="avg"
                label="Avg"
                sort={sectionSort.sort}
                onSort={sectionSort.handleSort}
                className="px-2 py-1 text-[9px] font-bold justify-end uppercase tracking-wide text-content hover:underline"
              />
            </div>

            {visibleSections.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-[11px] text-content/40">
                Nothing matches
              </div>
            ) : (
              visibleSections.map((row) => {
                const isSel = selectedSectionKey === row.key;
                return (
                  <button
                    key={row.key}
                    onClick={() =>
                      dispatch(
                        setSelectedCouponSection(isSel ? null : row.key),
                      )
                    }
                    className={`w-full ${
                      isItemView ? "block" : "grid items-center"
                    } border-b border-gray-100 border-l-2 text-left transition-colors ${
                      isSel
                        ? "bg-row_selected border-l-row_selected_border"
                        : "border-l-transparent hover:bg-gray-50"
                    }`}
                    style={
                      isItemView
                        ? undefined
                        : { gridTemplateColumns: "1fr 0.62fr 0.4fr 0.4fr 0.55fr" }
                    }
                  >
                    {isItemView ? (
                      <>
                        {/* Item descriptions are far longer than a sub dept or
                            cashier name, so they take the full width on their
                            own line. The metrics then repeat the header's grid
                            below, keeping each figure under its own column. */}
                        <div className="px-2 pt-2 pb-1 flex items-center gap-1.5 min-w-0">
                          <span
                            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${couponDotClass[row.tier]}`}
                          />
                          <span className="text-[12px] font-medium text-content truncate">
                            {row.label}
                          </span>
                        </div>
                        <div
                          className="grid items-center pb-2"
                          style={{ gridTemplateColumns: "1fr 0.62fr 0.4fr 0.4fr 0.55fr" }}
                        >
                          <div />
                          <div className="px-2 text-[12px] font-semibold text-content text-right">
                            {formatCurrency2(row.amount)}
                          </div>
                          <div className="px-1.5 text-[12px] font-medium text-content text-right">
                            {formatBigNumber(row.transactions, 0)}
                          </div>
                          <div className="px-1.5 text-[12px] font-medium text-content text-right">
                            {formatBigNumber(row.lines, 0)}
                          </div>
                          <div className="px-2 text-right">
                            <span
                              className={`text-[12px] font-semibold px-1.5 py-0.5 rounded ${
                                row.tier === "critical"
                                  ? "bg-severity_critical_bg text-severity_critical_text"
                                  : "bg-severity_healthy_bg text-severity_healthy_text"
                              }`}
                            >
                              {formatCurrency2(row.avgAmount)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="px-2 py-[11px] flex items-center gap-1.5 min-w-0">
                          <span
                            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${couponDotClass[row.tier]}`}
                          />
                          <span className="text-[12px] font-medium text-content truncate">
                            {row.label}
                          </span>
                        </div>
                        <div className="px-2 py-[11px] text-[12px] font-semibold text-content text-right">
                          {formatCurrency2(row.amount)}
                        </div>
                        <div className="px-1.5 py-[11px] text-[12px] font-medium text-content text-right">
                          {formatBigNumber(row.transactions, 0)}
                        </div>
                        <div className="px-1.5 py-[11px] text-[12px] font-medium text-content text-right">
                          {formatBigNumber(row.lines, 0)}
                        </div>
                        <div className="px-2 py-[11px] text-right">
                          <span
                            className={`text-[12px] font-semibold px-1.5 py-0.5 rounded ${
                              row.tier === "critical"
                                ? "bg-severity_critical_bg text-severity_critical_text"
                                : "bg-severity_healthy_bg text-severity_healthy_text"
                            }`}
                          >
                            {formatCurrency2(row.avgAmount)}
                          </span>
                        </div>
                      </>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: transactions for the selection. Clicking one opens the full
            receipt in the shared TransactionModal — the coupons/ payload only
            has the coupon lines, so it can't show what was discounted. */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          {openSaleId ? (
            <>
              {/* Receipt — same layout as dev Coupons: back bar with cashier
                  and terminal, every line of the sale, then the totals. */}
              <div className="flex-shrink-0 px-3 py-2 flex items-center justify-between border-b border-gray-100 bg-custom-white">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBackFromTransaction}
                    className="flex items-center gap-1 text-content hover:underline transition-colors text-[11px]"
                  >
                    <ArrowLeftIcon className="w-3 h-3" />
                    Back
                  </button>
                  <div className="w-px h-4 bg-gray-200" />
                  <div>
                    <div className="text-[12px] font-semibold text-content">
                      {txMeta?.cashier_name}
                      <span className="ml-2 text-[10px] font-normal text-content">
                        — Terminal {txMeta?.terminal}
                      </span>
                    </div>
                    <div className="text-[10px] text-content">
                      {fmtTime(txMeta?.sale_start_time)} – {fmtTime(txMeta?.sale_end_time)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {txLines.length > 0 && (
                    <button
                      onClick={exportTransaction}
                      title="Export transaction CSV"
                      className="text-content hover:opacity-70 transition-opacity"
                    >
                      <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="w-px h-5 bg-gray-200" />
                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-wide text-content">
                      Trans
                    </div>
                    <div className="text-[12px] font-medium text-content">
                      {txMeta?.transaction_id ?? txMeta?.sale_id?.split("-")[1]}
                    </div>
                  </div>
                  <div className="w-px h-5 bg-gray-200" />
                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-wide text-content">
                      Items
                    </div>
                    <div className="text-[12px] font-medium text-content">
                      {txLines.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Store / address / date strip, same as dev Coupons */}
              <div className="flex-shrink-0 px-3 py-1.5 flex items-center gap-3 border-b border-gray-100 bg-gray-50">
                <span className="text-[11px] font-semibold text-content">
                  {txMeta?.store_name}
                </span>
                <span className="text-[10px] text-content">
                  {txMeta?.store_address}, {txMeta?.store_city}{" "}
                  {txMeta?.store_state}
                </span>
                <div className="flex-1" />
                <span className="text-[10px] font-medium text-content">
                  {txMeta?.sale_date ? formatDate(txMeta.sale_date.split("T")[0]) : ""}
                </span>
              </div>

              {txLines.length === 0 ? (
                <div className="flex-1 relative min-h-0">
                  <LoadingIndicator message="Loading transaction..." />
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-auto thin-scrollbar">
                    <table className="w-full border-collapse text-[12px]">
                      <thead>
                        <tr className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                          {(
                            [
                              ["#", "text-right w-7"],
                              ["Description", "text-left"],
                              ["Qty", "text-right"],
                              ["Total", "text-right"],
                              ["Type", "text-center w-14"],
                            ] as const
                          ).map(([label, align]) => (
                            <th
                              key={label}
                              className={`px-2 py-2 text-[9px] font-semibold uppercase tracking-wide text-content ${align}`}
                            >
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2a4a]/15">
                        {txLines.map((item, i) => {
                          const isCpn = item.is_coupon === 1;
                          const isTender = item.sale_type === "Tender";
                          return (
                            <tr
                              key={i}
                              style={isCpn ? { background: "rgba(234,179,8,0.07)" } : undefined}
                            >
                              <td className="px-2 py-2 text-right tabular-nums text-content">
                                {item.line_number}
                              </td>
                              <td className="px-2 py-2 text-content truncate max-w-0" style={{ maxWidth: 200 }}>
                                {item.product_description}
                              </td>
                              <td className="px-2 py-2 text-right tabular-nums text-content">
                                {(item.qty ?? 0) > 0 ? item.qty : "—"}
                              </td>
                              <td className={`px-2 py-2 text-right tabular-nums font-semibold ${isCpn ? "text-amber-700" : "text-content"}`}>
                                {formatCurrency2(isCpn ? couponValueOf(item) : item.total_sales)}
                              </td>
                              <td className="px-2 py-2 text-center">
                                <span
                                  className="text-[11px] font-semibold rounded px-1.5 py-0.5"
                                  style={
                                    isCpn
                                      ? { background: "rgba(234,179,8,0.15)", color: "#92600a" }
                                      : isTender
                                        ? { background: "rgba(37,99,235,0.1)", color: "#1d4ed8" }
                                        : { background: "rgba(22,163,74,0.1)", color: "#15803d" }
                                  }
                                >
                                  {isCpn ? "Cpn" : isTender ? "Tender" : "Sale"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex-shrink-0 flex items-center justify-end gap-4 px-3 py-2 border-t border-gray-100 bg-gray-50">
                    {txCoupons > 0 && (
                      <div className="text-[11px] text-amber-700">
                        Coupons
                        <span className="font-medium ml-1">-{formatCurrency2(txCoupons)}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-content">
                      Tax<span className="font-medium ml-1">{formatCurrency2(txTax)}</span>
                    </div>
                    <div className="text-[11px] text-content">
                      Net<span className="font-medium ml-1">{formatCurrency2(txNet)}</span>
                    </div>
                    <div className="text-[11px] text-content font-medium">
                      Total<span className="ml-1">{formatCurrency2(txTotal)}</span>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
          <>
              <div className="flex-shrink-0 px-3.5 py-1.5 border-b border-gray-100 bg-gray-100 flex items-center gap-2">
                <span className="text-[11px] font-semibold text-content truncate">
                  {selectedSection ? selectedSection.label : "All transactions"}
                </span>
                <span className="text-[11px] text-content truncate">
                  {formatBigNumber(transactions.length, 0)} transactions ·{" "}
                  {formatCurrency2(totalsFor(scopedCoupons).avgAmount)} avg
                </span>
                {selectedSection && (
                  <>
                    <div className="flex-1" />
                    <button
                      onClick={() => dispatch(setSelectedCouponSection(null))}
                      className="text-[11px] font-medium text-content hover:underline transition-colors flex-shrink-0"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>

              <div
                className="flex-shrink-0 grid border-b border-gray-100 bg-gray-50"
                style={{ gridTemplateColumns: "1.4fr 1fr 0.6fr 0.7fr" }}
              >
                {(["Transaction", "Cashier"] as const).map((h) => (
                  <div
                    key={h}
                    className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-content text-left"
                  >
                    {h}
                  </div>
                ))}
                <SortHeader
                  col="count"
                  label="Count"
                  sort={txSort.sort}
                  onSort={txSort.handleSort}
                  className="px-3 py-1.5 text-[9px] font-bold justify-end uppercase tracking-wide text-content hover:underline"
                />
                <SortHeader
                  col="amount"
                  label="Amount"
                  sort={txSort.sort}
                  onSort={txSort.handleSort}
                  className="px-3 py-1.5 text-[9px] font-bold justify-end uppercase tracking-wide text-content hover:underline"
                />
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
                {transactions.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-[11px] text-content/40">
                    No transactions in this selection
                  </div>
                ) : (
                  transactions.map((t) => (
                    <button
                      key={t.sale_id}
                      onClick={() => openTransaction(t)}
                      className="w-full grid items-center border-b border-gray-100 text-left hover:bg-gray-50 transition-colors even:bg-row_stripe"
                      style={{ gridTemplateColumns: "1.4fr 1fr 0.6fr 0.7fr" }}
                    >
                      {/* No grade dot here — a transaction is almost always a
                          single coupon, so the dot just restated Amount vs the
                          threshold on every row. Grading lives at the store and
                          section levels, where it aggregates something. */}
                      <div className="px-3 py-2 flex items-center gap-1.5 min-w-0">
                        <span className="min-w-0">
                          {/* Underlined like LP's TRANS ID column — signals
                              the row drills into the coupon lines. */}
                          <span className="block text-[12px] font-medium text-content truncate underline underline-offset-2 decoration-content/40">
                            #{t.sale_id}
                          </span>
                          <span className="block text-[11px] text-content truncate">
                            {t.sale_date}
                            {t.terminal ? ` · Term ${t.terminal}` : ""}
                          </span>
                        </span>
                      </div>
                      <div className="px-3 py-2 text-[12px] font-medium text-content truncate">
                        {t.cashier_name || `Cashier ${t.cashier_number}`}
                      </div>
                      <div className="px-3 py-2 text-[12px] font-semibold text-content text-right">
                        {formatBigNumber(t.lines, 0)}
                      </div>
                      {/* No Avg column — a transaction almost always carries a
                          single coupon, so it would just repeat Amount. The
                          severity dot already carries the grade, and the
                          Coupons count shows when the two would differ. */}
                      <div className="px-3 py-2 text-[12px] font-semibold text-content text-right">
                        {formatCurrency2(t.amount)}
                      </div>
                    </button>
                  ))
                )}
              </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CpnSalesDetailPanel;
