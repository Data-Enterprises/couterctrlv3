// Hooks
import { useState, useMemo, useEffect, useRef } from "react";
import { useStoreName } from "../../../../../hooks";
import { useCouponContext } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";

// Redux
import {
  setCouponGridFilter,
  setCouponReceiptLines,
} from "../../../../../features/dev/devCouponSlice";
import { isGroupSearch } from "../../../../../features/searchSlice";

// API
import { getCashierTransaction } from "../../../../../api/lossPrevention";

// Utils
import { applyStoreNumberToName } from "../../../../../utils/storeIdentity";
import { couponValueOf, sumCouponAmount } from "../../../../../utils/couponValue";

// Interfaces
import type { GroupTab } from "../../interfaces";
import type { AggRow, GridFilters, GroupedSection } from "./interfaces";
import type {
  CouponItem,
  JsonError,
  ThresholdValue,
  TransactionListItem,
} from "../../../../../interfaces";

// Components
import LoadingIndicator from "../../../../../components-dev/loading/LoadingIndicator";
import CouponsExportModal from "../../export/CouponsExportModal";
import DetailHeader from "./components/DetailHeader";
import KpiStrip from "./components/KpiStrip";
import GroupTabs from "./components/GroupTabs";
import SectionList from "./components/SectionList";
import SectionHeader from "./components/SectionHeader";
import TransactionDetail from "./components/TransactionDetail";
import CouponGrid from "./components/CouponGrid";

interface CouponDetailPanelProps {
  selectedKey: string; // sub dept name (single store) | store ID string (group) | "" for all
  sortMetric: "amount" | "qty";
}


/** The Coupons page's right panel for the chosen store or all stores: header, KPI strip, Sub dept/Date/Cashier tabs
 *  with their section cards, and the coupon grid, which swaps to a single transaction's receipt when a row is clicked. */
