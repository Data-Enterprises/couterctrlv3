import { useMemo, useRef, useState, useEffect } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { formatCurrency2, formatBigNumber } from "../../utils";
import {
  pillClass,
  formatPct,
  chipClass,
  severityHeaderBgClass,
  type Severity,
} from "../../utils/severity";
import { fmtDayLabel, fmtRangeLabel } from "../../utils/dateLabels";
import ThresholdSlider from "../../components/filters/ThresholdSlider";
import ThresholdFilter from "../../components/filters/ThresholdFilter";
import {
  setSelectedDay,
  setThreshold,
  CATEGORY_THRESHOLD_DEFAULT,
} from "../../features/categoriesSlice";
import {
  getTier,
  pctChange,
  shiftIso,
  LW_OFFSET,
  LY_OFFSET,
  type CategoryDay,
  type CategoryTier,
} from "./categoriesUtils";

type Tab = "days" | "hours";

/** Ungraded has no severity colour of its own, so the header falls back to the
 *  navy every other panel uses rather than borrowing a verdict colour. */
const headerBg = (tier: CategoryTier) =>
  tier === "ungraded" ? "bg-[#1e2a4a]" : severityHeaderBgClass[tier as Severity];

const tierOf = (pct: number | null, threshold: number): Severity | null => {
  if (pct === null) return null;
  if (pct < -threshold) return "critical";
  if (pct < 0) return "watch";
  return "healthy";
};

/** Written out rather than interpolated: Tailwind scans source text, so a class
 *  assembled at runtime is never emitted into the stylesheet. */
const SEV_CHIP: Record<Severity, string> = {
  critical: "bg-severity_critical_bg text-severity_critical_text",
  watch: "bg-severity_watch_bg text-severity_watch_text",
  healthy: "bg-severity_healthy_bg text-severity_healthy_text",
};

const SEV_CHIP_ON: Record<Severity, string> = {
  critical: "ring-2 ring-severity_critical_text/40 shadow-sm",
  watch: "ring-2 ring-severity_watch_text/40 shadow-sm",
  healthy: "ring-2 ring-severity_healthy_text/40 shadow-sm",
};

const formatHour = (h: number) =>
  `${String(h).padStart(2, "0")}:00 – ${String((h + 1) % 24).padStart(2, "0")}:00`;

/** One KPI cell, matching the Sales strip. The date line is load-bearing: the
 *  figure means something different once a day is selected. */
