import { useSalesState } from "../hooks/useSalesState";
import { useState, useMemo, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  setItemThreshold,
  setSubDeptThreshold,
  setExportSubDeptName,
  setExportSubDeptItems,
  setSelectedSubDeptId,
  setSelectedSubDeptItems,
  setInactiveSubDeptItems,
  setLastFetchedItemsKey,
} from "../../../features/salesLedgerSlice";
import type { GradingMetric } from "../../../features/salesLedgerSlice";
import ThresholdFilter from "../../../components/filters/ThresholdFilter";
import {
  formatCurrency2,
  addDays,
  formatGoliathDate,
  sameWeekDayLastYear,
} from "../../../utils";
import { getSubMargins } from "../../../api/subMargins";
import { buildDayShiftMaps, buildDayMatchedTwTotals } from "../shared/ledgerUtils";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";
import type { Severity } from "./LedgerRow";
import type { SubDeptMargin } from "../../../interfaces";
import UpcContextMenu from "../../../components/UpcContextMenu";
import { formatPct, pillClass, chipClass, CTA_SEVERITY_CLASSES, severityDotClass, type SevFilter } from "./utils";
import SeverityBadge from "../../../components/SeverityBadge";
import TextFilter from "../../../components/filters/TextFilter";
import SelectFilter from "../../../components/filters/SelectFilter";

type DeptRow = {
  id: number;
  desc: string;
  tw: number;
  lw: number;
  ly: number;
  hasLW: boolean;
  hasLY: boolean;
  vsLWPct: number;
  vsLYPct: number;
  qty: number;
  lwQty: number;
  lyQty: number;
  digital: number;
  lyDigital: number;
  elecInstore: number;
  lyElecInstore: number;
  elecStore: number;
  lyElecStore: number;
  storeCpn: number;
  lyStoreCpn: number;
};

type Top10Item = {
  productCode: string;
  upc: string;
  desc: string;
  tyNet: number;
  tyQty: number;
  tyWeight: number;
  lwNet: number | null;
  lwQty: number | null;
  lwWeight: number | null;
  lyNet: number | null;
  lyQty: number | null;
  lyWeight: number | null;
  twNetForLW: number;
  twQtyForLW: number;
  twNetForLY: number;
  twQtyForLY: number;
};

type DeptSortColumn = "ty" | "vsLW" | "vsLY";
type DeptSortState = { column: DeptSortColumn; direction: "desc" | "asc" } | null;

type ItemSortColumn = "ty" | "lw" | "ly";
type ItemSortState = { column: ItemSortColumn; direction: "desc" | "asc" } | null;

const aggregateByCode = (
  items: SubDeptMargin[],
): Map<string, { desc: string; net: number; qty: number; weight: number }> => {
  const map = new Map<
    string,
    { desc: string; net: number; qty: number; weight: number }
  >();
  for (const item of items) {
    const ex = map.get(item.product_code);
    if (ex) {
      ex.net += item.total_sales - item.total_tax;
      ex.qty += item.qty;
      ex.weight += item.weight;
    } else {
      map.set(item.product_code, {
        desc: item.product_description,
        net: item.total_sales - item.total_tax,
        qty: item.qty,
        weight: item.weight,
      });
    }
  }
  return map;
};

const deptSeverity = (r: DeptRow, threshold: number): Severity => {
  const pct = r.hasLY ? r.vsLYPct : r.hasLW ? r.vsLWPct : 0;
  if (pct < -threshold) return "critical";
  if (pct < 0) return "watch";
  return "healthy";
};

const itemSeverity = (
  item: Top10Item,
  threshold: number,
  metric: GradingMetric,
): Severity => {
  const lyPct =
    metric === "sales"
      ? item.lyNet !== null && item.lyNet > 0
        ? ((item.twNetForLY - item.lyNet) / item.lyNet) * 100
        : null
      : item.lyQty !== null && item.lyQty > 0
        ? ((item.twQtyForLY - item.lyQty) / item.lyQty) * 100
        : null;
  const lwPct =
    metric === "sales"
      ? item.lwNet !== null && item.lwNet > 0
        ? ((item.twNetForLW - item.lwNet) / item.lwNet) * 100
        : null
      : item.lwQty !== null && item.lwQty > 0
        ? ((item.twQtyForLW - item.lwQty) / item.lwQty) * 100
        : null;
  const pct = lyPct ?? lwPct ?? 0;
  if (pct < -threshold) return "critical";
  if (pct < 0) return "watch";
  return "healthy";
};

