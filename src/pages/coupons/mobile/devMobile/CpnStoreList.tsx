import { useMemo, useState } from "react";
import {
  applyStoreNumberToName,
  numbersByStoreId,
} from "../../../../utils/storeIdentity";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import { formatCurrency2, resolveStoreName } from "../../../../utils";
import { useAppSelector } from "../../../../hooks";
import type { CouponItem } from "../../../../interfaces";
import MobilePerfHeader from "../../../../components/mobile/MobilePerfHeader";
import HeaderIconButton from "../../../../components/HeaderIconButton";
import { COUPONS_INFO } from "../../couponsInfo";
import CpnExportSheet from "./CpnExportSheet";
import CpnSortToggle from "./CpnSortToggle";
import { sumCouponAmount } from "../../../../utils/couponValue";

interface Props {
  coupons: CouponItem[];
  groupName: string;
  dateRangeLabel: string;
  sortMetric: "amount" | "qty";
  onSortMetric: (v: "amount" | "qty") => void;
  /** `null, null` is the "All stores" row — the whole group, unscoped. */
  onSelect: (storeId: number | null, storeNumber: string | null) => void;
  onSearch: () => void;
}

const CpnStoreList = ({
  coupons,
  groupName,
  dateRangeLabel,
  sortMetric,
  onSortMetric,
  onSelect,
  onSearch,
}: Props) => {
  const [exportOpen, setExportOpen] = useState(false);
  // Store names come from assignedStores, never the coupon payload — see
  // utils/getStoreName. groupStores covers stores in the searched group that
  // aren't personally assigned to this user, matching CouponListPanel.
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const groupStores = useAppSelector((s) => s.user.selectedGroupStores);
  const totalAmount = sumCouponAmount(coupons);
  const avgPerCoupon = coupons.length > 0 ? totalAmount / coupons.length : 0;
  const uniqueProducts = new Set(coupons.map((c) => c.product_code)).size;

  const stores = useMemo(() => {
    // Keyed on storeid + store_number — see utils/storeIdentity.
    const numbersById = numbersByStoreId(
      coupons,
      (c) => c.storeid,
      (c) => c.store_number,
    );
    const map = new Map<
      string,
      { storeId: number; storeNumber: string; name: string; rows: CouponItem[] }
    >();
    coupons.forEach((c) => {
      const key = `${c.storeid}__${c.store_number}`;
      // Rows collected first, then totalled — a running sum can't dedupe the
      // transaction-level coupon fallback. See utils/couponValue.
      const cur = map.get(key);
      if (cur) {
        cur.rows.push(c);
        return;
      }
      map.set(key, {
        storeId: c.storeid,
        storeNumber: c.store_number,
        name: applyStoreNumberToName(
          resolveStoreName(assignedStores, groupStores, c.storeid),
          c.store_number,
          numbersById[c.storeid] ?? [],
        ),
        rows: [c],
      });
    });
    const rows = Array.from(map.values()).map((v) => ({
      storeId: v.storeId,
      storeNumber: v.storeNumber,
      name: v.name,
      count: v.rows.length,
      total: sumCouponAmount(v.rows),
    }));
    return sortMetric === "qty"
      ? rows.sort((a, b) => b.count - a.count)
      : rows.sort((a, b) => b.total - a.total);
  }, [coupons, sortMetric, assignedStores, groupStores]);

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] overflow-hidden">
      <MobilePerfHeader
        pageName="Coupons"
        storeName={groupName}
        dateRange={dateRangeLabel}
        onSearch={onSearch}
        info={COUPONS_INFO}
        actions={
          <>
            <CpnSortToggle value={sortMetric} onChange={onSortMetric} />
            <HeaderIconButton
              onClick={() => setExportOpen(true)}
              title="Export CSV"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            </HeaderIconButton>
          </>
        }
      />

      {/* KPI strip */}
      <div className="flex-shrink-0 grid grid-cols-4 bg-custom-white border-b border-gray-100">
        {[
          { label: "Coupons", value: String(coupons.length) },
          { label: "Total", value: formatCurrency2(totalAmount) },
          { label: "Avg", value: formatCurrency2(avgPerCoupon) },
          { label: "Products", value: String(uniqueProducts) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="px-2.5 py-1.5 border-r border-gray-100 last:border-r-0"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85">
              {label}
            </div>
            <div className="text-[12px] font-bold text-content mt-0.5 tabular-nums">
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* pb-14 clears the fixed bottom tab bar. */}
      <div className="flex-1 overflow-y-auto bg-gray-50 pb-14">
        {/* Group-wide row, matching desktop's "All stores". Without it the
            group total is visible in the KPI strip but not explorable — you
            could only ever drill into one store at a time. */}
        <button
          onClick={() => onSelect(null, null)}
          className="w-full flex items-center px-3 py-2.5 bg-custom-white border-b border-gray-100 text-left active:bg-gray-50 gap-3"
        >
          <span className="text-[12px] font-semibold text-content flex-1 truncate">
            All stores
          </span>
          <span className="text-[10px] text-content/85 flex-shrink-0">
            {coupons.length}
          </span>
          <span className="text-[11px] font-semibold text-content flex-shrink-0 tabular-nums">
            {formatCurrency2(totalAmount)}
          </span>
          <svg
            className="w-4 h-4 text-content/85 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {stores.map(({ storeId, storeNumber, name, count, total }) => (
          <button
            key={`${storeId}__${storeNumber}`}
            onClick={() => onSelect(storeId, storeNumber)}
            className="w-full flex items-center px-3 py-2.5 bg-custom-white border-b border-gray-100 text-left active:bg-gray-50 gap-3"
          >
            <span className="text-[12px] font-medium text-content flex-1 truncate">
              {name}
            </span>
            <span className="text-[10px] text-content/85 flex-shrink-0">
              {count}
            </span>
            <span className="text-[11px] font-semibold text-content flex-shrink-0 tabular-nums">
              {formatCurrency2(total)}
            </span>
            <svg
              className="w-4 h-4 text-content/85 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>

      {exportOpen && (
        <CpnExportSheet
          onClose={() => setExportOpen(false)}
          title={groupName}
          subtitle={dateRangeLabel}
          rows={coupons}
        />
      )}
    </div>
  );
};

export default CpnStoreList;
