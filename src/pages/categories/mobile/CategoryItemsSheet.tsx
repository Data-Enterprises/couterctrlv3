import { useEffect, useMemo, useRef, useState } from "react";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";
import { fmtDayLabel, fmtRangeLabel } from "../../../utils/dateLabels";
import {
  setSelectedCategory,
  setItemThreshold,
  CATEGORY_THRESHOLD_DEFAULT,
  ITEM_THRESHOLD_DEFAULT,
} from "../../../features/categoriesSlice";
import type { SevFilter } from "../../../features/salesLedgerSlice";
import { BADGE_BG, BADGE_COLOR } from "../../sales/shared/ledgerUtils";
import BottomSheet from "../../../components/BottomSheet";
import SevBadge from "../../../components/SevBadge";
import SevChips from "../../../components/SevChips";
import {
  getTier,
  tierOfDelta,
  shiftIso,
  LW_OFFSET,
  LY_OFFSET,
  type CategoryDay,
} from "../categoriesUtils";
import type { CatItem, CatSalesHourly } from "../../../interfaces";
import { deltaPillClass } from "../../../utils/grading";

/**
 * One category's week, as a BottomSheet — the same construction as the
 * sub-department sheet on Sales mobile, and as `VendorItemsSheet`.
 *
 * Picking a category from the list opens this; there is no separate report
 * screen, because the category list is already the screen it was picked from.
 *
 * The day strip lives on the list screen behind this, same as Sales. The one
 * addition over Sales' sheet is the Items | Hours tab strip this page has on
 * desktop; hourly is fetched only when the Hours tab is first opened.
 */

type Tab = "items" | "hours";

const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

