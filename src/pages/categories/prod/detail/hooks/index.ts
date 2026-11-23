// Hooks
import { useMemo } from "react";

// Utils
import { pctChange, shiftIso, LW_OFFSET, LY_OFFSET } from "../../utils";

// Interfaces
import type { CatSalesHourly, CategoryMetric } from "../../../../../interfaces";
import type { HourDetail, HourRow } from "../interfaces";

/** Hours folded per period, narrowed to the selected day when there is one so
 *  the two tabs can never disagree about which dates are in play. */
export const useHourRows = (
  hourly: { tw: CatSalesHourly[]; lw: CatSalesHourly[]; ly: CatSalesHourly[] },
  metric: CategoryMetric,
  selectedDay: string | null,
): HourRow[] => {
  const isQty = metric === "qty";

  return useMemo(() => {
    const narrow = (list: typeof hourly.tw, offset: number) =>
      selectedDay
        ? list.filter(
            (h) => h.sale_date.split("T")[0] === shiftIso(selectedDay, offset),
          )
        : list;
    const fold = (list: typeof hourly.tw) => {
      const m = new Map<number, HourDetail>();
      for (const h of list) {
        const cur = m.get(h.hour) ?? {
          v: 0,
          gross: 0,
          tax: 0,
          qty: 0,
          basket: 0,
          avgPrice: 0,
          n: 0,
        };
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
};
