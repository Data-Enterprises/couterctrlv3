import { useState, useMemo, useRef, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  setSelectedHour,
  setHourlyThreshold,
} from "../../../features/salesLedgerSlice";
import { formatCurrency2, addDays, sameWeekDayLastYear } from "../../../utils";
import { buildDayShiftMaps, buildDayMatchedTwTotals } from "../shared/ledgerUtils";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/20/solid";
import type { Severity } from "./LedgerRow";
import HourTrendChart from "./HourTrendChart";
import { formatPct, pillClass, chipClass, CTA_SEVERITY_CLASSES, severityDotClass, type SevFilter } from "./utils";
import ThresholdFilter from "../../../components/filters/ThresholdFilter";

const ampm = (h: number) =>
  h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;

const formatHourRange = (h: number) =>
  `${ampm(h)} – ${ampm(h + 1 <= 23 ? h + 1 : 0)}`;

type HourRow = {
  hour: number;
  tw: number;
  lw: number;
  ly: number;
  trans: number;
  lwTrans: number;
  lyTrans: number;
  qty: number;
  lwQty: number;
  lyQty: number;
  vsLWPct: number;
  vsLYPct: number;
  hasLW: boolean;
  hasLY: boolean;
};

type HourSortColumn = "ty" | "vsLW" | "vsLY";
type HourSortState = { column: HourSortColumn; direction: "desc" | "asc" } | null;

const hourSeverity = (r: HourRow, threshold: number): Severity => {
  const pct = r.hasLY ? r.vsLYPct : r.hasLW ? r.vsLWPct : 0;
  if (pct < -threshold) return "critical";
  if (pct < 0) return "watch";
  return "healthy";
};

const getCta = (
  row: HourRow,
  threshold: number,
): { text: string; severity: Severity } => {
  const sev = hourSeverity(row, threshold);
  const primaryPeriod = row.hasLY ? "LY" : "LW";
  const primaryPct = row.hasLY ? row.vsLYPct : row.vsLWPct;
  const pctStr = `${Math.abs(primaryPct).toFixed(1)}%`;
  const avgBasket = row.trans > 0 ? row.tw / row.trans : 0;
  const refTrans = row.hasLY ? row.lyTrans : row.lwTrans;
  const refBasket = row.hasLY
    ? row.lyTrans > 0
      ? row.ly / row.lyTrans
      : 0
    : row.lwTrans > 0
      ? row.lw / row.lwTrans
      : 0;

  if (sev === "critical") {
    const transDrop =
      refTrans > 0 ? ((row.trans - refTrans) / refTrans) * 100 : null;
    const basketDiff =
      refBasket > 0 ? ((avgBasket - refBasket) / refBasket) * 100 : null;
    const isTrafficLoss = transDrop !== null && transDrop < -5;
    const isSpendDrop = basketDiff !== null && basketDiff < -3;
    if (isTrafficLoss && !isSpendDrop)
      return {
        severity: "critical",
        text: `Down ${pctStr} vs ${primaryPeriod} — traffic loss is the driver. Transactions down ${Math.abs(transDrop!).toFixed(1)}% while basket is holding. Check staffing and flow.`,
      };
    if (isSpendDrop && !isTrafficLoss)
      return {
        severity: "critical",
        text: `Down ${pctStr} vs ${primaryPeriod} — spend compression is the driver. Traffic held but avg basket dropped. Look at mix shift or promoted item performance.`,
      };
    return {
      severity: "critical",
      text: `Down ${pctStr} vs ${primaryPeriod} — exceeds the ${threshold}% threshold. Both traffic and spend show pressure. Investigate staffing, promotions, and item availability.`,
    };
  }
  if (sev === "watch") {
    const secondaryNote =
      row.hasLY && row.hasLW
        ? row.vsLWPct >= 0
          ? ` Recovering vs LW — may be stabilizing.`
          : ` LW also soft — monitor before escalating.`
        : "";
    return {
      severity: "watch",
      text: `Down ${pctStr} vs ${primaryPeriod} — within the watch band.${secondaryNote}`,
    };
  }
  const secondaryHealthNote =
    row.hasLY && row.hasLW
      ? row.vsLWPct < 0
        ? ` LW is softer — watch for a developing trend.`
        : ` LW also positive.`
      : "";
  return {
    severity: "healthy",
    text: `At or above ${primaryPeriod}.${secondaryHealthNote} Traffic and spend contributing positively.`,
  };
};