const getCta = (
  row: DeptRow,
  threshold: number,
): { text: string; severity: Severity } => {
  const sev = deptSeverity(row, threshold);
  const primaryPeriod = row.hasLY ? "LY" : "LW";
  const primaryPct = row.hasLY ? row.vsLYPct : row.vsLWPct;
  const pctStr = `${Math.abs(primaryPct).toFixed(1)}%`;

  if (sev === "critical") {
    const secondaryNote =
      row.hasLY && row.hasLW
        ? row.vsLWPct < 0
          ? ` LW also down ${Math.abs(row.vsLWPct).toFixed(1)}% — trend is consistent.`
          : ` LW is up ${row.vsLWPct.toFixed(1)}% — decline may be seasonal vs last year.`
        : "";
    return {
      severity: "critical",
      text: `Down ${pctStr} vs ${primaryPeriod} — exceeds the ${threshold}% threshold.${secondaryNote} Check receiving, shrink, and pricing.`,
    };
  }
  if (sev === "watch") {
    const secondaryNote =
      row.hasLY && row.hasLW
        ? row.vsLWPct >= 0
          ? ` Recovering vs LW — may be stabilizing.`
          : ` LW also soft — monitor for a second consecutive week.`
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
    text: `At or above ${primaryPeriod}.${secondaryHealthNote} Contribution holding strong.`,
  };
};

interface PopupSubDeptListProps {
  twDateLabel: string;
  lwDateLabel: string;
  lyDateLabel: string;
  storeId: number;
  selectedDate: string | null;
  // The store's real (possibly-sparse) TW dates for this week, from
  // selection.days — used to build the exact LW/LY match set so the item
  // list's whole-week totals agree with the KPI strip and sub-dept rows,
  // which are all keyed off the same real dates rather than a hypothetical
  // full 7-day week.
  twRealDates: string[];
}

