// Hooks
import { useState, useMemo } from "react";
import { useStoreName } from "../../../../hooks";
import { useCouponContext } from "../hooks";

// Redux
import { isGroupSearch } from "../../../../features/searchSlice";

// Utils
import { applyStoreNumberToName, numbersByStoreId } from "../../../../utils/storeIdentity";
import { sumCouponAmount } from "../../../../utils/couponValue";
import { formatCurrency2 } from "../../../../utils";

// Components
import BackButton from "../../../../components-dev/BackButton";
import PageInfoButton from "../../../../components-dev/PageInfoButton";

interface CouponListPanelProps {
  selectedKey: string;
  onSelect: (key: string) => void;
  sortMetric: "amount" | "qty";
  onSortMetric: (v: "amount" | "qty") => void;
  onOpenSearch: () => void;
}

/** The Coupons page's left panel: a navy header with the date range, record count, search button and Amt/Qty sort,
 *  then the store list (with an "All stores" row on group searches) showing each store's coupon count and value. */
const CouponListPanel = ({
  selectedKey,
  onSelect,
  sortMetric,
  onSortMetric,
  onOpenSearch,
}: CouponListPanelProps) => {
  const ctx = useCouponContext();
  const { selectedGroup, assignedStores } = ctx;
  const groupStores = ctx.selectedGroupStores;

  const [query, setQuery] = useState("");

  const storeName = useStoreName(Number(ctx.lastStore));
  const isGroup = isGroupSearch(ctx.type);

  const fmtRangePart = (mdy: string, withYear = false) => {
    const [m, d, y] = mdy.split("/");
    return withYear ? `${+m}/${+d}/${y}` : `${+m}/${+d}`;
  };
  const dateLabel = `${fmtRangePart(ctx.startDate)} – ${fmtRangePart(ctx.endDate, true)}`;

  const totalAmount = useMemo(
    () => sumCouponAmount(ctx.coupons),
    [ctx.coupons],
  );

  // All modes: flat store list sorted by amount desc
  const storeItems = useMemo(() => {
    // Keyed on storeid + store_number, not storeid alone — a few storeids
    // cover two physical locations. See utils/storeIdentity.
    const numbersById = numbersByStoreId(
      ctx.coupons,
      (c) => c.storeid,
      (c) => c.store_number,
    );
    // Collected per store, then totalled with sumCouponAmount: a running add
    // can't dedupe the transaction-level fallback (see utils/couponValue).
    const map = new Map<string, { name: string; rows: typeof ctx.coupons }>();
    ctx.coupons.forEach((c) => {
      const id = `${c.storeid}__${c.store_number}`;
      const cur = map.get(id);
      if (cur) {
        cur.rows.push(c);
        return;
      }
      map.set(id, {
        name: applyStoreNumberToName(
          assignedStores.find((s) => s.storeid === Number(c.storeid))
            ?.store_name ??
            groupStores.find((s) => s.storeid === Number(c.storeid))
              ?.store_name ??
            storeName ??
            String(c.storeid),
          c.store_number,
          numbersById[c.storeid] ?? [],
        ),
        rows: [c],
      });
    });
    return Array.from(map.entries())
      .map(([id, { name, rows }]) => ({
        key: id,
        label: name,
        count: rows.length,
        total: sumCouponAmount(rows),
      }))
      .sort((a, b) =>
        sortMetric === "qty" ? b.count - a.count : b.total - a.total,
      );
  }, [ctx.coupons, assignedStores, storeName, sortMetric]);

  const filtered = query
    ? storeItems.filter((i) =>
        i.label.toLowerCase().includes(query.toLowerCase()),
      )
    : storeItems;

  return (
    <div
      className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white flex-shrink-0"
      style={{ width: "22%" }}
    >
      {/* Navy header */}
      <div
        className="flex-shrink-0 px-3 pt-1 pb-2.5 flex flex-col gap-0"
        style={{ background: "rgb(var(--color-brand-navy))" }}
      >
        <div className="flex items-end gap-3 min-h-[24px]">
          <span className="text-[13px] font-semibold text-custom-white flex-shrink-0">
            Coupons
          </span>
          <span className="text-custom-white text-[10px] flex-shrink-0">
            {dateLabel}
          </span>
          <div className="flex-1" />
          {ctx.coupons.length > 0 && (
            <div className="flex items-baseline gap-1 flex-shrink-0">
              <span className="text-custom-white text-[10px] uppercase tracking-wide">
                Records
              </span>
              <span className="text-[13px] font-medium text-custom-white">
                {ctx.coupons.length}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-custom-white/[0.08]">
          <BackButton onClick={onOpenSearch} helpAnchor="search" />
          {isGroup && selectedGroup?.group_name && (
            <div className="flex flex-col leading-tight truncate">
              <span className="text-[11px] font-medium text-custom-white truncate">
                {selectedGroup.group_name}
              </span>
              {groupStores.length > 0 && (
                <span className="text-[9px] text-custom-white">
                  {groupStores.length} stores
                </span>
              )}
            </div>
          )}
          {!isGroup && ctx.lastStore && (
            <span className="text-[11px] font-medium text-custom-white truncate">
              {storeName}
            </span>
          )}
          <div className="flex-1" />
          <div data-help="metric" className="flex items-center gap-0.5 flex-shrink-0">
            {(["amount", "qty"] as const).map((m) => (
              <button
                key={m}
                onClick={() => onSortMetric(m)}
                className={`px-2 py-0.5 text-[9px] font-medium rounded transition-colors ${
                  sortMetric === m
                    ? "bg-custom-white/20 text-custom-white"
                    : "text-custom-white/95 hover:text-custom-white/70"
                }`}
              >
                {m === "amount" ? "Amt" : "Qty"}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

          <div className="relative flex-shrink-0">
            <PageInfoButton page="coupons" />
          </div>
        </div>
      </div>

      {/* Search input — only shown for groups with many stores */}
      {isGroup && storeItems.length > 6 && (
        <div className="px-2.5 py-2 border-b border-line_hair flex-shrink-0">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stores…"
            className="w-full text-[11px] text-content px-2.5 py-1.5 rounded-md bg-fill_soft border border-line_field placeholder:text-content/35"
            style={{
              outline: "none",
              WebkitAppearance: "none",
              boxShadow: "none",
            }}
          />
        </div>
      )}

      {/* Flat store list */}
      <div data-help="store-list" className="flex-1 overflow-y-auto thin-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-[11px] text-content/95">
            No results
          </div>
        ) : (
          <div className="divide-y divide-line_faint">
            {/* All stores row — group mode only */}
            {isGroup && (
              <button
                onClick={() => onSelect("")}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                  selectedKey === "" ? "bg-custom-white" : "hover:bg-fill_soft"
                }`}
                style={
                  selectedKey === ""
                    ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.18)" }
                    : undefined
                }
              >
                <span className="text-[12px] font-semibold text-content">
                  All stores
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] text-content/95">
                    {ctx.coupons.length}
                  </span>
                  <span className="text-[11px] font-medium text-content/95">
                    {formatCurrency2(totalAmount)}
                  </span>
                </div>
              </button>
            )}

            {filtered.map((item) => {
              const isSel = selectedKey === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onSelect(isSel && isGroup ? "" : item.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                    isSel ? "bg-custom-white" : "hover:bg-fill_soft"
                  }`}
                  style={
                    isSel
                      ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.18)" }
                      : undefined
                  }
                >
                  <span className="text-[12px] text-content truncate flex-1 mr-2">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-content/95">
                      {item.count}
                    </span>
                    <span className="text-[11px] font-medium text-content/95">
                      {formatCurrency2(item.total)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponListPanel;