interface PopupHourlyViewProps {
  twDateLabel: string;
  lwDateLabel: string;
  lyDateLabel: string;
}

const PopupHourlyView = ({
  twDateLabel,
  lwDateLabel,
  lyDateLabel,
}: PopupHourlyViewProps) => {
  const { hourlySales, hourlySalesLastWeek, hourlySalesLastYear } =
    useAppSelector((s) => s.sales);
  const { rawHourly, rawLWHourly, rawLYHourly } = useAppSelector(
    (s) => s.salesLedger,
  );
  const rawThreshold = useAppSelector((s) => s.salesLedger.hourlyThreshold);
  const selectedHour = useAppSelector((s) => s.salesLedger.selectedHour);
  const dispatch = useAppDispatch();

  // Grading should never move rows around on its own when the threshold input
  // is cleared — keep grading against the last valid amount so severity/sort
  // order stays exactly where it was until a new number is typed.
  const thresholdRef = useRef<number>(rawThreshold ?? 9);
  if (rawThreshold != null) thresholdRef.current = rawThreshold;
  const threshold = thresholdRef.current;

  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [hourSort, setHourSort] = useState<HourSortState>(null);
  const [ctaOpen, setCtaOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [threshOpen, setThreshOpen] = useState(false);
  const threshBtnRef = useRef<HTMLButtonElement>(null);
  const threshPopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threshOpen) return;
    const close = (e: MouseEvent) => {
      if (
        threshBtnRef.current && !threshBtnRef.current.contains(e.target as Node) &&
        threshPopRef.current && !threshPopRef.current.contains(e.target as Node)
      ) setThreshOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [threshOpen]);

  // Chart is always scoped to the full 7-day week for the selected hour,
  // regardless of any single-day selection elsewhere in the popup — one
  // point per day (TY/LW/LY), built from the unfiltered raw hourly records
  // rather than the (possibly day-filtered) `hours` rows used for
  // grading/severity below.
  const weekHourDays = useMemo(() => {
    if (selectedHour === null) return null;
    const tyDates = Array.from(
      new Set(rawHourly.map((h) => h.sale_date.split("T")[0])),
    ).sort();

    const sumFor = (src: typeof rawHourly, dateStr: string) =>
      src
        .filter(
          (h) => h.hour === selectedHour && h.sale_date.split("T")[0] === dateStr,
        )
        .reduce((acc, h) => acc + (h.total_sales - h.total_tax), 0);

    return tyDates.map((tyDate) => {
      const lwDate = addDays(tyDate, -7).toISOString().split("T")[0];
      const lyDate = sameWeekDayLastYear(tyDate).date;
      const label = new Date(tyDate + "T12:00:00").toLocaleDateString(
        "en-US",
        { weekday: "short" },
      );
      return {
        label,
        tw: sumFor(rawHourly, tyDate),
        lw: sumFor(rawLWHourly, lwDate),
        ly: sumFor(rawLYHourly, lyDate),
      };
    });
  }, [selectedHour, rawHourly, rawLWHourly, rawLYHourly]);

  const hasWeekLW = selectedHour !== null && rawLWHourly.some((h) => h.hour === selectedHour);
  const hasWeekLY = selectedHour !== null && rawLYHourly.some((h) => h.hour === selectedHour);

  const hours = useMemo((): HourRow[] => {
    const buildMap = (src: typeof hourlySales) =>
      src.reduce(
        (
          acc: Record<number, { net: number; trans: number; qty: number }>,
          h,
        ) => {
          if (!acc[h.hour]) acc[h.hour] = { net: 0, trans: 0, qty: 0 };
          acc[h.hour].net += h.total_sales - h.total_tax;
          acc[h.hour].trans += h.transactions;
          acc[h.hour].qty += h.qty;
          return acc;
        },
        {},
      );

    const twMap = buildMap(hourlySales);
    const lwMap = buildMap(hourlySalesLastWeek);
    const lyMap = buildMap(hourlySalesLastYear);

    const allHours = Array.from(
      new Set(
        [
          ...Object.keys(twMap),
          ...Object.keys(lwMap),
          ...Object.keys(lyMap),
        ].map(Number),
      ),
    ).sort((a, b) => a - b);

    // An hour can have real TW sales on days where the store overall has an
    // LW/LY match but that specific hour doesn't — restrict the TW side of
    // each hour's percentage to just the days that hour has a match on.
    const twRealDates = [
      ...new Set(hourlySales.map((h) => h.sale_date.split("T")[0])),
    ];
    const { twToLwDay, twToLyDay } = buildDayShiftMaps(twRealDates);
    const matched = buildDayMatchedTwTotals(
      hourlySales,
      hourlySalesLastWeek,
      hourlySalesLastYear,
      (h) => h.hour,
      (h) => h.sale_date.split("T")[0],
      (h) => h.total_sales - h.total_tax,
      (h) => h.qty,
      twToLwDay,
      twToLyDay,
    );

    return allHours
      .map((h) => {
        const tw = twMap[h]?.net ?? 0;
        const lw = lwMap[h]?.net ?? 0;
        const ly = lyMap[h]?.net ?? 0;
        const m = matched.get(h);
        const twNetForLW = m?.twNetForLW ?? 0;
        const twNetForLY = m?.twNetForLY ?? 0;
        return {
          hour: h,
          tw,
          lw,
          ly,
          trans: twMap[h]?.trans ?? 0,
          lwTrans: lwMap[h]?.trans ?? 0,
          lyTrans: lyMap[h]?.trans ?? 0,
          qty: twMap[h]?.qty ?? 0,
          lwQty: lwMap[h]?.qty ?? 0,
          lyQty: lyMap[h]?.qty ?? 0,
          hasLW: lw > 0,
          hasLY: ly > 0,
          vsLWPct: lw ? ((twNetForLW - lw) / lw) * 100 : 0,
          vsLYPct: ly ? ((twNetForLY - ly) / ly) * 100 : 0,
        };
      })
      .sort((a, b) => {
        const rank = { critical: 0, watch: 1, healthy: 2 } as const;
        const rankDiff =
          rank[hourSeverity(a, threshold)] - rank[hourSeverity(b, threshold)];
        if (rankDiff !== 0) return rankDiff;
        const aPct = a.hasLY ? a.vsLYPct : a.vsLWPct;
        const bPct = b.hasLY ? b.vsLYPct : b.vsLWPct;
        return aPct - bPct;
      });
  }, [hourlySales, hourlySalesLastWeek, hourlySalesLastYear]);

  const critCount = hours.filter(
    (h) => hourSeverity(h, threshold) === "critical",
  ).length;
  const watchCount = hours.filter(
    (h) => hourSeverity(h, threshold) === "watch",
  ).length;
  const healthyCount = hours.filter(
    (h) => hourSeverity(h, threshold) === "healthy",
  ).length;

  const visible = hours.filter((h) => {
    if (sevFilter === "critical")
      return hourSeverity(h, threshold) === "critical";
    if (sevFilter === "watch") return hourSeverity(h, threshold) === "watch";
    if (sevFilter === "healthy")
      return hourSeverity(h, threshold) === "healthy";
    return true;
  });

  const handleHourSortClick = (column: HourSortColumn) => {
    setHourSort((prev) => {
      if (prev?.column !== column) return { column, direction: "desc" };
      if (prev.direction === "desc") return { column, direction: "asc" };
      return null;
    });
  };
  const hourSortValue = (row: HourRow, column: HourSortColumn) =>
    column === "ty" ? row.tw : column === "vsLW" ? row.vsLWPct : row.vsLYPct;
  const sortedVisible = hourSort
    ? [...visible].sort((a, b) => {
        const diff = hourSortValue(a, hourSort.column) - hourSortValue(b, hourSort.column);
        return hourSort.direction === "desc" ? -diff : diff;
      })
    : visible;

  const selected =
    selectedHour !== null
      ? (hours.find((h) => h.hour === selectedHour) ?? null)
      : null;
  const cta = selected ? getCta(selected, threshold) : null;

  const avgBasket =
    selected && selected.trans > 0 ? selected.tw / selected.trans : 0;
  const lwAvgBasket =
    selected && selected.lwTrans > 0 ? selected.lw / selected.lwTrans : 0;
  const lyAvgBasket =
    selected && selected.lyTrans > 0 ? selected.ly / selected.lyTrans : 0;

  if (!hours.length) {
    return (
      <div className="flex items-center justify-center h-32 text-content text-sm">
        No hourly data
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div
        className="flex flex-col border-r border-gray-100"
        style={{ width: "36.5%" }}
      >
        {/* Filter chips + threshold */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-100 bg-gray-100">
          <button
            onClick={() => setSevFilter((f) => (f === "critical" ? "all" : "critical"))}
            className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_critical_bg text-severity_critical_text transition-shadow ${
              sevFilter === "critical" ? "ring-2 ring-severity_critical_text/40 shadow-sm" : ""
            }`}
          >
            Crit ({critCount})
          </button>
          <button
            onClick={() => setSevFilter((f) => (f === "watch" ? "all" : "watch"))}
            className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_watch_bg text-severity_watch_text transition-shadow ${
              sevFilter === "watch" ? "ring-2 ring-severity_watch_text/40 shadow-sm" : ""
            }`}
          >
            Watch ({watchCount})
          </button>
          <button
            onClick={() => setSevFilter((f) => (f === "healthy" ? "all" : "healthy"))}
            className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_healthy_bg text-severity_healthy_text transition-shadow ${
              sevFilter === "healthy" ? "ring-2 ring-severity_healthy_text/40 shadow-sm" : ""
            }`}
          >
            OK ({healthyCount})
          </button>
          <div className="relative">
            <button
              ref={threshBtnRef}
              onClick={() => setThreshOpen((v) => !v)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(threshOpen)}`}
            >
              Thresh
            </button>
            {threshOpen && (
              <div
                ref={threshPopRef}
                className="absolute top-full left-0 mt-1 p-1.5 rounded-md border border-gray-200 bg-custom-white shadow-lg z-20"
              >
                <ThresholdFilter
                  value={
                    rawThreshold === null ? null : { op: "gt", amount: rawThreshold }
                  }
                  onChange={(v) => dispatch(setHourlyThreshold(v?.amount ?? null))}
                  showOp={false}
                  suffix="%"
                  inputWidth={40}
                />
              </div>
            )}
          </div>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-gray-100 flex-shrink-0">
          <span className="w-2.5 flex-shrink-0" />
          <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-1">
            Hour
          </span>
          <div className="flex items-center gap-[14px]">
            <button
              onClick={() => handleHourSortClick("ty")}
              className="flex items-center justify-end gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0 pl-2.5"
              style={{ width: 64 }}
            >
              TY
              {hourSort?.column === "ty" &&
                (hourSort.direction === "desc" ? (
                  <ChevronDownIcon className="w-3 h-3" />
                ) : (
                  <ChevronUpIcon className="w-3 h-3" />
                ))}
            </button>
            <button
              onClick={() => handleHourSortClick("vsLW")}
              className="flex items-center justify-center gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0"
              style={{ width: 58 }}
            >
              vs LW
              {hourSort?.column === "vsLW" &&
                (hourSort.direction === "desc" ? (
                  <ChevronDownIcon className="w-3 h-3" />
                ) : (
                  <ChevronUpIcon className="w-3 h-3" />
                ))}
            </button>
            <button
              onClick={() => handleHourSortClick("vsLY")}
              className="flex items-center justify-center gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0"
              style={{ width: 58 }}
            >
              vs LY
              {hourSort?.column === "vsLY" &&
                (hourSort.direction === "desc" ? (
                  <ChevronDownIcon className="w-3 h-3" />
                ) : (
                  <ChevronUpIcon className="w-3 h-3" />
                ))}
            </button>
          </div>
        </div>

        {/* Signal list */}
        <div className="overflow-y-auto thin-scrollbar flex-1">
          {sortedVisible.map((r) => {
            const sev = hourSeverity(r, threshold);
            const isSel = selectedHour === r.hour;
            return (
              <button
                key={r.hour}
                onClick={() => dispatch(setSelectedHour(isSel ? null : r.hour))}
                className={`w-full flex items-center gap-2.5 p-3 text-left transition-colors border-l-2 border-b border-b-[#1e2a4a]/15 ${
                  isSel
                    ? "bg-row_selected border-row_selected_border"
                    : "border-transparent hover:bg-gray-50"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${severityDotClass[sev]}`} />
                <span className="text-[12px] font-medium text-content truncate flex-1">
                  {formatHourRange(r.hour)}
                </span>
                <div className="flex items-center gap-[14px]">
                  <span
                    className="text-[12px] font-semibold text-content flex-shrink-0 pl-2.5 text-right"
                    style={{ width: 64 }}
                  >
                    {formatCurrency2(r.tw)}
                  </span>
                  <span
                    className={`text-[12px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 ${
                      r.hasLW ? pillClass(r.vsLWPct, threshold) : "bg-gray-100 text-gray-400"
                    }`}
                    style={{ width: 58 }}
                  >
                    {r.hasLW ? formatPct(r.vsLWPct) : "—"}
                  </span>
                  <span
                    className={`text-[12px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 ${
                      r.hasLY ? pillClass(r.vsLYPct, threshold) : "bg-gray-100 text-gray-400"
                    }`}
                    style={{ width: 58 }}
                  >
                    {r.hasLY ? formatPct(r.vsLYPct) : "—"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header row: selected hour — doubles as the CTA insight toggle */}
        {selected && cta && (
          <div className={`relative border-b ${CTA_SEVERITY_CLASSES[cta.severity].border}`}>
            <button
              onClick={() => setCtaOpen((v) => !v)}
              className={`w-full flex items-center gap-1.5 px-3 py-1.5 ${CTA_SEVERITY_CLASSES[cta.severity].bg} ${CTA_SEVERITY_CLASSES[cta.severity].hoverBg} transition-colors`}
            >
              {cta.severity === "critical" && (
                <ExclamationTriangleIcon className={`w-3.5 h-3.5 ${CTA_SEVERITY_CLASSES[cta.severity].text} flex-shrink-0`} />
              )}
              {cta.severity === "watch" && (
                <ExclamationCircleIcon className={`w-3.5 h-3.5 ${CTA_SEVERITY_CLASSES[cta.severity].text} flex-shrink-0`} />
              )}
              {cta.severity === "healthy" && (
                <CheckCircleIcon className={`w-3.5 h-3.5 ${CTA_SEVERITY_CLASSES[cta.severity].text} flex-shrink-0`} />
              )}
              <span className={`text-[12px] font-semibold truncate ${CTA_SEVERITY_CLASSES[cta.severity].text}`}>
                {formatHourRange(selected.hour)}
              </span>
              <span className={`text-[10px] font-semibold flex-shrink-0 ${CTA_SEVERITY_CLASSES[cta.severity].text}`}>
                Insight
              </span>
              <span className="flex-1" />
              {ctaOpen ? (
                <ChevronUpIcon className={`w-3 h-3 flex-shrink-0 ${CTA_SEVERITY_CLASSES[cta.severity].text}`} />
              ) : (
                <ChevronDownIcon className={`w-3 h-3 flex-shrink-0 ${CTA_SEVERITY_CLASSES[cta.severity].text}`} />
              )}
            </button>
            {ctaOpen && (
              <div
                className={`absolute top-full left-0 right-0 z-20 px-3 py-2 border-b shadow-lg ${CTA_SEVERITY_CLASSES[cta.severity].bg} ${CTA_SEVERITY_CLASSES[cta.severity].border}`}
              >
                <span className={`text-[11px] leading-relaxed ${CTA_SEVERITY_CLASSES[cta.severity].text}`}>
                  {cta.text}
                </span>
              </div>
            )}
          </div>
        )}

        {selected ? (
          <>
            <div className="flex-1 overflow-y-auto thin-scrollbar leading-snug">
              {/* 3-col net sales KPI grid */}
              <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 leading-snug flex-shrink-0">
                <div className="px-4 py-3 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-content">
                    TY Net Sales
                  </div>
                  <div className="text-[10px] font-bold text-content mt-0.5">
                    {twDateLabel}
                  </div>
                  <div className="flex items-baseline justify-center gap-1 mt-0.5">
                    <span className="text-[13px] font-bold text-content">
                      {formatCurrency2(selected.tw)}
                    </span>
                    <span className="text-[10px] font-bold text-content">
                      {selected.qty.toLocaleString()} u
                    </span>
                  </div>
                </div>
                <div className="px-4 py-3 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-content">
                    vs Last Week
                  </div>
                  <div className="text-[10px] font-bold text-content mt-0.5">
                    {lwDateLabel}
                  </div>
                  <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
                    <span className="text-[13px] font-bold text-content">
                      {selected.hasLW ? formatCurrency2(selected.lw) : "—"}
                    </span>
                    {selected.lwQty > 0 && (
                      <span className="text-[10px] font-bold text-content">
                        {selected.lwQty.toLocaleString()} u
                      </span>
                    )}
                    {selected.hasLW && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pillClass(selected.vsLWPct, threshold)}`}
                      >
                        {formatPct(selected.vsLWPct)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-4 py-3 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-content">
                    vs Last Year
                  </div>
                  <div className="text-[10px] font-bold text-content mt-0.5">
                    {lyDateLabel}
                  </div>
                  <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
                    <span className="text-[13px] font-bold text-content">
                      {selected.hasLY ? formatCurrency2(selected.ly) : "—"}
                    </span>
                    {selected.lyQty > 0 && (
                      <span className="text-[10px] font-bold text-content">
                        {selected.lyQty.toLocaleString()} u
                      </span>
                    )}
                    {selected.hasLY && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pillClass(selected.vsLYPct, threshold)}`}
                      >
                        {formatPct(selected.vsLYPct)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Transactions — 3-col */}
              <div className="border-b border-gray-100 leading-snug">
                <div className="px-4 py-1.5 bg-gray-100 text-[10px] font-medium uppercase tracking-wide text-content">
                  Transactions
                </div>
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                  <div className="px-4 py-2.5">
                    <div className="text-[13px] font-semibold text-content">
                      {selected.trans.toLocaleString()}
                    </div>
                  </div>
                  <div className="px-4 py-2.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[13px] font-semibold text-content">
                        {selected.lwTrans > 0
                          ? selected.lwTrans.toLocaleString()
                          : "—"}
                      </span>
                      {selected.lwTrans > 0 && (
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${pillClass(((selected.trans - selected.lwTrans) / selected.lwTrans) * 100, threshold)}`}
                        >
                          {formatPct(
                            ((selected.trans - selected.lwTrans) /
                              selected.lwTrans) *
                              100,
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-2.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[13px] font-semibold text-content">
                        {selected.lyTrans > 0
                          ? selected.lyTrans.toLocaleString()
                          : "—"}
                      </span>
                      {selected.lyTrans > 0 && (
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${pillClass(((selected.trans - selected.lyTrans) / selected.lyTrans) * 100, threshold)}`}
                        >
                          {formatPct(
                            ((selected.trans - selected.lyTrans) /
                              selected.lyTrans) *
                              100,
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Avg basket — 3-col */}
              <div className="border-b border-gray-100 leading-snug">
                <div className="px-4 py-1.5 bg-gray-100 text-[10px] font-medium uppercase tracking-wide text-content">
                  Avg basket
                </div>
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                  <div className="px-4 py-2.5">
                    <div className="text-[13px] font-semibold text-content">
                      {formatCurrency2(avgBasket)}
                    </div>
                  </div>
                  <div className="px-4 py-2.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[13px] font-semibold text-content">
                        {lwAvgBasket > 0 ? formatCurrency2(lwAvgBasket) : "—"}
                      </span>
                      {lwAvgBasket > 0 && (
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${pillClass(((avgBasket - lwAvgBasket) / lwAvgBasket) * 100, threshold)}`}
                        >
                          {formatPct(
                            ((avgBasket - lwAvgBasket) / lwAvgBasket) * 100,
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-2.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[13px] font-semibold text-content">
                        {lyAvgBasket > 0 ? formatCurrency2(lyAvgBasket) : "—"}
                      </span>
                      {lyAvgBasket > 0 && (
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${pillClass(((avgBasket - lyAvgBasket) / lyAvgBasket) * 100, threshold)}`}
                        >
                          {formatPct(
                            ((avgBasket - lyAvgBasket) / lyAvgBasket) * 100,
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="border-b border-gray-100">
                <button
                  onClick={() => setChartOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-2"
                >
                  <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-content">
                    <PresentationChartLineIcon className="w-3.5 h-3.5 text-content/45" />
                    Chart
                  </span>
                  {chartOpen ? (
                    <ChevronUpIcon className="w-3 h-3 text-content/40" />
                  ) : (
                    <ChevronDownIcon className="w-3 h-3 text-content/40" />
                  )}
                </button>
                {chartOpen && weekHourDays && (
                  <div className="px-2 pb-3">
                    <HourTrendChart
                      days={weekHourDays}
                      hasLW={hasWeekLW}
                      hasLY={hasWeekLY}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-[12px] text-content">
            Select an hour
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupHourlyView;