const PopupSubDeptList = ({
  twDateLabel,
  lwDateLabel,
  lyDateLabel,
  storeId,
  selectedDate,
  twRealDates,
}: PopupSubDeptListProps) => {
  const { subSales, subSalesWk2, subSalesWk3 } = useSalesState();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const rawThreshold = useAppSelector(
    (state) => state.salesLedger.subDeptThreshold,
  );
  const rawItemThreshold = useAppSelector(
    (state) => state.salesLedger.itemThreshold,
  );
  const gradingMetric = useAppSelector(
    (state) => state.salesLedger.gradingMetric,
  );
  const selectedId = useAppSelector(
    (state) => state.salesLedger.selectedSubDeptId,
  );
  const items = useAppSelector(
    (state) => state.salesLedger.selectedSubDeptItems,
  );
  const inactiveItems = useAppSelector(
    (state) => state.salesLedger.inactiveSubDeptItems,
  );
  const lastFetchedItemsKey = useAppSelector(
    (state) => state.salesLedger.lastFetchedItemsKey,
  );

  // Grading should never move rows around on its own when the threshold input
  // is cleared — keep grading against the last valid amount so severity/sort
  // order stays exactly where it was until a new number is typed.
  const thresholdRef = useRef<number>(rawThreshold ?? 9);
  if (rawThreshold != null) thresholdRef.current = rawThreshold;
  const threshold = thresholdRef.current;

  const itemThresholdRef = useRef<number>(rawItemThreshold ?? 9);
  if (rawItemThreshold != null) itemThresholdRef.current = rawItemThreshold;
  const itemThreshold = itemThresholdRef.current;
  // Per-day shift maps so dept/item-level matching uses the same
  // twDate→lwDate/lyDate lookups as the store level.
  const { twToLwDay, twToLyDay } = buildDayShiftMaps(twRealDates);
  const dispatch = useAppDispatch();
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [ctaOpen, setCtaOpen] = useState(false);
  const [threshOpen, setThreshOpen] = useState(false);
  const threshBtnRef = useRef<HTMLButtonElement>(null);
  const threshPopRef = useRef<HTMLDivElement>(null);
  const [itemThreshOpen, setItemThreshOpen] = useState(false);
  const itemThreshBtnRef = useRef<HTMLButtonElement>(null);
  const itemThreshPopRef = useRef<HTMLDivElement>(null);
  const [itemSevFilter, setItemSevFilter] = useState<SevFilter>("all");
  const [itemTextFilter, setItemTextFilter] = useState("");
  const [itemActiveFilter, setItemActiveFilter] = useState("active");
  const [deptSort, setDeptSort] = useState<DeptSortState>(null);
  const [itemSort, setItemSort] = useState<ItemSortState>(null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    upc: string;
  } | null>(null);

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

  useEffect(() => {
    if (!itemThreshOpen) return;
    const close = (e: MouseEvent) => {
      if (
        itemThreshBtnRef.current && !itemThreshBtnRef.current.contains(e.target as Node) &&
        itemThreshPopRef.current && !itemThreshPopRef.current.contains(e.target as Node)
      ) setItemThreshOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [itemThreshOpen]);

  useEffect(() => {
    setItemSevFilter("all");
  }, [selectedId]);

  useEffect(() => {
    if (selectedId === null) {
      dispatch(setSelectedSubDeptItems([]));
      dispatch(setInactiveSubDeptItems([]));
      return;
    }

    // Remounting with items already fetched for this exact store+sub
    // dept+day (e.g. navigating away and back) shouldn't refire the
    // request — Redux still has it, only the component tree was torn down.
    const itemsKey = `${storeId}_${selectedId}_${selectedDate ?? "all"}`;
    if (lastFetchedItemsKey === itemsKey) return;

    const twEnd = formatGoliathDate(search.singleDate);
    const twStart = addDays(search.singleDate, -6).toISOString().split("T")[0];
    const lwStart = addDays(search.singleDate, -13).toISOString().split("T")[0];
    const lwEnd = addDays(search.singleDate, -7).toISOString().split("T")[0];
    // The store's real (possibly-sparse) TW dates, passed down from the
    // parent's selection.days — using the real dates (not a hypothetical
    // full 7-day week) keeps the match set identical to what the KPI strip
    // and sub-dept rows use, so whole-week item totals agree with them.
    const lyWeekDates = twRealDates.map((d) => sameWeekDayLastYear(d).date).sort();
    const lyStart = lyWeekDates[0] ?? lwEnd;
    const lyEnd = lyWeekDates[lyWeekDates.length - 1] ?? lwEnd;
    const lwWeekDates = twRealDates.map(
      (d) => addDays(new Date(d), -7).toISOString().split("T")[0],
    );

    const tyStart = selectedDate ?? twStart;
    const tyEnd = selectedDate ?? twEnd;
    const lwDayStart = selectedDate
      ? addDays(new Date(selectedDate), -7).toISOString().split("T")[0]
      : lwStart;
    const lwDayEnd = selectedDate
      ? addDays(new Date(selectedDate), -7).toISOString().split("T")[0]
      : lwEnd;
    const lyDayStart = selectedDate
      ? sameWeekDayLastYear(selectedDate).date
      : lyStart;
    const lyDayEnd = selectedDate
      ? sameWeekDayLastYear(selectedDate).date
      : lyEnd;

    let cancelled = false;
    const fetch = async () => {
      setItemsLoading(true);
      try {
        const [tyResp, lwResp, lyResp] = await Promise.all([
          getSubMargins(
            context.url,
            context.token,
            selectedId,
            tyStart,
            tyEnd,
            0,
            storeId,
            1,
          ),
          getSubMargins(
            context.url,
            context.token,
            selectedId,
            lwDayStart,
            lwDayEnd,
            0,
            storeId,
            1,
          ),
          getSubMargins(
            context.url,
            context.token,
            selectedId,
            lyDayStart,
            lyDayEnd,
            0,
            storeId,
            1,
          ),
        ]);
        if (cancelled) return;

        const tyItems: SubDeptMargin[] =
          tyResp.data?.error === 0 ? tyResp.data.subs : [];
        let lwItems: SubDeptMargin[] =
          lwResp.data?.error === 0 ? lwResp.data.subs : [];
        let lyItems: SubDeptMargin[] =
          lyResp.data?.error === 0 ? lyResp.data.subs : [];

        // Whole-week case: the fetched LW/LY rows can include days that
        // don't actually correspond to any day in this TW week — filter down
        // to the exact matched date set before aggregating, so item totals
        // agree with the dept-level and store-level figures shown elsewhere
        // in this same popup.
        if (!selectedDate) {
          const lwDateSet = new Set(lwWeekDates);
          const lyDateSet = new Set(lyWeekDates);
          lwItems = lwItems.filter((i) => lwDateSet.has(i.sale_date.split("T")[0]));
          lyItems = lyItems.filter((i) => lyDateSet.has(i.sale_date.split("T")[0]));
        }

        const tyMap = aggregateByCode(tyItems);
        const lwMap = aggregateByCode(lwItems);
        const lyMap = aggregateByCode(lyItems);

        const sorted = [...tyMap.entries()].sort((a, b) => b[1].qty - a[1].qty);

        // An item can have real TW sales on days where the store overall
        // has an LW/LY match but this specific item doesn't — restrict the
        // TW side of each item's percentage to just the days that item has
        // a match on, same as the dept-level fix above.
        const matched = buildDayMatchedTwTotals(
          tyItems,
          lwItems,
          lyItems,
          (i) => i.product_code,
          (i) => i.sale_date.split("T")[0],
          (i) => i.total_sales - i.total_tax,
          (i) => i.qty,
          twToLwDay,
          twToLyDay,
        );

        dispatch(
          setSelectedSubDeptItems(
            sorted.map(([code, ty]) => {
              const lw = lwMap.get(code) ?? null;
              const ly = lyMap.get(code) ?? null;
              const m = matched.get(code);
              return {
                productCode: code,
                upc: code,
                desc: ty.desc,
                tyNet: ty.net,
                tyQty: ty.qty,
                tyWeight: ty.weight,
                lwNet: lw?.net ?? null,
                lwQty: lw?.qty ?? null,
                lwWeight: lw?.weight ?? null,
                lyNet: ly?.net ?? null,
                lyQty: ly?.qty ?? null,
                lyWeight: ly?.weight ?? null,
                twNetForLW: m?.twNetForLW ?? 0,
                twQtyForLW: m?.twQtyForLW ?? 0,
                twNetForLY: m?.twNetForLY ?? 0,
                twQtyForLY: m?.twQtyForLY ?? 0,
              };
            }),
          ),
        );
        // Items that sold LW and/or LY but have no TY row at all — invisible
        // in the normal TY-anchored list above since it's built from tyMap
        // alone. Surfaced separately so someone can spot "this used to sell
        // here" without it polluting the active list's severity counts.
        const inactiveCodes = new Set([...lwMap.keys(), ...lyMap.keys()].filter((code) => !tyMap.has(code)));
        const inactiveSorted = [...inactiveCodes].sort((a, b) => {
          const aTotal = (lwMap.get(a)?.net ?? 0) + (lyMap.get(a)?.net ?? 0);
          const bTotal = (lwMap.get(b)?.net ?? 0) + (lyMap.get(b)?.net ?? 0);
          return bTotal - aTotal;
        });
        dispatch(
          setInactiveSubDeptItems(
            inactiveSorted.map((code) => {
              const lw = lwMap.get(code) ?? null;
              const ly = lyMap.get(code) ?? null;
              return {
                productCode: code,
                upc: code,
                desc: lw?.desc ?? ly?.desc ?? code,
                tyNet: 0,
                tyQty: 0,
                tyWeight: 0,
                hasTY: false,
                lwNet: lw?.net ?? null,
                lwQty: lw?.qty ?? null,
                lwWeight: lw?.weight ?? null,
                lyNet: ly?.net ?? null,
                lyQty: ly?.qty ?? null,
                lyWeight: ly?.weight ?? null,
                twNetForLW: 0,
                twQtyForLW: 0,
                twNetForLY: 0,
                twQtyForLY: 0,
              };
            }),
          ),
        );
        dispatch(setLastFetchedItemsKey(itemsKey));
      } finally {
        if (!cancelled) setItemsLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [
    selectedId,
    selectedDate,
    search.singleDate,
    context.url,
    context.token,
    storeId,
  ]);

  const rows = useMemo((): DeptRow[] => {
    const buildMap = (src: typeof subSales) =>
      src.reduce(
        (
          acc: Record<
            number,
            {
              net: number;
              qty: number;
              digital: number;
              elecInstore: number;
              elecStore: number;
              storeCpn: number;
            }
          >,
          s,
        ) => {
          if (!acc[s.sub_department])
            acc[s.sub_department] = {
              net: 0,
              qty: 0,
              digital: 0,
              elecInstore: 0,
              elecStore: 0,
              storeCpn: 0,
            };
          acc[s.sub_department].net += s.total_sales - s.total_tax;
          acc[s.sub_department].qty += s.qty;
          acc[s.sub_department].digital += s.digital_coupons;
          acc[s.sub_department].elecInstore += s.elec_instore_coupons;
          acc[s.sub_department].elecStore += s.elec_store_coupons;
          acc[s.sub_department].storeCpn += s.store_coupon;
          return acc;
        },
        {},
      );

    const lwMap = buildMap(subSalesWk2);
    const lyMap = buildMap(subSalesWk3);

    const twMap = subSales.reduce(
      (
        acc: Record<
          number,
          {
            desc: string;
            net: number;
            qty: number;
            digital: number;
            elecInstore: number;
            elecStore: number;
            storeCpn: number;
          }
        >,
        s,
      ) => {
        if (!acc[s.sub_department]) {
          acc[s.sub_department] = {
            desc: s.sub_department_description,
            net: 0,
            qty: 0,
            digital: 0,
            elecInstore: 0,
            elecStore: 0,
            storeCpn: 0,
          };
        }
        acc[s.sub_department].net += s.total_sales - s.total_tax;
        acc[s.sub_department].qty += s.qty;
        acc[s.sub_department].digital += s.digital_coupons;
        acc[s.sub_department].elecInstore += s.elec_instore_coupons;
        acc[s.sub_department].elecStore += s.elec_store_coupons;
        acc[s.sub_department].storeCpn += s.store_coupon;
        return acc;
      },
      {},
    );

    // A dept can have real TW sales across days where the STORE overall has
    // an LW/LY match, but the dept itself doesn't — restrict the TW side of
    // each dept's percentage to just the days that dept has a match on.
    const matched = buildDayMatchedTwTotals(
      subSales,
      subSalesWk2,
      subSalesWk3,
      (s) => s.sub_department,
      (s) => s.sale_date.split("T")[0],
      (s) => s.total_sales - s.total_tax,
      (s) => s.qty,
      twToLwDay,
      twToLyDay,
    );

    return Object.entries(twMap)
      .map(([id, r]) => {
        const numId = Number(id);
        const lw = lwMap[numId];
        const ly = lyMap[numId];
        const lwNet = lw?.net ?? 0;
        const lyNet = ly?.net ?? 0;
        const m = matched.get(numId);
        const twNetForLW = m?.twNetForLW ?? 0;
        const twNetForLY = m?.twNetForLY ?? 0;
        return {
          id: numId,
          desc: r.desc,
          tw: r.net,
          lw: lwNet,
          ly: lyNet,
          hasLW: lwNet > 0,
          hasLY: lyNet > 0,
          vsLWPct: lwNet ? ((twNetForLW - lwNet) / lwNet) * 100 : 0,
          vsLYPct: lyNet ? ((twNetForLY - lyNet) / lyNet) * 100 : 0,
          qty: r.qty,
          lwQty: lw?.qty ?? 0,
          lyQty: ly?.qty ?? 0,
          digital: r.digital,
          lyDigital: ly?.digital ?? 0,
          elecInstore: r.elecInstore,
          lyElecInstore: ly?.elecInstore ?? 0,
          elecStore: r.elecStore,
          lyElecStore: ly?.elecStore ?? 0,
          storeCpn: r.storeCpn,
          lyStoreCpn: ly?.storeCpn ?? 0,
        };
      })
      .sort((a, b) => {
        const rank = { critical: 0, watch: 1, healthy: 2 } as const;
        const rankDiff =
          rank[deptSeverity(a, threshold)] - rank[deptSeverity(b, threshold)];
        if (rankDiff !== 0) return rankDiff;
        return (
          (a.hasLY ? a.vsLYPct : a.vsLWPct) - (b.hasLY ? b.vsLYPct : b.vsLWPct)
        );
      });
  }, [subSales, subSalesWk2, subSalesWk3]);

  const critCount = rows.filter(
    (r) => deptSeverity(r, threshold) === "critical",
  ).length;
  const watchCount = rows.filter(
    (r) => deptSeverity(r, threshold) === "watch",
  ).length;
  const healthyCount = rows.filter(
    (r) => deptSeverity(r, threshold) === "healthy",
  ).length;

  const visible =
    sevFilter === "all"
      ? rows
      : rows.filter((r) => deptSeverity(r, threshold) === sevFilter);

  const handleDeptSortClick = (column: DeptSortColumn) => {
    setDeptSort((prev) => {
      if (prev?.column !== column) return { column, direction: "desc" };
      if (prev.direction === "desc") return { column, direction: "asc" };
      return null;
    });
  };
  const deptSortValue = (row: DeptRow, column: DeptSortColumn) =>
    column === "ty" ? row.tw : column === "vsLW" ? row.vsLWPct : row.vsLYPct;
  const sortedVisible = deptSort
    ? [...visible].sort((a, b) => {
        const diff = deptSortValue(a, deptSort.column) - deptSortValue(b, deptSort.column);
        return deptSort.direction === "desc" ? -diff : diff;
      })
    : visible;

  const selected =
    selectedId !== null
      ? (rows.find((r) => r.id === selectedId) ?? null)
      : null;
  const cta = selected ? getCta(selected, threshold) : null;

  const baseItems = useMemo(
    () =>
      itemActiveFilter === "inactive"
        ? inactiveItems
        : itemActiveFilter === "active"
          ? items
          : [...items, ...inactiveItems],
    [itemActiveFilter, items, inactiveItems],
  );

  const itemsWithSev = useMemo(
    () =>
      baseItems.map((item) => ({
        ...item,
        sev: itemSeverity(item, itemThreshold, gradingMetric),
      })),
    [baseItems, itemThreshold, gradingMetric],
  );

  useEffect(() => {
    dispatch(setExportSubDeptName(selected?.desc ?? ""));
    dispatch(setExportSubDeptItems(selected ? itemsWithSev : []));
  }, [itemsWithSev, selectedId]);

  const itemCritCount = itemsWithSev.filter((i) => i.sev === "critical").length;
  const itemWatchCount = itemsWithSev.filter((i) => i.sev === "watch").length;
  const itemHealthyCount = itemsWithSev.filter(
    (i) => i.sev === "healthy",
  ).length;

  // Independent of the active severity chip, so the context menu's
  // "copy critical/watch/healthy" options always mean the same thing.
  const allUpcs = useMemo(() => itemsWithSev.map((i) => i.upc), [itemsWithSev]);
  const severityUpcs = useMemo(
    () => ({
      critical: itemsWithSev
        .filter((i) => i.sev === "critical")
        .map((i) => i.upc),
      watch: itemsWithSev.filter((i) => i.sev === "watch").map((i) => i.upc),
      healthy: itemsWithSev
        .filter((i) => i.sev === "healthy")
        .map((i) => i.upc),
    }),
    [itemsWithSev],
  );

  const visibleItems =
    itemSevFilter === "all"
      ? itemsWithSev
      : itemsWithSev.filter((i) => i.sev === itemSevFilter);

  const textFilteredItems = itemTextFilter.trim()
    ? visibleItems.filter((i) => {
        const q = itemTextFilter.trim().toLowerCase();
        return (
          i.upc.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q)
        );
      })
    : visibleItems;

  const handleItemSortClick = (column: ItemSortColumn) => {
    setItemSort((prev) => {
      if (prev?.column !== column) return { column, direction: "desc" };
      if (prev.direction === "desc") return { column, direction: "asc" };
      return null;
    });
  };
  // Nulls (no data for that period, e.g. an inactive item's TY or an
  // item with no LW/LY match) always sort last, regardless of direction —
  // otherwise "asc" would put them first, which reads as "worst" not "no data".
  const itemSortValue = (item: (typeof textFilteredItems)[number], column: ItemSortColumn) =>
    column === "ty" ? (item.hasTY === false ? null : item.tyNet) : column === "lw" ? item.lwNet : item.lyNet;
  const sortedItems = itemSort
    ? [...textFilteredItems].sort((a, b) => {
        const av = itemSortValue(a, itemSort.column);
        const bv = itemSortValue(b, itemSort.column);
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        const diff = av - bv;
        return itemSort.direction === "desc" ? -diff : diff;
      })
    : textFilteredItems;

  if (!rows.length) {
    return (
      <div className="flex items-center justify-center h-32 text-content text-sm">
        No sub department data
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full">
        {/* Left panel — signal list */}
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
                    onChange={(v) => dispatch(setSubDeptThreshold(v?.amount ?? null))}
                    showOp={false}
                    suffix="%"
                    inputWidth={40}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-gray-100 flex-shrink-0">
            <span className="w-2.5 flex-shrink-0" />
            <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-1">
              Sub Dept
            </span>
            <div className="flex items-center gap-[14px]">
              <button
                onClick={() => handleDeptSortClick("ty")}
                className="flex items-center justify-end gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0 pl-2.5"
                style={{ width: 64 }}
              >
                TY
                {deptSort?.column === "ty" &&
                  (deptSort.direction === "desc" ? (
                    <ChevronDownIcon className="w-3 h-3" />
                  ) : (
                    <ChevronUpIcon className="w-3 h-3" />
                  ))}
              </button>
              <button
                onClick={() => handleDeptSortClick("vsLW")}
                className="flex items-center justify-center gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0"
                style={{ width: 58 }}
              >
                vs LW
                {deptSort?.column === "vsLW" &&
                  (deptSort.direction === "desc" ? (
                    <ChevronDownIcon className="w-3 h-3" />
                  ) : (
                    <ChevronUpIcon className="w-3 h-3" />
                  ))}
              </button>
              <button
                onClick={() => handleDeptSortClick("vsLY")}
                className="flex items-center justify-center gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0"
                style={{ width: 58 }}
              >
                vs LY
                {deptSort?.column === "vsLY" &&
                  (deptSort.direction === "desc" ? (
                    <ChevronDownIcon className="w-3 h-3" />
                  ) : (
                    <ChevronUpIcon className="w-3 h-3" />
                  ))}
              </button>
            </div>
          </div>

          <div className="overflow-y-auto thin-scrollbar flex-1">
            {sortedVisible.map((r) => {
              const sev = deptSeverity(r, threshold);
              const isSel = selectedId === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() =>
                    dispatch(setSelectedSubDeptId(isSel ? null : r.id))
                  }
                  className={`w-full flex items-center gap-2.5 p-3 text-left transition-colors border-l-2 border-b border-b-[#1e2a4a]/15 ${
                    isSel
                      ? "bg-row_selected border-row_selected_border"
                      : "border-transparent hover:bg-gray-50"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${severityDotClass[sev]}`} />
                  <span
                    title={r.desc}
                    className="text-[12px] font-medium text-content truncate flex-1"
                  >
                    {r.desc}
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
          {/* Header row: selected name — doubles as the CTA insight toggle */}
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
                  {selected.desc}
                </span>
                <span className={`text-[12px] font-semibold flex-shrink-0 ${CTA_SEVERITY_CLASSES[cta.severity].text}`}>
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
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* 3-col KPI grid: TY / LW / LY */}
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

                {/* Items section */}
                <div
                  className="flex flex-col flex-1 overflow-hidden border-b border-gray-100 leading-snug"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setCtxMenu({ x: e.clientX, y: e.clientY, upc: "" });
                  }}
                >
                  {/* Items header */}
                  <div className="flex items-center justify-between gap-1 px-3 py-1 bg-gray-100 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setItemSevFilter((f) => (f === "critical" ? "all" : "critical"))}
                        className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_critical_bg text-severity_critical_text transition-shadow ${
                          itemSevFilter === "critical" ? "ring-2 ring-severity_critical_text/40 shadow-sm" : ""
                        }`}
                      >
                        Crit ({itemCritCount})
                      </button>
                      <button
                        onClick={() => setItemSevFilter((f) => (f === "watch" ? "all" : "watch"))}
                        className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_watch_bg text-severity_watch_text transition-shadow ${
                          itemSevFilter === "watch" ? "ring-2 ring-severity_watch_text/40 shadow-sm" : ""
                        }`}
                      >
                        Watch ({itemWatchCount})
                      </button>
                      <button
                        onClick={() => setItemSevFilter((f) => (f === "healthy" ? "all" : "healthy"))}
                        className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_healthy_bg text-severity_healthy_text transition-shadow ${
                          itemSevFilter === "healthy" ? "ring-2 ring-severity_healthy_text/40 shadow-sm" : ""
                        }`}
                      >
                        OK ({itemHealthyCount})
                      </button>
                      <div className="relative">
                        <button
                          ref={itemThreshBtnRef}
                          onClick={() => setItemThreshOpen((v) => !v)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(itemThreshOpen)}`}
                        >
                          Thresh
                        </button>
                        {itemThreshOpen && (
                          <div
                            ref={itemThreshPopRef}
                            className="absolute top-full left-0 mt-1 p-1.5 rounded-md border border-gray-200 bg-custom-white shadow-lg z-20"
                          >
                            <ThresholdFilter
                              value={
                                rawItemThreshold === null
                                  ? null
                                  : { op: "gt", amount: rawItemThreshold }
                              }
                              onChange={(v) => dispatch(setItemThreshold(v?.amount ?? null))}
                              showOp={false}
                              suffix="%"
                              inputWidth={40}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-[140px]">
                        <TextFilter
                          value={itemTextFilter}
                          onChange={setItemTextFilter}
                          placeholder="UPC/Desc"
                        />
                      </div>
                      <SelectFilter
                        options={[
                          { label: "Active", value: "active" },
                          { label: `Inactive (${inactiveItems.length})`, value: "inactive" },
                        ]}
                        value={itemActiveFilter}
                        onChange={setItemActiveFilter}
                        placeholder="All items"
                        className="w-[110px]"
                      />
                    </div>
                  </div>

                  {itemsLoading ? (
                    <div className="px-4 py-3 text-[11px] text-content">
                      Loading…
                    </div>
                  ) : textFilteredItems.length === 0 ? (
                    <div className="px-4 py-3 text-[11px] text-content">
                      No data
                    </div>
                  ) : (
                    <div className="flex flex-col flex-1 overflow-hidden">
                      {/* Column headers */}
                      <div className="flex items-center gap-2.5 px-3 py-1 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                        <span className="w-[18px] flex-shrink-0" />
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-content flex-1">
                          Items
                        </span>
                        <div className="flex items-center gap-[14px]">
                          <button
                            onClick={() => handleItemSortClick("ty")}
                            className="flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide text-content hover:text-[#1e2a4a] flex-shrink-0 pl-2.5"
                            style={{ width: 64 }}
                          >
                            TY
                            {itemSort?.column === "ty" &&
                              (itemSort.direction === "desc" ? (
                                <ChevronDownIcon className="w-2.5 h-2.5" />
                              ) : (
                                <ChevronUpIcon className="w-2.5 h-2.5" />
                              ))}
                          </button>
                          <button
                            onClick={() => handleItemSortClick("lw")}
                            className="flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide text-content hover:text-[#1e2a4a] flex-shrink-0"
                            style={{ width: 64 }}
                          >
                            LW
                            {itemSort?.column === "lw" &&
                              (itemSort.direction === "desc" ? (
                                <ChevronDownIcon className="w-2.5 h-2.5" />
                              ) : (
                                <ChevronUpIcon className="w-2.5 h-2.5" />
                              ))}
                          </button>
                          <button
                            onClick={() => handleItemSortClick("ly")}
                            className="flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide text-content hover:text-[#1e2a4a] flex-shrink-0"
                            style={{ width: 64 }}
                          >
                            LY
                            {itemSort?.column === "ly" &&
                              (itemSort.direction === "desc" ? (
                                <ChevronDownIcon className="w-2.5 h-2.5" />
                              ) : (
                                <ChevronUpIcon className="w-2.5 h-2.5" />
                              ))}
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto thin-scrollbar">
                        {sortedItems.map((item) => (
                          <div
                            key={item.productCode}
                            className="flex items-start gap-2.5 px-3 py-2 border-b border-b-[#1e2a4a]/15 last:border-0"
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCtxMenu({
                                x: e.clientX,
                                y: e.clientY,
                                upc: item.upc,
                              });
                            }}
                          >
                            <SeverityBadge severity={item.sev} showBackground={false} />
                            <div className="min-w-0 flex-1">
                              <span className="text-[13px] font-medium text-content truncate block">
                                {item.desc}
                              </span>
                              <span className="text-[10px] text-content block">
                                {item.upc}
                              </span>
                            </div>
                            <div className="flex items-start gap-[14px]">
                              <div className="flex-shrink-0 pl-2.5" style={{ width: 64 }}>
                                <div className="text-[13px] font-semibold text-content">
                                  {item.hasTY === false ? "—" : formatCurrency2(item.tyNet)}
                                </div>
                                <div className="text-[10px] text-content">
                                  {item.hasTY === false ? "" : `${item.tyQty.toLocaleString()} u`}
                                </div>
                              </div>
                              <div className="flex-shrink-0" style={{ width: 64 }}>
                                <div className="text-[13px] font-semibold text-content">
                                  {item.lwNet !== null ? formatCurrency2(item.lwNet) : "—"}
                                </div>
                                <div className="text-[10px] text-content">
                                  {item.lwQty !== null ? `${item.lwQty.toLocaleString()} u` : ""}
                                </div>
                              </div>
                              <div className="flex-shrink-0" style={{ width: 64 }}>
                                <div className="text-[13px] font-semibold text-content">
                                  {item.lyNet !== null ? formatCurrency2(item.lyNet) : "—"}
                                </div>
                                <div className="text-[10px] text-content">
                                  {item.lyQty !== null ? `${item.lyQty.toLocaleString()} u` : ""}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-[12px] text-content">
              Select a sub department
            </div>
          )}
        </div>
      </div>

      {ctxMenu && (
        <UpcContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          upc={ctxMenu.upc}
          allUpcs={allUpcs}
          severityUpcs={severityUpcs}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  );
};

export default PopupSubDeptList;
