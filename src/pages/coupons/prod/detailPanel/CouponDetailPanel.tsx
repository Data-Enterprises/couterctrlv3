// Hooks
import { useState, useMemo, useEffect, useRef } from "react";
import { useStoreName } from "../../../../hooks";
import { useCouponContext } from "../hooks";
import { useCouponReceipt, useGridFilters } from "./hooks";

// Redux
import { setCouponReceiptLines } from "../../../../features/couponSlice";
import { isGroupSearch } from "../../../../features/searchSlice";

// Utils
import { applyStoreNumberToName } from "../../../../utils/storeIdentity";
import { sumCouponAmount } from "../../../../utils/couponValue";
import { fmtDateRange } from "../utils";
import {
  aggregateGridCoupons,
  buildAllSections,
  filterGridRows,
  scopeFigures,
} from "./utils";

// Interfaces
import type { GroupTab } from "../interfaces";
import type { GridFilters } from "./interfaces";

// Components
import LoadingIndicator from "../../../../components/loading/LoadingIndicator";
import CouponsExportModal from "./export/CouponsExportModal";
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
  const ctx = useCouponContext();
  const { dispatch, selectedGroup } = ctx;
  const isGroup = isGroupSearch(ctx.type);
  const storeName = useStoreName(Number(ctx.lastStore));
  const assignedStores = ctx.assignedStores;

  const [exportOpen, setExportOpen] = useState<boolean>(false);
  const [groupTab, setGroupTab] = useState<GroupTab>("subdept");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const {
    selectedSaleId,
    setSelectedSaleId,
    txLines,
    txMeta,
    totals: { txCoupons, txTax, txNet, txTotal },
    handleRowClick,
    handleBack,
    exportTransaction,
  } = useCouponReceipt(ctx);
  const { bundle, applied, clear: clearFilters } = useGridFilters(ctx);
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

  const dateRangeLabel = fmtDateRange(ctx.startDate, ctx.endDate);

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
    if (lastSection.current !== selectedSection) clearFilters();
    lastSection.current = selectedSection;
    setExpandedCoupons(new Set());
    dispatch(setCouponReceiptLines([]));
  }, [selectedSection]);

  // Pre-compute all groupings so tab switching is instant
  const allSections = useMemo(
    () => buildAllSections(visibleRows, sortMetric),
    [visibleRows, sortMetric],
  );

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
  const filteredGridRows = useMemo(
    () => filterGridRows(gridRows, applied),
    [gridRows, applied.product, applied.upc, applied.subDept, applied.amount],
  );

  // Aggregated coupon rows for the grid (grouped by UPC/product)
  const aggCouponRows = useMemo(
    () => aggregateGridCoupons(filteredGridRows, sortMetric),
    [filteredGridRows, sortMetric],
  );

  const toggleCoupon = (key: string) => {
    setExpandedCoupons((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Top KPI strip — scoped to selected store (or all stores if none selected)
  const {
    totalCoupons,
    totalAmount,
    avgPerCoupon,
    uniqueProducts,
    uniqueSubDepts,
    vendorCount,
  } = scopeFigures(visibleRows);

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

  // Export
  const exportTitle = selectedKey
    ? isGroup
      ? selectedStoreName
      : selectedKey
    : "All Coupons";
  const exportSubtitle = `${isGroup ? groupName : storeName} · ${dateRangeLabel}`;

  // The grid's column filters, handed down as one bundle.
  const filters: GridFilters = { ...bundle, uniqueSubDeptOptions };

  return (
    <div className="cc-panel shadow-lg" style={{ flex: 1, minWidth: 0 }}>
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
