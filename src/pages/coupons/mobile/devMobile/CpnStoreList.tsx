import { useMemo } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { formatCurrency2 } from "../../../../utils";
import type { CouponItem } from "../../../../interfaces";

interface Props {
  coupons: CouponItem[];
  groupName: string;
  dateRangeLabel: string;
  sortMetric: "amount" | "qty";
  onSortMetric: (v: "amount" | "qty") => void;
  onSelect: (storeId: number) => void;
  onSearch: () => void;
}

const CpnStoreList = ({ coupons, groupName, dateRangeLabel, sortMetric, onSortMetric, onSelect, onSearch }: Props) => {
  const totalAmount = coupons.reduce((s, c) => s + c.coupon_amount, 0);

  const stores = useMemo(() => {
    const map = new Map<number, { name: string; count: number; total: number }>();
    coupons.forEach((c) => {
      const cur = map.get(c.storeid) ?? { name: c.store_name, count: 0, total: 0 };
      map.set(c.storeid, { ...cur, count: cur.count + 1, total: cur.total + c.coupon_amount });
    });
    const rows = Array.from(map.entries()).map(([id, data]) => ({ storeId: id, ...data }));
    return sortMetric === "qty" ? rows.sort((a, b) => b.count - a.count) : rows.sort((a, b) => b.total - a.total);
  }, [coupons, sortMetric]);

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] overflow-hidden">
      <div className="flex-shrink-0 px-3 pt-2 pb-2.5" style={{ background: "#1e2a4a" }}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[13px] font-semibold text-custom-white">{groupName}</div>
            <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
              {dateRangeLabel}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex border border-white/20 rounded overflow-hidden">
              {(["amount", "qty"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onSortMetric(m)}
                  className={`px-2 py-1 text-[9px] font-medium ${sortMetric === m ? "bg-white/20 text-custom-white" : "text-custom-white/85"}`}
                >
                  {m === "amount" ? "Amt" : "Qty"}
                </button>
              ))}
            </div>
            <button
              onClick={onSearch}
              className="w-[28px] h-[28px] flex items-center justify-center rounded border border-white/20 text-custom-white/85"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-baseline gap-3 mt-2 pt-1.5 border-t border-white/[0.08]">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[8px] uppercase tracking-wide text-custom-white/85">Records</span>
            <span className="text-[12px] font-semibold text-custom-white">{coupons.length}</span>
          </div>
          <span className="text-[10px] font-medium text-custom-white/85">{formatCurrency2(totalAmount)} total</span>
          <span className="text-[10px] text-custom-white/85">{stores.length} stores</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        {stores.map(({ storeId, name, count, total }) => (
          <button
            key={storeId}
            onClick={() => onSelect(storeId)}
            className="w-full flex items-center px-3 py-2.5 bg-custom-white border-b border-gray-100 text-left active:bg-gray-50 gap-3"
          >
            <span className="text-[12px] font-medium text-content flex-1 truncate">{name}</span>
            <span className="text-[10px] text-content/85 flex-shrink-0">{count}</span>
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
    </div>
  );
};

export default CpnStoreList;
