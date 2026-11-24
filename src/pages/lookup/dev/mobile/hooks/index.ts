// Hooks
import { useState } from "react";

// Utils
import {
  buildDayBuckets,
  buildSaleTypeBreakdown,
  rowsOfSaleType,
} from "../../utils";

// Interfaces
import type { DayBucket } from "../../interfaces";
import type { ItemLookupHistory } from "../../../../../features/dev/devItemLookupSlice";

/**
 * The phone report's two lenses: which sale type's timeline is shown, and
 * which day (if any) is scoped. Both are keyed to the item, so a new lookup
 * opens on its sales and the whole window rather than inheriting the last
 * item's scope.
 */
export const useLookupLens = (
  productCode: string,
  historyAll: ItemLookupHistory[],
  buckets: DayBucket[],
) => {
  const [saleTypePick, setSaleTypePick] = useState({ code: "", type: "Sale" });
  const [dayPick, setDayPick] = useState<{ code: string; date: string | null }>(
    {
      code: "",
      date: null,
    },
  );

  const saleTypes = buildSaleTypeBreakdown(historyAll);
  const selectedSaleType =
    saleTypePick.code === productCode &&
    saleTypes.some((s) => s.saleType === saleTypePick.type)
      ? saleTypePick.type
      : "Sale";
  const isSale = selectedSaleType === "Sale";

  const timeline = isSale
    ? buckets
    : buildDayBuckets(rowsOfSaleType(historyAll, selectedSaleType));

  const selectedDay = dayPick.code === productCode ? dayPick.date : null;
  const day = selectedDay
    ? (timeline.find((b) => b.date === selectedDay) ?? null)
    : null;

  const pickDay = (iso: string) =>
    setDayPick({
      code: productCode,
      date: selectedDay === iso ? null : iso,
    });

  const pickSaleType = (type: string) => {
    setSaleTypePick({ code: productCode, type });
    // The scoped day belonged to the old timeline (a cancellation on the 12th
    // isn't a sale on the 12th), so it is cleared.
    setDayPick({ code: productCode, date: null });
  };

  return {
    saleTypes,
    selectedSaleType,
    isSale,
    timeline,
    selectedDay,
    day,
    pickDay,
    pickSaleType,
  };
};