const ampm = (h: number) => {
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}${suffix}`;
};

interface Agg {
  net: number;
  qty: number;
  weight: number;
}
const empty = (): Agg => ({ net: 0, qty: 0, weight: 0 });

const netOf = (r: { total_sales: number; total_tax: number }) =>
  r.total_sales - r.total_tax;

const aggItems = (rows: CatItem[], day: string | null) => {
  const out = new Map<string, Agg & { desc: string }>();
  for (const r of rows) {
    if (day && !r.sale_date.startsWith(day)) continue;
    const cur = out.get(r.product_code) ?? {
      desc: r.product_description,
      ...empty(),
    };
    cur.net += netOf(r);
    cur.qty += r.qty;
    cur.weight += r.weight ?? 0;
    out.set(r.product_code, cur);
  }
  return out;
};

const aggHours = (rows: CatSalesHourly[], day: string | null) => {
  const out = new Map<number, Agg>();
  for (const r of rows) {
    if (day && !r.sale_date.startsWith(day)) continue;
    const cur = out.get(r.hour) ?? empty();
    cur.net += netOf(r);
    cur.qty += r.qty;
    out.set(r.hour, cur);
  }
  return out;
};

const CategoryItemsSheet = ({ onLoadHourly }: { onLoadHourly: () => void }) => {
  const dispatch = useAppDispatch();
  const {
    rows,
    metric,
    threshold,
    itemThreshold,
    selectedCategory,
    selectedDay,
    items,
    loadingItems,
    hourly,
    loadingHourly,
  } = useAppSelector((s) => s.categories);

  const [tab, setTab] = useState<Tab>("items");
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [thresholdInput, setThresholdInput] = useState(
    itemThreshold === null ? "" : String(itemThreshold),
  );
  const sheetCloseRef = useRef<(() => void) | null>(null);

  const isQty = metric === "qty";
  const activeThreshold = threshold ?? CATEGORY_THRESHOLD_DEFAULT;

  const itemThresholdRef = useRef<number>(
    itemThreshold ?? ITEM_THRESHOLD_DEFAULT,
  );
  if (itemThreshold != null) itemThresholdRef.current = itemThreshold;
  const effItemThreshold = itemThresholdRef.current;

  const row = useMemo(
    () => rows.find((r) => r.category === selectedCategory) ?? null,
    [rows, selectedCategory],
  );

  /** Hourly on first open of the tab, not on mount. */
  const hourlyRequested = useRef(false);
  useEffect(() => {
    if (tab !== "hours" || hourlyRequested.current) return;
    hourlyRequested.current = true;
    onLoadHourly();
  }, [tab, onLoadHourly]);

  // A different category means the loaded hourly belongs to the old one.
  useEffect(() => {
    hourlyRequested.current = false;
    setTab("items");
    setSevFilter("all");
  }, [selectedCategory]);

  const dayEntry: CategoryDay | null = selectedDay
    ? (row?.days.find((d) => d.date === selectedDay) ?? null)
    : null;

  const val = (a: Agg) => (isQty ? a.qty : a.net);
  const show = (a: Agg) =>
    isQty ? `${a.qty.toLocaleString()} u` : formatCurrency2(a.net);
  const fmtVal = (v: number) =>
    isQty ? `${v.toLocaleString()} u` : formatCurrency2(v);

  const pct = (tw: number, prior: number) =>
    prior > 0 ? ((tw - prior) / prior) * 100 : null;

  const pillClass = (n: number | null, t = activeThreshold) =>
    deltaPillClass(n, t);

  /** TY narrows with the day strip; LW and LY stay at week scope — item rows
   *  carry no aligned comparison dates of their own. */
  const rowsFor = useMemo(() => {
    const build = <K,>(
      tw: Map<K, Agg & { desc?: string }>,
      lw: Map<K, Agg>,
      ly: Map<K, Agg>,
    ) =>
      [...tw.entries()].map(([key, t]) => {
        const l = lw.get(key) ?? null;
        const y = ly.get(key) ?? null;
        const lwDelta = l ? pct(val(t), val(l)) : null;
        const lyDelta = y ? pct(val(t), val(y)) : null;
        return {
          key,
          desc: t.desc,
          ty: t,
          lw: l,
          ly: y,
          lwDelta,
          lyDelta,
          // Last year when there is one, else last week — the same fallback
          // the category's own tier uses.
          sev: tierOfDelta(lyDelta ?? lwDelta, effItemThreshold),
        };
      });

    if (tab === "items") {
      return build(
        aggItems(items.tw, selectedDay),
        aggItems(items.lw, null),
        aggItems(items.ly, null),
      ).sort((a, b) => val(b.ty) - val(a.ty));
    }
    return build(
      aggHours(hourly.tw, selectedDay),
      aggHours(hourly.lw, null),
      aggHours(hourly.ly, null),
    ).sort((a, b) => Number(a.key) - Number(b.key));
  }, [tab, items, hourly, selectedDay, isQty, effItemThreshold]);

  const counts: Record<SevFilter, number> = {
    all: rowsFor.length,
    critical: rowsFor.filter((i) => i.sev === "critical").length,
    watch: rowsFor.filter((i) => i.sev === "watch").length,
    healthy: rowsFor.filter((i) => i.sev === "healthy").length,
  };
  const visible =
    sevFilter === "all" ? rowsFor : rowsFor.filter((i) => i.sev === sevFilter);

  if (!row) return null;

  const tier = getTier(row, activeThreshold, metric);

  /* ── KPI values: the whole week, or the selected day ─────────────────── */
  const pick = (net: number, qty: number) => (isQty ? qty : net);
  const kTW = dayEntry
    ? pick(dayEntry.twNet, dayEntry.twQty)
    : pick(row.twNet, row.twQty);
  const kLWRaw = dayEntry
    ? isQty
      ? dayEntry.lwQty
      : dayEntry.lwNet
    : row.hasLW
      ? pick(row.lwNet, row.lwQty)
      : null;
  const kLYRaw = dayEntry
    ? isQty
      ? dayEntry.lyQty
      : dayEntry.lyNet
    : row.hasLY
      ? pick(row.lyNet, row.lyQty)
      : null;
  const kTWForLW = dayEntry
    ? pick(dayEntry.twNet, dayEntry.twQty)
    : pick(row.twNetForLW, row.twQtyForLW);
  const kTWForLY = dayEntry
    ? pick(dayEntry.twNet, dayEntry.twQty)
    : pick(row.twNetForLY, row.twQtyForLY);
  const kLWPct = kLWRaw === null ? null : pct(kTWForLW, kLWRaw);
  const kLYPct = kLYRaw === null ? null : pct(kTWForLY, kLYRaw);

  const labelFor = (offset: number) => {
    const first = row.days[0]?.date ?? "";
    const last = row.days.at(-1)?.date ?? "";
    return selectedDay
      ? fmtDayLabel(shiftIso(selectedDay, offset))
      : fmtRangeLabel(shiftIso(first, offset), shiftIso(last, offset));
  };
  const dayLabel = labelFor(0);
  const lwLabel = labelFor(LW_OFFSET);
  const lyLabel = labelFor(LY_OFFSET);

  const sevLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  const loading = tab === "items" ? loadingItems : loadingHourly;

  return (
    <BottomSheet
      onClose={() => dispatch(setSelectedCategory(null))}
      closeRef={sheetCloseRef}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-content truncate">
            {row.uncategorized
              ? "Uncategorized"
              : (row.description ?? `Category ${row.category}`)}
          </div>
          <div className="text-[10px] text-content/85 mt-0.5">{dayLabel}</div>
        </div>
        <div
          className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
          style={
            tier === "ungraded"
              ? { background: "#f3f4f6", color: "#6b7280" }
              : { background: BADGE_BG[tier], color: BADGE_COLOR[tier] }
          }
        >
          {tier === "critical" && (
            <ExclamationTriangleIcon className="w-3 h-3" />
          )}
          {tier === "watch" && <ExclamationCircleIcon className="w-3 h-3" />}
          {tier === "healthy" && <CheckCircleIcon className="w-3 h-3" />}
          {sevLabel}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* 3-col TY / LW / LY */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          <div className="px-3 py-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wide text-content/85">
                TY
              </span>
              <span className="text-[10px] text-content/85">{dayLabel}</span>
            </div>
            <div className="text-[12px] font-semibold text-content mt-0.5">
              {fmtVal(kTW)}
            </div>
          </div>
          <div className="px-3 py-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wide text-content/85">
                LW
              </span>
              <span className="text-[10px] text-content/85">{lwLabel}</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[12px] font-semibold text-content">
                {kLWRaw === null ? "—" : fmtVal(kLWRaw)}
              </span>
              {kLWPct !== null && (
                <span
                  className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${pillClass(kLWPct)}`}
                >
                  {fmtPct(kLWPct)}
                </span>
              )}
            </div>
          </div>
          <div className="px-3 py-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wide text-content/85">
                LY
              </span>
              <span className="text-[10px] text-content/85">{lyLabel}</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[12px] font-semibold text-content">
                {kLYRaw === null ? "—" : fmtVal(kLYRaw)}
              </span>
              {kLYPct !== null && (
                <span
                  className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${pillClass(kLYPct)}`}
                >
                  {fmtPct(kLYPct)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs + item threshold */}
        <div className="flex items-center bg-custom-white border-b border-gray-100 px-3">
          {(["items", "hours"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2.5 px-3 text-[13px] font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-[#1e2a4a] text-content"
                  : "border-transparent text-content/85"
              }`}
            >
              {t === "items" ? "Items" : "Hours"}
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-[10px] text-content/85">Threshold</span>
          <input
            type="number"
            min={1}
            max={99}
            value={thresholdInput}
            onChange={(e) => {
              setThresholdInput(e.target.value);
              if (e.target.value === "") {
                dispatch(setItemThreshold(null));
                return;
              }
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1 && v <= 99) dispatch(setItemThreshold(v));
            }}
            onBlur={() => {
              const v = parseInt(thresholdInput, 10);
              if (thresholdInput !== "" && (isNaN(v) || v < 1 || v > 99))
                setThresholdInput(
                  itemThreshold === null ? "" : String(itemThreshold),
                );
            }}
            className="w-9 ml-1.5 text-center text-[10px] bg-custom-white border border-gray-200 rounded px-1 py-px focus:outline-none focus:border-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-[10px] text-content/85 ml-1">%</span>
        </div>

        <SevChips active={sevFilter} counts={counts} onChange={setSevFilter} />

        {loading ? (
          <div className="px-4 py-8 text-center text-[11px] text-content/85">
            Loading {tab === "items" ? "items" : "hours"}…
          </div>
        ) : visible.length === 0 ? (
          <div className="px-4 py-8 text-center text-[11px] text-content/85">
            {rowsFor.length === 0
              ? `No ${tab === "items" ? "items" : "hourly data"} for this category`
              : "Nothing matches filter"}
          </div>
        ) : (
          visible.map((item) => (
            <div
              key={String(item.key)}
              className="px-4 py-2.5 border-b border-gray-100"
            >
              <div className="flex items-start gap-2">
                <SevBadge sev={item.sev} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className="text-[12px] font-medium text-content truncate"
                      style={{ maxWidth: "55%" }}
                    >
                      {tab === "items"
                        ? item.desc
                        : `${ampm(Number(item.key))} – ${ampm(
                            Number(item.key) + 1 <= 23
                              ? Number(item.key) + 1
                              : 0,
                          )}`}
                    </span>
                    {tab === "items" && (
                      <span className="text-[10px] text-content/85 flex-shrink-0">
                        {String(item.key)}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-gray-100 border border-gray-100 rounded mt-1.5">
                    <div className="px-2 py-1.5">
                      <div className="text-[11px] text-content/85 uppercase tracking-wide">
                        TY
                      </div>
                      <div className="text-[11px] font-semibold text-content mt-0.5">
                        {show(item.ty)}
                      </div>
                      {!isQty && (
                        <div className="text-[11px] text-content/85 mt-0.5">
                          {item.ty.qty.toLocaleString()} u
                        </div>
                      )}
                      {item.ty.weight > 0 && (
                        <div className="text-[11px] text-content/85 mt-0.5">
                          {item.ty.weight.toFixed(2)} lb
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <div className="text-[11px] text-content/85 uppercase tracking-wide">
                        LW
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[11px] font-semibold text-content">
                          {item.lw ? show(item.lw) : "—"}
                        </span>
                        {item.lwDelta !== null && (
                          <span
                            className={`text-[11px] font-semibold px-1 py-0.5 rounded ${pillClass(item.lwDelta, effItemThreshold)}`}
                          >
                            {fmtPct(item.lwDelta)}
                          </span>
                        )}
                      </div>
                      {item.lw && !isQty && (
                        <div className="text-[11px] text-content/85 mt-0.5">
                          {item.lw.qty.toLocaleString()} u
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <div className="text-[11px] text-content/85 uppercase tracking-wide">
                        LY
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[11px] font-semibold text-content">
                          {item.ly ? show(item.ly) : "—"}
                        </span>
                        {item.lyDelta !== null && (
                          <span
                            className={`text-[11px] font-semibold px-1 py-0.5 rounded ${pillClass(item.lyDelta, effItemThreshold)}`}
                          >
                            {fmtPct(item.lyDelta)}
                          </span>
                        )}
                      </div>
                      {item.ly && !isQty && (
                        <div className="text-[11px] text-content/85 mt-0.5">
                          {item.ly.qty.toLocaleString()} u
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </BottomSheet>
  );
};

export default CategoryItemsSheet;
