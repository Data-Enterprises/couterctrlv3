import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";
import { fmtDayLabel, fmtRangeLabel } from "../../../utils/dateLabels";
import {
  setSelectedDay,
  setSelectedCategory,
  CATEGORY_THRESHOLD_DEFAULT,
} from "../../../features/categoriesSlice";
import BottomSheet from "../../../components/BottomSheet";
import SevBadge from "../../../components/SevBadge";
import { getTier, tierOfDelta, type CategoryDay } from "../categoriesUtils";
import type { CatItem, CatSalesHourly } from "../../../interfaces";

/**
 * One category's week — the mobile equivalent of `CategoryDetailPanel`.
 *
 * Walkthrough follows `LedgerStoreReport`, the canonical drill-down: navy nav,
 * three-column KPI strip, a day strip that rescopes everything below it, an
 * Items | Hours tab strip, then the list. Items open a `BottomSheet`.
 *
 * Hourly is fetched only when the Hours tab is first opened — thirty requests
 * is too much to spend on a tab most visits never reach.
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
}
const empty = (): Agg => ({ net: 0, qty: 0 });

const netOf = (r: { total_sales: number; total_tax: number }) =>
  r.total_sales - r.total_tax;

/** Sum item rows by product code, optionally restricted to one date. */
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
    out.set(r.product_code, cur);
  }
  return out;
};

/** Sum hourly rows by hour, optionally restricted to one date. */
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