const CouponDetailPanel = ({
  selectedKey,
  sortMetric,
}: CouponDetailPanelProps) => {
  const toast = useToast();
  const ctx = useCouponContext();
  const { dispatch, selectedGroup } = ctx;
  const isGroup = isGroupSearch(ctx.type);
  const storeName = useStoreName(Number(ctx.lastStore));
  const assignedStores = ctx.assignedStores;

  const [exportOpen, setExportOpen] = useState(false);
  const [groupTab, setGroupTab] = useState<GroupTab>("subdept");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState("");

  // Applied column filters live in Redux, so they survive leaving the page;
  // what is typed before Apply starts from them and stays local.
  const applied = ctx.gridFilters;
  const appliedProduct = applied.product;
  const appliedUpc = applied.upc;
  const appliedSubDept = applied.subDept;
  const appliedAmount = applied.amount;
  const setAppliedProduct = (v: string) => dispatch(setCouponGridFilter({ product: v }));
  const setAppliedUpc = (v: string) => dispatch(setCouponGridFilter({ upc: v }));
  const setAppliedSubDept = (v: string) => dispatch(setCouponGridFilter({ subDept: v }));
  const setAppliedAmount = (v: ThresholdValue | null) =>
    dispatch(setCouponGridFilter({ amount: v }));
  const [draftProduct, setDraftProduct] = useState(appliedProduct);
  const [draftUpc, setDraftUpc] = useState(appliedUpc);
  const [draftSubDept, setDraftSubDept] = useState(appliedSubDept);
  const [draftAmount, setDraftAmount] = useState<ThresholdValue | null>(appliedAmount);
  const [expandedCoupons, setExpandedCoupons] = useState<Set<string>>(
    new Set(),
  );
  // selectedKey is `storeid__store_number` — co-located stores share an id, so
  // the number is what identifies the location. See utils/storeIdentity.
  const [selectedStoreId, selectedStoreNumber] = selectedKey
    ? selectedKey.split("__")
    : ["", ""];
  const selectedStoreName =
    isGroup && selectedKey
      ? applyStoreNumberToName(
          assignedStores.find((s) => s.storeid === Number(selectedStoreId))
            ?.store_name ?? selectedKey,
          selectedStoreNumber,
          [
            ...new Set(
              ctx.coupons
                .filter((c) => String(c.storeid) === selectedStoreId)
                .map((c) => c.store_number),
            ),
          ],
        )
      : "";

  const fmtRangePart = (mdy: string, withYear = false) => {
    const [m, d, y] = mdy.split("/");
    return withYear ? `${+m}/${+d}/${y}` : `${+m}/${+d}`;
  };
  const dateRangeLabel = `${fmtRangePart(ctx.startDate)} – ${fmtRangePart(ctx.endDate, true)}`;

  const visibleRows = useMemo(() => {
    if (!selectedKey) return ctx.coupons;
    return ctx.coupons.filter(
      (c) =>
        String(c.storeid) === selectedStoreId &&
        c.store_number === selectedStoreNumber,
    );
  }, [ctx.coupons, selectedKey, selectedStoreId, selectedStoreNumber]);

  // Reset selection when scope or tab changes
  useEffect(() => {
    setSelectedSection(null);
    setSelectedSaleId("");
    dispatch(setCouponReceiptLines([]));
  }, [selectedKey, groupTab]);

  // Clear transaction + column filters when section changes. The filters are
  // cleared only on a real change: they live in Redux so they survive leaving
  // the page, and this effect also runs on every mount (twice under StrictMode).
  const lastSection = useRef(selectedSection);
  useEffect(() => {
    setSelectedSaleId("");
    if (lastSection.current !== selectedSection) {
      setDraftProduct("");
      setAppliedProduct("");
      setDraftUpc("");
      setAppliedUpc("");
      setDraftSubDept("");
      setAppliedSubDept("");
      setDraftAmount(null);
      setAppliedAmount(null);
    }
    lastSection.current = selectedSection;
    setExpandedCoupons(new Set());
    dispatch(setCouponReceiptLines([]));
  }, [selectedSection]);

  // Pre-compute all groupings so tab switching is instant
  const allSections = useMemo(() => {
    const build = (
      rows: CouponItem[],
      getKey: (r: CouponItem) => string,
      getLabel: (r: CouponItem) => string,
      chronological = false,
    ): GroupedSection[] => {
      const map = new Map<string, { label: string; rows: CouponItem[] }>();
      rows.forEach((r) => {
        const k = getKey(r);
        if (!map.has(k)) map.set(k, { label: getLabel(r), rows: [] });
        map.get(k)!.rows.push(r);
      });
      const sections = Array.from(map.entries()).map(
        ([key, { label, rows: rs }]) => ({
          key,
          label,
          count: rs.length,
          total: sumCouponAmount(rs),
          rows: rs,
        }),
      );
      if (chronological)
        return sections.sort((a, b) => a.key.localeCompare(b.key));
      return sections.sort(
        sortMetric === "qty"
          ? (a, b) => b.count - a.count
          : (a, b) => b.total - a.total,
      );
    };

    return {
      subdept: build(
        visibleRows,
        (r) => r.sub_department_description,
        (r) => r.sub_department_description,
      ),
      date: build(
        visibleRows,
        (r) => r.sale_date.split("T")[0],
        (r) =>
          new Date(r.sale_date.split("T")[0] + "T12:00:00").toLocaleDateString(
            "en-US",
            { weekday: "short", month: "numeric", day: "numeric" },
          ),
        true,
      ),
      cashier: build(
        visibleRows,
        (r) => r.cashier_name || "unknown",
        (r) => r.cashier_name || "Unknown cashier",
      ),
    };
  }, [visibleRows, sortMetric]);

  const groupedSections = allSections[groupTab];

  // Rows shown in the right grid — all or filtered by selected card
  const gridRows = useMemo(() => {
    if (!selectedSection) return visibleRows;
    return groupedSections.find((s) => s.key === selectedSection)?.rows ?? [];
  }, [visibleRows, selectedSection, groupedSections]);

  // Unique values for select filters
  const uniqueSubDeptOptions = useMemo(() => {
    const depts = Array.from(
      new Set(gridRows.map((r) => r.sub_department_description as string)),
    ).sort();
    return depts.map((d) => ({ label: d, value: d }));
  }, [gridRows]);

  // Column-filtered rows for the grid
  const filteredGridRows = useMemo(() => {
    return gridRows.filter((r) => {
      if (
        appliedProduct &&
        !r.product_description
          .toLowerCase()
          .includes(appliedProduct.toLowerCase())
      )
        return false;
      if (
        appliedUpc &&
        !String(
          r.product_code != null ? Math.round(Number(r.product_code)) : "",
        ).includes(appliedUpc)
      )
        return false;
      if (appliedSubDept && r.sub_department_description !== appliedSubDept)
        return false;
      if (appliedAmount) {
        const amt = couponValueOf(r);
        if (appliedAmount.op === "gt" && !(amt > appliedAmount.amount))
          return false;
        if (appliedAmount.op === "lt" && !(amt < appliedAmount.amount))
          return false;
        if (appliedAmount.op === "eq" && amt !== appliedAmount.amount)
          return false;
      }
      return true;
    });
  }, [gridRows, appliedProduct, appliedUpc, appliedSubDept, appliedAmount]);

  // Aggregated coupon rows for the grid (grouped by UPC/product)
  const aggCouponRows = useMemo(() => {
    const map = new Map<string, AggRow>();
    filteredGridRows.forEach((r) => {
      const key =
        r.product_code != null
          ? String(Math.round(Number(r.product_code)))
          : r.product_description;
      if (!map.has(key)) {
        map.set(key, {
          product_code: key,
          product_description: r.product_description,
          sub_department_description: r.sub_department_description,
          count: 0,
          total: 0,
          uses: [],
        });
      }
      const agg = map.get(key)!;
      agg.count++;
      agg.total += couponValueOf(r);
      const existing = agg.uses.find((u) => u.sale_id === r.sale_id);
      if (existing) {
        existing.count++;
        existing.amount += couponValueOf(r);
      } else {
        agg.uses.push({
          sale_id: r.sale_id,
          sale_date: r.sale_date,
          cashier_name: r.cashier_name,
          storeid: r.storeid,
          store_number: r.store_number,
          terminal: r.terminal,
          count: 1,
          amount: couponValueOf(r),
          row: r,
        });
      }
    });
    const rows = Array.from(map.values());
    return sortMetric === "qty"
      ? rows.sort((a, b) => b.count - a.count)
      : rows.sort((a, b) => b.total - a.total);
  }, [filteredGridRows, sortMetric]);

  const toggleCoupon = (key: string) => {
    setExpandedCoupons((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Top KPI strip — scoped to selected store (or all stores if none selected)
  const totalCoupons = visibleRows.length;
  const totalAmount = sumCouponAmount(visibleRows);
  const avgPerCoupon = totalCoupons > 0 ? totalAmount / totalCoupons : 0;
  const uniqueProducts = new Set(visibleRows.map((c) => c.product_code)).size;
  const uniqueSubDepts = new Set(
    visibleRows.map((c) => c.sub_department_description),
  ).size;
  const vendorCount = visibleRows.filter((c) => c.vendor_coupon === 1).length;

  // Inner KPI strip — scoped to the selected section's rows
  const secCoupons = gridRows.length;
  const secAmount = sumCouponAmount(gridRows);
  const secAvg = secCoupons > 0 ? secAmount / secCoupons : 0;
  const secProducts = new Set(gridRows.map((c) => c.product_code)).size;

  // Header
  const groupName = selectedGroup?.group_name ?? "Group";
  const headerTitle = isGroup
    ? selectedKey
      ? selectedStoreName
      : groupName
    : storeName;
  const headerSuffix = selectedKey
    ? "— All Coupons"
    : isGroup
      ? "— All Stores"
      : "— All Coupons";

  const buildSaleId = (row: {
    storeid: number;
    sale_id: number;
    terminal: string;
    sale_date: string;
  }) => {
    const [y, m, d] = row.sale_date.split("T")[0].split("-");
    return `${row.storeid}-${row.sale_id}-${row.terminal}-${+m}-${+d}-${y}`;
  };

  const handleRowClick = (row: CouponItem) => {
    const saleId = buildSaleId(row);
    if (saleId === selectedSaleId) return;
    setSelectedSaleId(saleId);
    dispatch(setCouponReceiptLines([]));
    getCashierTransaction(
      ctx.url,
      ctx.token,
      row.sale_date,
      saleId,
      row.storeid,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const transactions = [...j.transaction].map((item) => ({
            ...item,
            transaction_id: item.sale_id.split("-")[1],
            qty: item.qty ?? 0,
          }));
          dispatch(setCouponReceiptLines(transactions));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleBack = () => {
    setSelectedSaleId("");
    dispatch(setCouponReceiptLines([]));
  };

  const exportTransaction = () => {
    if (!txLines.length) return;
    const headers = [
      "Line",
      "Description",
      "Qty",
      "Sale Type",
      "Total",
      "Coupon Amount",
    ];
    const rows = txLines.map((item) => [
      item.line_number,
      `"${(item.product_description ?? "").replace(/"/g, '""')}"`,
      item.qty ?? "",
      item.sale_type ?? "",
      item.is_coupon === 1 ? "" : (item.total_sales ?? ""),
      item.is_coupon === 1 ? couponValueOf(item) : "",
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const txId =
      txMeta?.transaction_id ?? txMeta?.sale_id?.split("-")[1] ?? "tx";
    const store = txMeta?.store_name?.replace(/\s+/g, "_") ?? "store";
    const date = txMeta?.sale_date?.split("T")[0] ?? "";
    a.href = url;
    a.download = `transaction_${store}_${date}_${txId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Transaction data
  const txLines: TransactionListItem[] = ctx.receiptLines;
  const txMeta = txLines[0] ?? null;
  const saleLines = txLines.filter(
    (r) => r.sale_type === "Sale" && r.is_coupon !== 1,
  );
  const couponLines = txLines.filter((r) => r.is_coupon === 1);
  const txGross = saleLines.reduce(
    (s: number, r) => s + (r.total_sales ?? 0),
    0,
  );
  const txCoupons = couponLines.reduce(
    (s: number, r) => s + couponValueOf(r),
    0,
  );
  const txTax = saleLines.reduce(
    (s: number, r) => s + (r.total_rounded_tax ?? 0),
    0,
  );
  const txNet = txGross - txCoupons;
  const txTotal = txNet + txTax;

  // Export
  const exportTitle = selectedKey
    ? isGroup
      ? selectedStoreName
      : selectedKey
    : "All Coupons";
  const exportSubtitle = `${isGroup ? groupName : storeName} · ${dateRangeLabel}`;

  // The grid's column filters, handed down as one bundle.
  const filters: GridFilters = {
    draftUpc,
    setDraftUpc,
    appliedUpc,
    setAppliedUpc,
    draftProduct,
    setDraftProduct,
    appliedProduct,
    setAppliedProduct,
    draftSubDept,
    setDraftSubDept,
    appliedSubDept,
    setAppliedSubDept,
    draftAmount,
    setDraftAmount,
    appliedAmount,
    setAppliedAmount,
    uniqueSubDeptOptions,
  };

  return (
    <div
      className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white"
      style={{ flex: 1, minWidth: 0 }}
    >
      {exportOpen && (
        <CouponsExportModal
          onClose={() => setExportOpen(false)}
          title={exportTitle}
          subtitle={exportSubtitle}
          rows={visibleRows}
        />
      )}

      <DetailHeader
        headerTitle={headerTitle}
        headerSuffix={headerSuffix}
        dateRangeLabel={dateRangeLabel}
        totalCoupons={totalCoupons}
        onExport={() => setExportOpen(true)}
      />

      {/* KPI strip */}
      {!ctx.isFetching && totalCoupons > 0 && (
        <KpiStrip
          totalCoupons={totalCoupons}
          totalAmount={totalAmount}
          avgPerCoupon={avgPerCoupon}
          uniqueProducts={uniqueProducts}
          uniqueSubDepts={uniqueSubDepts}
          vendorCount={vendorCount}
        />
      )}

      {ctx.isFetching && (
        <div className="flex-1 relative min-h-0">
          <LoadingIndicator message="Loading coupons..." />
        </div>
      )}

      {!ctx.isFetching && (
        <>
          {/* Tab bar — full width row */}
          <GroupTabs groupTab={groupTab} onTab={setGroupTab} />

          <div className="flex flex-1 min-h-0">
            {/* ── Left: group overview cards ── */}
            <SectionList
              groupedSections={groupedSections}
              selectedSection={selectedSection}
              onSelect={setSelectedSection}
            />

            {/* ── Right: coupon grid or transaction detail ── */}
            <div className="flex flex-col flex-1 min-w-0">
              {/* Selected section header */}
              {selectedSection && !selectedSaleId && (
                <SectionHeader
                  groupedSections={groupedSections}
                  selectedSection={selectedSection}
                  groupTab={groupTab}
                  dateRangeLabel={dateRangeLabel}
                  secCoupons={secCoupons}
                  secAmount={secAmount}
                  secAvg={secAvg}
                  secProducts={secProducts}
                />
              )}
              {selectedSaleId ? (
                /* Transaction detail */
                <TransactionDetail
                  txMeta={txMeta}
                  txLines={txLines}
                  onBack={handleBack}
                  onExport={exportTransaction}
                  txCoupons={txCoupons}
                  txTax={txTax}
                  txNet={txNet}
                  txTotal={txTotal}
                />
              ) : (
                /* Coupon grid */
                <CouponGrid
                  gridRows={gridRows}
                  selectedSection={selectedSection}
                  filters={filters}
                  aggCouponRows={aggCouponRows}
                  expandedCoupons={expandedCoupons}
                  toggleCoupon={toggleCoupon}
                  handleRowClick={handleRowClick}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CouponDetailPanel;
