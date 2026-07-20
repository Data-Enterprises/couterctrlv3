import { useState, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/20/solid";
import { useAppSelector, useStoreName } from "../../hooks";
import { formatCurrency2 } from "../../utils";
import InfoPopover from "../../components/InfoPopover";
import { COUPONS_INFO } from "./couponsInfo";

interface CouponListPanelProps {
  selectedKey: string;
  onSelect: (key: string) => void;
  sortMetric: "amount" | "qty";
  onSortMetric: (v: "amount" | "qty") => void;
  onOpenSearch: () => void;
}

const CouponListPanel = ({
  selectedKey,
  onSelect,
  sortMetric,
  onSortMetric,
  onOpenSearch,
}: CouponListPanelProps) => {
  const state = useAppSelector((s) => s.coupons);
  const search = useAppSelector((s) => s.search);
  const selectedGroup = useAppSelector((s) => s.search.selectedGroup);
  const groupStores = useAppSelector((s) => s.user.selectedGroupStores);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);

  const [query, setQuery] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);

  const storeName = useStoreName(Number(search.lastStore));
  const isGroup = search.type === "Group";

  const fmtRangePart = (mdy: string, withYear = false) => {
    const [m, d, y] = mdy.split("/");
    return withYear ? `${+m}/${+d}/${y}` : `${+m}/${+d}`;
  };
  const dateLabel = `${fmtRangePart(search.startDate)} – ${fmtRangePart(search.endDate, true)}`;

  const totalAmount = useMemo(
    () => state.coupons.reduce((s, c) => s + c.coupon_amount, 0),
    [state.coupons],
  );

  // All modes: flat store list sorted by amount desc
  const storeItems = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; total: number }
    >();
    state.coupons.forEach((c) => {
      const id = String(c.storeid);
      const cur = map.get(id) ?? {
        name:
          assignedStores.find((s) => s.storeid === Number(c.storeid))
            ?.store_name ??
          groupStores.find((s) => s.storeid === Number(c.storeid))
            ?.store_name ??
          storeName ??
          id,
        count: 0,
        total: 0,
      };
      map.set(id, {
        ...cur,
        count: cur.count + 1,
        total: cur.total + c.coupon_amount,
      });
    });
    return Array.from(map.entries())
      .map(([id, { name, count, total }]) => ({
        key: id,
        label: name,
        count,
        total,
      }))
      .sort((a, b) =>
        sortMetric === "qty" ? b.count - a.count : b.total - a.total,
      );
  }, [state.coupons, assignedStores, storeName, sortMetric]);

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
        style={{ background: "#1e2a4a" }}
      >
        <div className="flex items-end gap-3 min-h-[24px]">
          <span className="text-[13px] font-semibold text-custom-white flex-shrink-0">
            Coupons
          </span>
          <span className="text-custom-white text-[10px] flex-shrink-0">
            {dateLabel}
          </span>
          <div className="flex-1" />
          {state.coupons.length > 0 && (
            <div className="flex items-baseline gap-1 flex-shrink-0">
              <span className="text-custom-white text-[10px] uppercase tracking-wide">
                Records
              </span>
              <span className="text-[13px] font-medium text-custom-white">
                {state.coupons.length}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-white/[0.08]">
          <button
            onClick={onOpenSearch}
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-custom-white/60 hover:text-custom-white hover:border-white/40 transition-colors flex-shrink-0"
            aria-label="New search"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
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
          {!isGroup && search.lastStore && (
            <span className="text-[11px] font-medium text-custom-white truncate">
              {storeName}
            </span>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {(["amount", "qty"] as const).map((m) => (
              <button
                key={m}
                onClick={() => onSortMetric(m)}
                className={`px-2 py-0.5 text-[9px] font-medium rounded transition-colors ${
                  sortMetric === m
                    ? "bg-custom-white/20 text-custom-white"
                    : "text-custom-white/40 hover:text-custom-white/70"
                }`}
              >
                {m === "amount" ? "Amt" : "Qty"}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setInfoOpen((prev) => !prev)}
              title="About this view"
              className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-custom-white/50 hover:text-custom-white hover:border-white/40 transition-colors"
            >
              <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
            </button>
            {infoOpen && (
              <InfoPopover
                title={COUPONS_INFO.title}
                purpose={COUPONS_INFO.purpose}
                glossary={COUPONS_INFO.glossary}
                onClose={() => setInfoOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Search input — only shown for groups with many stores */}
      {isGroup && storeItems.length > 6 && (
        <div className="px-2.5 py-2 border-b border-gray-100 flex-shrink-0">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stores…"
            className="w-full text-[11px] text-content px-2.5 py-1.5 rounded-md bg-gray-50 border border-gray-200 placeholder:text-content/35"
            style={{
              outline: "none",
              WebkitAppearance: "none",
              boxShadow: "none",
            }}
          />
        </div>
      )}

      {/* Flat store list */}
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-[11px] text-content/50">
            No results
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* All stores row — group mode only */}
            {isGroup && (
              <button
                onClick={() => onSelect("")}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                  selectedKey === "" ? "bg-cusom-white" : "hover:bg-gray-50"
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
                  <span className="text-[11px] text-content/45">
                    {state.coupons.length}
                  </span>
                  <span className="text-[11px] font-medium text-content/70">
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
                    isSel ? "bg-custom-white" : "hover:bg-gray-50"
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
                    <span className="text-[11px] text-content/45">
                      {item.count}
                    </span>
                    <span className="text-[11px] font-medium text-content/70">
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