const Kpi = ({
  title,
  dateLabel,
  value,
  pct,
  threshold,
}: {
  title: string;
  dateLabel: string;
  value: string;
  pct?: number | null;
  threshold: number;
}) => (
  <div className="px-4 pt-2.5 pb-2 text-center">
    <div className="text-[10px] font-bold uppercase tracking-wide text-content">
      {title}
    </div>
    <div className="text-[10px] font-bold text-content mb-0.5">{dateLabel}</div>
    {pct === undefined ? (
      <div className="text-[14px] font-bold text-content">{value}</div>
    ) : (
      <div className="flex items-baseline justify-center gap-2">
        <span className="text-[14px] font-bold text-content">{value}</span>
        {pct !== null && (
          <span
            className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${pillClass(pct, threshold)}`}
          >
            {formatPct(pct)}
          </span>
        )}
      </div>
    )}
  </div>
);

/** A labelled figure in the report column. */
const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-3 px-3 py-1.5 border-b border-gray-100">
    <span className="text-[11px] text-content/60">{label}</span>
    <span className="text-[12.5px] font-semibold text-content tabular-nums">
      {value}
    </span>
  </div>
);

interface Props {
  onLoadHourly: () => void;
}

const CategoryDetailPanel = ({ onLoadHourly }: Props) => {
  const dispatch = useAppDispatch();
  const cats = useAppSelector((s) => s.categories);
  const { rows, metric, threshold, selectedCategory, selectedDay, hourly, loadingHourly } = cats;

  const [tab, setTab] = useState<Tab>("days");
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [sevFilter, setSevFilter] = useState<Severity | "all">("all");
  const [threshOpen, setThreshOpen] = useState(false);
  const threshRef = useRef<HTMLDivElement>(null);

  // Close the threshold popover on an outside click, same as Sales' hourly view.
  useEffect(() => {
    if (!threshOpen) return;
    const onDown = (e: MouseEvent) => {
      if (threshRef.current && !threshRef.current.contains(e.target as Node)) {
        setThreshOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [threshOpen]);

  const activeThreshold = threshold ?? CATEGORY_THRESHOLD_DEFAULT;
  const isQty = metric === "qty";
  const fmt = (n: number) => (isQty ? formatBigNumber(n, 0) : formatCurrency2(n));

  const row = useMemo(
    () => rows.find((r) => r.category === selectedCategory) ?? null,
    [rows, selectedCategory],
  );

  const dayTw = (d: CategoryDay) => (isQty ? d.twQty : d.twNet);
  const dayLw = (d: CategoryDay) => (isQty ? d.lwQty : d.lwNet);
  const dayLy = (d: CategoryDay) => (isQty ? d.lyQty : d.lyNet);

  /** Hours folded per period, narrowed to the selected day when there is one so
   *  the two tabs can never disagree about which dates are in play. */
  const hourRows = useMemo(() => {
    const narrow = (list: typeof hourly.tw, offset: number) =>
      selectedDay
        ? list.filter((h) => h.sale_date.split("T")[0] === shiftIso(selectedDay, offset))
        : list;
    const fold = (list: typeof hourly.tw) => {
      const m = new Map<number, { v: number; gross: number; tax: number; qty: number; basket: number; avgPrice: number; n: number }>();
      for (const h of list) {
        const cur = m.get(h.hour) ?? { v: 0, gross: 0, tax: 0, qty: 0, basket: 0, avgPrice: 0, n: 0 };
        cur.v += isQty ? h.qty : h.net_sales;
        cur.gross += h.total_sales;
        cur.tax += h.total_tax;
        cur.qty += h.qty;
        cur.basket += isQty ? h.basket_size_qty : h.basket_size_sales;
        cur.avgPrice += h.avg_item_price;
        cur.n += 1;
        m.set(h.hour, cur);
      }
      return m;
    };

    const tw = fold(narrow(hourly.tw, 0));
    const lw = fold(narrow(hourly.lw, LW_OFFSET));
    const ly = fold(narrow(hourly.ly, LY_OFFSET));

    return [...new Set([...tw.keys(), ...lw.keys(), ...ly.keys()])]
      .sort((a, b) => a - b)
      .map((hour) => {
        const t = tw.get(hour);
        const l = lw.get(hour);
        const y = ly.get(hour);
        return {
          hour,
          tw: t?.v ?? 0,
          detail: t,
          lwPct: !l || l.v === 0 ? null : pctChange(t?.v ?? 0, l.v),
          lyPct: !y || y.v === 0 ? null : pctChange(t?.v ?? 0, y.v),
        };
      });
  }, [hourly, metric, selectedDay, isQty]);

  if (!row) {
    return (
      <div className="flex-1 min-w-0 shadow-lg bg-custom-white rounded-xl flex items-center justify-center">
        <span className="text-[11px] text-content/40">
          Select a category to see its week
        </span>
      </div>
    );
  }

  const tier = getTier(row, activeThreshold, metric);

  /* ── KPI values: whole week, or the selected day ───────────────────────── */

  const activeDay = selectedDay
    ? (row.days.find((d) => d.date === selectedDay) ?? null)
    : null;

  const twValue = activeDay ? dayTw(activeDay) : isQty ? row.twQty : row.twNet;
  const lwValue = activeDay ? dayLw(activeDay) : row.hasLW ? (isQty ? row.lwQty : row.lwNet) : null;
  const lyValue = activeDay ? dayLy(activeDay) : row.hasLY ? (isQty ? row.lyQty : row.lyNet) : null;
  const twForLW = activeDay ? dayTw(activeDay) : isQty ? row.twQtyForLW : row.twNetForLW;
  const twForLY = activeDay ? dayTw(activeDay) : isQty ? row.twQtyForLY : row.twNetForLY;
  const lwPct = lwValue === null || lwValue === 0 ? null : pctChange(twForLW, lwValue);
  const lyPct = lyValue === null || lyValue === 0 ? null : pctChange(twForLY, lyValue);

  const twLabel = selectedDay ? fmtDayLabel(selectedDay) : fmtRangeLabel(cats.twStart, cats.twEnd);
  const lwLabel = selectedDay
    ? fmtDayLabel(shiftIso(selectedDay, LW_OFFSET))
    : fmtRangeLabel(shiftIso(cats.twStart, LW_OFFSET), shiftIso(cats.twEnd, LW_OFFSET));
  const lyLabel = selectedDay
    ? fmtDayLabel(shiftIso(selectedDay, LY_OFFSET))
    : fmtRangeLabel(shiftIso(cats.twStart, LY_OFFSET), shiftIso(cats.twEnd, LY_OFFSET));

  /* ── Left column rows, filtered by severity chip ───────────────────────── */

  const dayList = row.days.map((d) => {
    const l = dayLw(d);
    const y = dayLy(d);
    const lp = l === null || l === 0 ? null : pctChange(dayTw(d), l);
    const yp = y === null || y === 0 ? null : pctChange(dayTw(d), y);
    const primary = yp ?? lp;
    return { key: d.date, label: fmtDayLabel(d.date), value: dayTw(d), lp, yp, sev: tierOf(primary, activeThreshold) };
  });

  const hourList = hourRows.map((h) => ({
    key: String(h.hour),
    label: formatHour(h.hour),
    value: h.tw,
    lp: h.lwPct,
    yp: h.lyPct,
    sev: tierOf(h.lyPct ?? h.lwPct, activeThreshold),
  }));

  const list = tab === "days" ? dayList : hourList;
  const shown = sevFilter === "all" ? list : list.filter((r) => r.sev === sevFilter);
  const count = (s: Severity) => list.filter((r) => r.sev === s).length;

  const selectedKey = tab === "days" ? selectedDay : selectedHour === null ? null : String(selectedHour);
  const pick = (key: string) => {
    if (tab === "days") {
      dispatch(setSelectedDay(key === selectedDay ? null : key));
    } else {
      setSelectedHour(Number(key) === selectedHour ? null : Number(key));
    }
  };

  const sevChip = (sev: Severity, label: string) => (
    <button
      onClick={() => setSevFilter((f) => (f === sev ? "all" : sev))}
      className={`text-[10px] font-semibold px-2 py-1 rounded-full transition-shadow ${SEV_CHIP[sev]} ${
        sevFilter === sev ? SEV_CHIP_ON[sev] : ""
      }`}
    >
      {label} ({count(sev)})
    </button>
  );

  /* ── Report column for the current selection ───────────────────────────── */

  const report = (() => {
    if (tab === "days") {
      if (!activeDay) return null;
      const d = activeDay.detail;
      const coupons = d.elecInstore + d.elecStore + d.digital + d.storeCoupon;
      return {
        title: fmtDayLabel(activeDay.date),
        stats: [
          ["Gross sales", formatCurrency2(d.gross)],
          ["Net sales", formatCurrency2(d.net)],
          ["Tax", formatCurrency2(d.tax)],
          ["Units", formatBigNumber(d.qty, 0)],
          ["Weight", d.weight ? formatBigNumber(d.weight, 0) : "—"],
          ["Avg price / unit", d.qty > 0 ? formatCurrency2(d.net / d.qty) : "—"],
        ] as [string, string][],
        coupons: [
          ["Electronic in-store", formatCurrency2(d.elecInstore)],
          ["Electronic store", formatCurrency2(d.elecStore)],
          ["Digital", formatCurrency2(d.digital)],
          ["Store coupon", formatCurrency2(d.storeCoupon)],
          ["Total", formatCurrency2(coupons)],
        ] as [string, string][],
      };
    }
    const h = hourRows.find((x) => x.hour === selectedHour);
    if (!h?.detail) return null;
    const dt = h.detail;
    return {
      title: formatHour(h.hour),
      stats: [
        ["Gross sales", formatCurrency2(dt.gross)],
        ["Net sales", formatCurrency2(dt.v)],
        ["Tax", formatCurrency2(dt.tax)],
        ["Units", formatBigNumber(dt.qty, 0)],
        ["Avg basket", isQty ? formatBigNumber(dt.basket / Math.max(dt.n, 1), 0) : formatCurrency2(dt.basket / Math.max(dt.n, 1))],
        ["Avg item price", formatCurrency2(dt.avgPrice / Math.max(dt.n, 1))],
      ] as [string, string][],
      coupons: null,
    };
  })();

  return (
    <div className="flex-1 min-w-0 shadow-lg bg-custom-white rounded-xl overflow-hidden flex flex-col">
      {/* Title bar — tinted to the selected category's severity */}
      <div
        className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 flex-shrink-0 ${headerBg(tier)}`}
      >
        <p className="text-custom-white text-[13px] font-bold leading-tight justify-self-start truncate">
          {row.description ?? "Uncategorized"}
        </p>
        <span className="text-custom-white text-[13px] font-bold justify-self-center">
          Category Performance · {twLabel}
        </span>
        <button
          className="justify-self-end w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/60 hover:text-custom-white hover:border-custom-white/40 transition-colors"
          title="Export"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
        </button>
      </div>

      {/* KPI metric strip — values and date labels update with day selection */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <Kpi
          title={isQty ? "TY Qty" : "TY Net Sales"}
          dateLabel={twLabel}
          value={fmt(twValue)}
          threshold={activeThreshold}
        />
        <Kpi
          title="vs Last Week"
          dateLabel={lwLabel}
          value={lwValue === null ? "—" : fmt(lwValue)}
          pct={lwPct}
          threshold={activeThreshold}
        />
        <Kpi
          title="vs Last Year"
          dateLabel={lyLabel}
          value={lyValue === null ? "—" : fmt(lyValue)}
          pct={lyPct}
          threshold={activeThreshold}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-gray-100 px-3 flex-shrink-0">
        {(["days", "hours"] as const).map((k) => (
          <button
            key={k}
            onClick={() => {
              setTab(k);
              setSevFilter("all");
              if (k === "hours" && hourly.tw.length === 0 && !loadingHourly) onLoadHourly();
            }}
            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
              tab === k
                ? "border-[#1e2a4a] text-content"
                : "border-transparent text-content/70 hover:text-content/80"
            }`}
          >
            {k === "days" ? "Days" : "Hours"}
          </button>
        ))}
        <div className="flex-1" />
        {row.uncategorized && (
          <span className="text-[10px] text-content/55 pr-1">
            No category assigned at the POS
          </span>
        )}
      </div>

      {/* Two-column: graded list left, report right */}
      <div className="flex-1 min-h-0 flex">
        <div
          className="flex flex-col border-r border-gray-100 min-h-0"
          style={{ width: "36.5%" }}
        >
          {/* Filter chips + threshold */}
          <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-100 bg-gray-100 flex-shrink-0">
            {sevChip("critical", "Crit")}
            {sevChip("watch", "Watch")}
            {sevChip("healthy", "OK")}
            <div className="relative" ref={threshRef}>
              <button
                onClick={() => setThreshOpen((v) => !v)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(threshOpen)}`}
              >
                Thresh
              </button>
              {threshOpen && (
                <div className="absolute top-full left-0 mt-1 p-1.5 rounded-md border border-gray-200 bg-custom-white shadow-lg z-20">
                  <div className="flex items-center gap-2">
                    <ThresholdSlider
                      value={threshold}
                      onChange={(v) => dispatch(setThreshold(v))}
                      ariaLabel="Category grading threshold, percent"
                      className="w-[92px] flex-shrink-0"
                    />
                    <ThresholdFilter
                      value={threshold === null ? null : { op: "lt", amount: threshold }}
                      onChange={(v) => dispatch(setThreshold(v?.amount ?? null))}
                      showOp={false}
                      suffix="%"
                      inputWidth={40}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-y-auto thin-scrollbar flex-1">
            {tab === "hours" && loadingHourly ? (
              <div className="flex items-center justify-center gap-2 h-24">
                <div className="w-3.5 h-3.5 border-2 border-gray-200 border-t-[#1e2a4a] rounded-full animate-spin" />
                <span className="text-[11px] text-content">Loading hours…</span>
              </div>
            ) : shown.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-[11px] text-content/40">
                {tab === "hours" ? "No hourly rows" : "None this week"}
              </div>
            ) : (
              shown.map((r) => (
                <button
                  key={r.key}
                  onClick={() => pick(r.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors border-l-2 border-b border-b-[#1e2a4a]/15 ${
                    selectedKey === r.key
                      ? "bg-row_selected border-row_selected_border"
                      : "border-transparent hover:bg-gray-50"
                  }`}
                >
                  <span className="text-[12px] font-medium text-content truncate flex-1">
                    {r.label}
                  </span>
                  <span className="text-[12px] font-semibold text-content tabular-nums flex-shrink-0">
                    {fmt(r.value)}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-1.5 py-0.5 rounded text-center flex-shrink-0 whitespace-nowrap ${pillClass(r.yp ?? r.lp, activeThreshold)}`}
                    style={{ width: 62 }}
                  >
                    {r.yp ?? r.lp ? formatPct((r.yp ?? r.lp) as number) : "—"}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Report for the selected day / hour */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          {!report ? (
            <div className="flex-1 flex items-center justify-center text-[11px] text-content/40">
              Select a {tab === "days" ? "day" : "hour"} to see its report
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto thin-scrollbar">
              <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                <span className="text-[12px] font-bold text-content">{report.title}</span>
              </div>
              {report.stats.map(([label, value]) => (
                <Stat key={label} label={label} value={value} />
              ))}
              {report.coupons && (
                <>
                  <div className="px-3 py-1.5 border-b border-gray-100 bg-gray-50">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-content/70">
                      Coupons
                    </span>
                  </div>
                  {report.coupons.map(([label, value]) => (
                    <Stat key={label} label={label} value={value} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailPanel;
