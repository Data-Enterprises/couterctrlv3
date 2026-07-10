import { addDays, sameWeekDayLastYear } from "../../../utils";
import type {
  WeeklySale,
  SubSale,
  HourlySale,
  SubDeptMargin,
  Store,
} from "../../../interfaces";
import type { LedgerRowData, Severity } from "../components/LedgerRow";
import type { GradingMetric } from "../../../features/salesLedgerSlice";

export const SEVERITY_RANK = { critical: 0, watch: 1, healthy: 2 } as const;

export const BADGE_BG: Record<Severity, string> = {
  critical: "#fee2e2",
  watch: "#fef3c7",
  healthy: "#d1fae5",
};
export const BADGE_COLOR: Record<Severity, string> = {
  critical: "#ef4444",
  watch: "#f59e0b",
  healthy: "#10b981",
};
export const SECTION_BG: Record<Severity, string> = {
  critical: "bg-red-50",
  watch: "bg-amber-50",
  healthy: "bg-emerald-50",
};
export const SECTION_BORDER: Record<Severity, string> = {
  critical: "border-red-100",
  watch: "border-amber-100",
  healthy: "border-emerald-100",
};
export const SECTION_TEXT: Record<Severity, string> = {
  critical: "text-red-800",
  watch: "text-amber-800",
  healthy: "text-emerald-800",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeptRow = {
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

export type HourRow = {
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

// ─── Formatters ───────────────────────────────────────────────────────────────

export const formatPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

export const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

export const ampm = (h: number) =>
  h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;

// ─── Severity helpers ─────────────────────────────────────────────────────────

export const deptSeverity = (r: DeptRow, threshold = 9): Severity => {
  const pct = r.hasLY ? r.vsLYPct : r.hasLW ? r.vsLWPct : 0;
  if (pct < -threshold) return "critical";
  if (pct < 0) return "watch";
  return "healthy";
};

export const hourSeverity = (r: HourRow, threshold = 9): Severity => {
  const pct = r.hasLY ? r.vsLYPct : r.hasLW ? r.vsLWPct : 0;
  if (pct < -threshold) return "critical";
  if (pct < 0) return "watch";
  return "healthy";
};

// ─── Ledger row builder ───────────────────────────────────────────────────────

export const buildLedgerRows = (
  tw: WeeklySale[],
  lw: WeeklySale[],
  ly: WeeklySale[],
  assignedStores: Store[] = [],
  threshold: number = 9,
  gradingMetric: GradingMetric = "sales",
): LedgerRowData[] => {
  const storeIds = [...new Set(tw.map((d) => d.storeid))];
  return storeIds
    .map((id) => {
      const twRows = tw.filter((d) => d.storeid === id);
      const lwRows = lw.filter((d) => d.storeid === id);
      const lyRows = ly.filter((d) => d.storeid === id);
      const ref = twRows[0];
      const assigned = assignedStores.find((s) => s.storeid === id);
      const twTotal = twRows.reduce(
        (acc, r) => acc + (r.total_sales - r.total_tax),
        0,
      );
      const lwTotal = lwRows.reduce(
        (acc, r) => acc + (r.total_sales - r.total_tax),
        0,
      );
      const lyTotal = lyRows.reduce(
        (acc, r) => acc + (r.total_sales - r.total_tax),
        0,
      );
      const twQty = twRows.reduce((acc, r) => acc + r.qty, 0);
      const lwQty = lwRows.reduce((acc, r) => acc + r.qty, 0);
      const lyQty = lyRows.reduce((acc, r) => acc + r.qty, 0);
      const gradeTW = gradingMetric === "qty" ? twQty : twTotal;
      const gradeLW = gradingMetric === "qty" ? lwQty : lwTotal;
      const gradeLY = gradingMetric === "qty" ? lyQty : lyTotal;
      const hasLW = lwTotal > 0;
      const hasLY = lyTotal > 0;
      const vsLYDollar = twTotal - lyTotal;
      const vsLYPct = hasLY ? ((gradeTW - gradeLY) / gradeLY) * 100 : 0;
      const vsLWPct = hasLW ? ((gradeTW - gradeLW) / gradeLW) * 100 : 0;
      const severity: LedgerRowData["severity"] = (() => {
        const pct = hasLY ? vsLYPct : hasLW ? vsLWPct : 0;
        if (pct < -threshold) return "critical";
        if (pct < 0) return "watch";
        return "healthy";
      })();
      const days = twRows
        .sort((a, b) => a.sale_date.localeCompare(b.sale_date))
        .map((r) => {
          const twDate = r.sale_date.split("T")[0];
          const lwDate = addDays(new Date(twDate), -7)
            .toISOString()
            .split("T")[0];
          const lyDate = sameWeekDayLastYear(twDate).date;
          const lwRow = lwRows.find((l) => l.sale_date.startsWith(lwDate));
          const lyRow = lyRows.find((l) => l.sale_date.startsWith(lyDate));
          return {
            sale_date: r.sale_date,
            twNet: r.total_sales - r.total_tax,
            lwNet: lwRow ? lwRow.total_sales - lwRow.total_tax : 0,
            lyNet: lyRow ? lyRow.total_sales - lyRow.total_tax : 0,
            twQty: r.qty,
          };
        });
      return {
        storeid: id,
        store_name: assigned?.store_name ?? ref.store_name,
        store_number: assigned?.store_number ?? ref.store_number,
        twTotal,
        lwTotal,
        lyTotal,
        twQty,
        lwQty,
        lyQty,
        vsLWPct,
        vsLYPct,
        vsLYDollar,
        hasLW,
        hasLY,
        severity,
        days,
      };
    })
    .sort((a, b) => {
      const rankDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (rankDiff !== 0) return rankDiff;
      const aPct = a.hasLY ? a.vsLYPct : a.vsLWPct;
      const bPct = b.hasLY ? b.vsLYPct : b.vsLWPct;
      return aPct - bPct;
    });
};

// ─── Aggregators ──────────────────────────────────────────────────────────────

export const aggSubDepts = (
  src: SubSale[],
): Record<
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
> =>
  src.reduce(
    (acc, s) => {
      if (!acc[s.sub_department])
        acc[s.sub_department] = {
          desc: s.sub_department_description,
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
    {} as Record<
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
  );

export const aggHours = (
  src: HourlySale[],
): Record<number, { net: number; trans: number; qty: number }> =>
  src.reduce(
    (acc, h) => {
      if (!acc[h.hour]) acc[h.hour] = { net: 0, trans: 0, qty: 0 };
      acc[h.hour].net += h.total_sales - h.total_tax;
      acc[h.hour].trans += h.transactions;
      acc[h.hour].qty += h.qty;
      return acc;
    },
    {} as Record<number, { net: number; trans: number; qty: number }>,
  );

export const aggByCode = (
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
    } else
      map.set(item.product_code, {
        desc: item.product_description,
        net: item.total_sales - item.total_tax,
        qty: item.qty,
        weight: item.weight,
      });
  }
  return map;
};