const CategoryReportMobile = ({
  onLoadHourly,
}: {
  onLoadHourly: () => void;
}) => {
  const dispatch = useAppDispatch();
  const {
    rows,
    metric,
    threshold,
    selectedCategory,
    selectedDay,
    items,
    loadingItems,
    hourly,
    loadingHourly,
  } = useAppSelector((s) => s.categories);

  const [tab, setTab] = useState<Tab>("items");
  const [sheetCode, setSheetCode] = useState<string | null>(null);
  const sheetCloseRef = useRef<(() => void) | null>(null);

  const isQty = metric === "qty";
  const activeThreshold = threshold ?? CATEGORY_THRESHOLD_DEFAULT;

  const row = useMemo(
    () => rows.find((r) => r.category === selectedCategory) ?? null,
    [rows, selectedCategory],
  );

  /** Fetch hourly the first time the tab is opened, not on mount. */
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
    setSheetCode(null);
  }, [selectedCategory]);

  const dayEntry: CategoryDay | null = selectedDay
    ? (row?.days.find((d) => d.date === selectedDay) ?? null)
    : null;

  const val = (net: number, qty: number) => (isQty ? qty : net);
  const show = (net: number, qty: number) =>
    isQty ? `${qty.toLocaleString()} u` : formatCurrency2(net);

  const pct = (tw: number, prior: number) =>
    prior > 0 ? ((tw - prior) / prior) * 100 : null;

  const pillClass = (n: number | null) => {
    if (n === null) return "bg-gray-100 text-gray-500";
    if (n < -activeThreshold) return "bg-red-100 text-red-800";
    if (n < 0) return "bg-amber-100 text-amber-800";
    return "bg-emerald-100 text-emerald-800";
  };

  /** Items: TY narrows with the day strip, LW/LY stay at week scope. Item rows
   *  carry no aligned comparison dates of their own, and deriving one here by
   *  date arithmetic would quietly disagree with the day-matched KPI strip. */
  const itemRows = useMemo(() => {
    const tw = aggItems(items.tw, selectedDay);
    const lw = aggItems(items.lw, null);
    const ly = aggItems(items.ly, null);
    return [...tw.entries()]
      .map(([code, t]) => ({
        code,
        desc: t.desc,
        twNet: t.net,
        twQty: t.qty,
        lw: lw.get(code) ?? null,
        ly: ly.get(code) ?? null,
      }))
      .sort((a, b) => val(b.twNet, b.twQty) - val(a.twNet, a.twQty));
  }, [items, selectedDay, isQty]);

  const hourRows = useMemo(() => {
    const tw = aggHours(hourly.tw, selectedDay);
    const lw = aggHours(hourly.lw, null);
    const ly = aggHours(hourly.ly, null);
    return [...tw.entries()]
      .map(([hour, t]) => ({
        hour,
        twNet: t.net,
        twQty: t.qty,
        lw: lw.get(hour) ?? null,
        ly: ly.get(hour) ?? null,
      }))
      .sort((a, b) => a.hour - b.hour);
  }, [hourly, selectedDay]);

  if (!row) return null;

  const tier = getTier(row, activeThreshold, metric);

  /* ── KPI values: the whole week, or the selected day ─────────────────── */
  const kTW = dayEntry
    ? val(dayEntry.twNet, dayEntry.twQty)
    : val(row.twNet, row.twQty);
  const kLWRaw = dayEntry
    ? isQty
      ? dayEntry.lwQty
      : dayEntry.lwNet
    : row.hasLW
      ? val(row.lwNet, row.lwQty)
      : null;
  const kLYRaw = dayEntry
    ? isQty
      ? dayEntry.lyQty
      : dayEntry.lyNet
    : row.hasLY
      ? val(row.lyNet, row.lyQty)
      : null;
  // Whole-week comparisons use the day-matched TY subtotal so a full TY week
  // is never measured against a partial LW or LY.
  const kTWForLW = dayEntry
    ? val(dayEntry.twNet, dayEntry.twQty)
    : val(row.twNetForLW, row.twQtyForLW);
  const kTWForLY = dayEntry
    ? val(dayEntry.twNet, dayEntry.twQty)
    : val(row.twNetForLY, row.twQtyForLY);

  const kLWPct = kLWRaw === null ? null : pct(kTWForLW, kLWRaw);
  const kLYPct = kLYRaw === null ? null : pct(kTWForLY, kLYRaw);

  const fmtVal = (v: number) =>
    isQty ? `${v.toLocaleString()} u` : formatCurrency2(v);

  const dayLabel = selectedDay
    ? fmtDayLabel(selectedDay)
    : fmtRangeLabel(row.days[0]?.date ?? "", row.days.at(-1)?.date ?? "");

  const sheetItem = itemRows.find((i) => i.code === sheetCode) ?? null;

  /** One row in either list — items and hours differ only in their label. */
  const signalRow = (
    key: string,
    label: string,
    twNet: number,
    twQty: number,
    lw: Agg | null,
    ly: Agg | null,
    onClick?: () => void,
  ) => {
    const lwPct = lw ? pct(val(twNet, twQty), val(lw.net, lw.qty)) : null;
    const lyPct = ly ? pct(val(twNet, twQty), val(ly.net, ly.qty)) : null;
    const sev = tierOfDelta(lyPct ?? lwPct, activeThreshold);
    const Row = onClick ? "button" : "div";
    return (
      <Row
        key={key}
        onClick={onClick}
        className="w-full px-3 py-2.5 bg-custom-white border-b border-gray-100 text-left active:bg-gray-50 block"
      >
        <div className="flex items-center gap-2.5">
          <SevBadge sev={sev} />
          <span className="flex-1 text-[12px] font-medium text-content truncate">
            {label}
          </span>
          <div className="flex items-baseline gap-2 flex-shrink-0">
            <span className="text-[12px] font-semibold text-content">
              {show(twNet, twQty)}
            </span>
            {!isQty && (
              <span className="text-[11px] text-content/85">
                {twQty.toLocaleString()} u
              </span>
            )}
          </div>
          {onClick && (
            <ChevronRightIcon className="w-4 h-4 text-content/85 flex-shrink-0" />
          )}
        </div>
        <div className="flex gap-2 mt-1.5 justify-end">
          <span
            className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${pillClass(lwPct)}`}
          >
            LW {lwPct === null ? "—" : fmtPct(lwPct)}
          </span>
          <span
            className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${pillClass(lyPct)}`}
          >
            LY {lyPct === null ? "—" : fmtPct(lyPct)}
          </span>
        </div>
      </Row>
    );
  };

  return (
    <>
      <div className="flex flex-col h-[calc(100dvh-3rem)] bg-gray-50 overflow-hidden">
        {/* Nav */}
        <div className="bg-[#1e2a4a] px-3 pt-2 pb-2.5 flex items-start gap-3 flex-shrink-0">
          <button
            onClick={() => dispatch(setSelectedCategory(null))}
            aria-label="Back to categories"
            className="text-custom-white/85 mt-0.5 flex-shrink-0"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-custom-white truncate">
              {row.uncategorized
                ? "Uncategorized"
                : (row.description ?? `Category ${row.category}`)}
            </div>
            <div className="text-[11px] mt-0.5 text-custom-white/85">
              {isQty ? "Category units" : "Category sales"}
            </div>
          </div>
          <SevBadge sev={tier} />
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 bg-custom-white border-b border-gray-100 flex-shrink-0">
          <div className="px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
              {isQty ? "TY units" : "TY net sales"}
            </div>
            <div className="text-[10px] text-content/85 mt-0.5">{dayLabel}</div>
            <div className="text-[12px] font-semibold text-content mt-0.5">
              {fmtVal(kTW)}
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
              vs last week
            </div>
            <div className="text-[10px] text-content/85 mt-0.5">
              {kLWRaw === null ? "no data" : "last week"}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[12px] font-semibold text-content">
                {kLWRaw === null ? "—" : fmtVal(kLWRaw)}
              </span>
              {kLWPct !== null && (
                <span
                  className={`text-[10px] font-semibold ${kLWPct >= 0 ? "text-emerald-600" : "text-red-500"}`}
                >
                  {fmtPct(kLWPct)}
                </span>
              )}
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
              vs last year
            </div>
            <div className="text-[10px] text-content/85 mt-0.5">
              {kLYRaw === null ? "no data" : "last year"}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[12px] font-semibold text-content">
                {kLYRaw === null ? "—" : fmtVal(kLYRaw)}
              </span>
              {kLYPct !== null && (
                <span
                  className={`text-[10px] font-semibold ${kLYPct >= 0 ? "text-emerald-600" : "text-red-500"}`}
                >
                  {fmtPct(kLYPct)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Day strip — selecting a day rescopes the KPI strip and the TY side
            of both tabs below. */}
        <div className="grid grid-cols-8 bg-custom-white border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => dispatch(setSelectedDay(null))}
            className={`flex flex-col items-center justify-center py-2 border-r border-gray-100 transition-colors ${
              selectedDay === null ? "bg-[#1e2a4a]" : "hover:bg-gray-50"
            }`}
          >
            <span
              className={`text-[10px] font-bold ${selectedDay === null ? "text-custom-white" : "text-content"}`}
            >
              ALL
            </span>
            <span
              className={`text-[10px] mt-0.5 ${selectedDay === null ? "text-custom-white" : "text-content"}`}
            >
              wk
            </span>
          </button>
          {row.days.map((d) => {
            const date = new Date(d.date + "T12:00:00");
            const isSelected = selectedDay === d.date;
            const lyVal = isQty ? d.lyQty : d.lyNet;
            const lwVal = isQty ? d.lwQty : d.lwNet;
            const twVal = isQty ? d.twQty : d.twNet;
            const hasLY = lyVal !== null && lyVal > 0;
            const hasLW = lwVal !== null && lwVal > 0;
            const hasRef = hasLY || hasLW;
            const ref = hasLY ? (lyVal as number) : (lwVal ?? 0);
            const isUp = !hasRef ? true : twVal >= ref;
            const dayBadgeColor = !hasRef
              ? "#9ca3af"
              : isUp
                ? "#10b981"
                : "#ef4444";
            return (
              <button
                key={d.date}
                onClick={() =>
                  dispatch(setSelectedDay(isSelected ? null : d.date))
                }
                className={`flex flex-col items-center justify-center gap-1 py-2 border-r border-gray-100 last:border-r-0 transition-colors ${
                  isSelected ? "bg-[#1e2a4a]" : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`text-[10px] font-semibold leading-none ${isSelected ? "text-custom-white" : "text-content"}`}
                >
                  {date.toLocaleDateString("en-US", { weekday: "short" })}{" "}
                  <span
                    className={
                      isSelected ? "text-custom-white/85" : "text-content/85"
                    }
                  >
                    {date.toLocaleDateString("en-US", {
                      month: "numeric",
                      day: "numeric",
                    })}
                  </span>
                </span>
                <div className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center flex-shrink-0">
                  {!hasRef || isUp ? (
                    <CheckCircleIcon
                      className="w-5 h-5"
                      style={{ color: dayBadgeColor }}
                    />
                  ) : (
                    <ExclamationTriangleIcon
                      className="w-5 h-5"
                      style={{ color: dayBadgeColor }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-custom-white border-b border-gray-100 flex-shrink-0 px-3">
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
        </div>

        <div className="flex-1 overflow-y-auto pb-14">
          {tab === "items" ? (
            loadingItems ? (
              <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
                Loading items…
              </div>
            ) : itemRows.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
                No items for this category
              </div>
            ) : (
              itemRows.map((i) =>
                signalRow(i.code, i.desc, i.twNet, i.twQty, i.lw, i.ly, () =>
                  setSheetCode(i.code),
                ),
              )
            )
          ) : loadingHourly ? (
            <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
              Loading hours…
            </div>
          ) : hourRows.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
              No hourly data for this category
            </div>
          ) : (
            hourRows.map((h) =>
              signalRow(
                String(h.hour),
                `${ampm(h.hour)} – ${ampm(h.hour + 1 <= 23 ? h.hour + 1 : 0)}`,
                h.twNet,
                h.twQty,
                h.lw,
                h.ly,
              ),
            )
          )}
        </div>
      </div>

      {/* Item detail — the shared Performance-page treatment. */}
      {sheetItem && (
        <BottomSheet
          onClose={() => setSheetCode(null)}
          closeRef={sheetCloseRef}
        >
          <div className="px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
            <div className="text-[14px] font-semibold text-content">
              {sheetItem.desc}
            </div>
            <div className="text-[10px] text-content/85 mt-0.5">
              {sheetItem.code} · {dayLabel}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
              {(
                [
                  ["TY", { net: sheetItem.twNet, qty: sheetItem.twQty }],
                  ["LW", sheetItem.lw],
                  ["LY", sheetItem.ly],
                ] as const
              ).map(([label, agg]) => (
                <div key={label} className="px-3 py-2.5">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
                    {label}
                  </div>
                  <div className="text-[12px] font-semibold text-content mt-0.5">
                    {agg === null ? "—" : formatCurrency2(agg.net)}
                  </div>
                  {agg !== null && (
                    <div className="text-[10px] text-content/85 mt-0.5">
                      {agg.qty.toLocaleString()} u
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Both measures regardless of the toggle — someone opening the
                sheet has come for the detail, and withholding half the pair
                just costs them a trip back to desktop. */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[12px] text-content/90">TY net sales</span>
              <span className="text-[13px] font-semibold text-content">
                {formatCurrency2(sheetItem.twNet)}
              </span>
            </div>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[12px] text-content/90">TY units</span>
              <span className="text-[13px] font-semibold text-content">
                {sheetItem.twQty.toLocaleString()}
              </span>
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
};

export default CategoryReportMobile;
