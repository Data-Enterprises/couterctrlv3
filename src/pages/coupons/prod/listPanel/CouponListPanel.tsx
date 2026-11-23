// Hooks
import { useState, useMemo } from "react";
import { useStoreName } from "../../../../hooks";
import { useCouponContext } from "../hooks";

// Redux
import { isGroupSearch } from "../../../../features/searchSlice";

// Utils
import { sumCouponAmount } from "../../../../utils/couponValue";
import { fmtDateRange } from "../utils";
import { buildStoreItems } from "./utils";

// Components
import CouponListHeader from "./components/CouponListHeader";
import StoreListRow from "./components/StoreListRow";

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
  const [query, setQuery] = useState<string>("");
  const storeName = useStoreName(Number(ctx.lastStore));

  const totalAmount = useMemo(
    () => sumCouponAmount(ctx.coupons),
    [ctx.coupons],
  );

  // All modes: flat store list sorted by amount desc
  const storeItems = useMemo(
    () =>
      buildStoreItems(
        ctx.coupons,
        assignedStores,
        groupStores,
        storeName,
        sortMetric,
      ),
    [ctx.coupons, assignedStores, storeName, sortMetric],
  );

  const isGroup = isGroupSearch(ctx.type);
  const filtered = query
    ? storeItems.filter((i) =>
        i.label.toLowerCase().includes(query.toLowerCase()),
      )
    : storeItems;

  return (
    <div className="cc-panel shadow-lg flex-shrink-0" style={{ width: "22%" }}>
      <CouponListHeader
        dateLabel={fmtDateRange(ctx.startDate, ctx.endDate)}
        recordCount={ctx.coupons.length}
        groupName={(isGroup && selectedGroup?.group_name) || null}
        groupStoreCount={groupStores.length}
        storeName={!isGroup && ctx.lastStore ? (storeName ?? "") : null}
        sortMetric={sortMetric}
        onSortMetric={onSortMetric}
        onOpenSearch={onOpenSearch}
      />

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
      <div
        data-help="store-list"
        className="flex-1 overflow-y-auto thin-scrollbar"
      >
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-[11px] text-content/95">
            No results
          </div>
        ) : (
          <div className="divide-y divide-line_faint">
            {/* All stores row — group mode only */}
            {isGroup && (
              <StoreListRow
                label="All stores"
                count={ctx.coupons.length}
                total={totalAmount}
                selected={selectedKey === ""}
                isAll
                onClick={() => onSelect("")}
              />
            )}

            {filtered.map((item) => {
              const isSel = selectedKey === item.key;
              return (
                <StoreListRow
                  key={item.key}
                  label={item.label}
                  count={item.count}
                  total={item.total}
                  selected={isSel}
                  onClick={() => onSelect(isSel && isGroup ? "" : item.key)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponListPanel;
