// Hooks
import { useMemo } from "react";
import { useLossPreventionCtx } from ".";

// Utils
import { getStoreName } from "../../../../utils";
import { applyStoreNumberToName } from "../../../../utils/storeIdentity";
import { isNoDollarType, storeSeverity } from "../utils/grading";
import { SEV_RANK } from "../utils";

// Interfaces
import type { SevFilter } from "../../../../utils/severity";

/**
 * The store list: each store graded against the two-week baseline (or a
 * picked day against the same weekday in both baseline weeks), the severity
 * counts, the week's or day's totals, the day options, and the rows the
 * severity and text filters leave, worst first.
 */
export const useStoreGrading = (sevFilter: SevFilter, storeFilter: string) => {
  const cashier = useLossPreventionCtx();
  const {
    weekDate,
    assignedStores,
    selectedSaleType,
    cashierDetails,
    baselineDetails,
    selectedDay,
    dayDetails,
    dayBaselineDetails,
  } = cashier;

  // With a day selected the rows and their baseline both come from that day's
  // fetch; the baseline is the same weekday from both baseline weeks summed,
  // so the /2 below still reads as "average of the matched days".
  const activeDetails = selectedDay ? dayDetails : cashierDetails;
  const activeBaseline = selectedDay ? dayBaselineDetails : baselineDetails;

  // The seven days of the searched week, newest first.
  const dayOptions = useMemo(() => {
    const [m, d, y] = weekDate.split("/").map(Number);
    const end = new Date(y, m - 1, d);
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(y, m - 1, d - i);
      return {
        value: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`,
        label: dt.toLocaleDateString("en-US", {
          weekday: "short",
          month: "numeric",
          day: "numeric",
        }),
      };
    }).filter(() => !Number.isNaN(end.getTime()));
  }, [weekDate]);

  // Header totals follow the filter — week totals beside day-scoped rows would
  // read as though the rows didn't add up.
  const totalSales = activeDetails.reduce(
    (acc, d) => acc + Math.abs(d.amount),
    0,
  );
  const totalTrans = activeDetails.reduce(
    (acc, d) => acc + d.transaction_count,
    0,
  );
  const totalItems = activeDetails.reduce((acc, d) => acc + d.total_items, 0);

  const hasAmount = !isNoDollarType(selectedSaleType);

  // storeid -> every store_number returned under it. More than one means
  // co-located locations that the name alone can't tell apart.
  const numbersByStoreId = useMemo(
    () =>
      activeDetails.reduce((acc: Record<number, string[]>, d) => {
        const nums = (acc[d.storeid] ??= []);
        if (!nums.includes(d.store_number)) nums.push(d.store_number);
        return acc;
      }, {}),
    [activeDetails],
  );

  const graded = useMemo(
    () =>
      activeDetails.map((detail) => {
        // storeid + store_number, not storeid alone: co-located stores share
        // an id, and matching on the id would hand both rows whichever
        // sibling's baseline happened to come back first.
        const b = activeBaseline.find(
          (x) =>
            x.storeid === detail.storeid &&
            x.store_number === detail.store_number,
        );
        const bTrans = b ? b.transaction_count / 2 : null;
        const bItems = b ? b.total_items / 2 : null;
        const bAmount = b ? Math.abs(b.amount) / 2 : null;
        const bAvg = b ? Math.abs(b.average_dollars) : null;
        const transPct =
          bTrans !== null && bTrans !== 0
            ? ((detail.transaction_count - bTrans) / Math.abs(bTrans)) * 100
            : null;
        const itemsPct =
          bItems !== null && bItems !== 0
            ? ((detail.total_items - bItems) / Math.abs(bItems)) * 100
            : null;
        const amountPct =
          bAmount !== null && bAmount !== 0
            ? ((Math.abs(detail.amount) - bAmount) / bAmount) * 100
            : null;
        const avgPct =
          bAvg !== null && bAvg !== 0
            ? ((Math.abs(detail.average_dollars) - bAvg) / bAvg) * 100
            : null;
        return {
          detail,
          // getStoreName resolves by storeid, so co-located rows come back with
          // the identical name — rewrite the embedded number to this row's.
          name: applyStoreNumberToName(
            getStoreName(assignedStores, detail.storeid, detail.store_name),
            detail.store_number,
            numbersByStoreId[detail.storeid] ?? [],
          ),
          sev: storeSeverity(detail, activeBaseline, selectedSaleType),
          transPct,
          itemsPct,
          amountPct,
          avgPct,
        };
      }),
    [
      activeDetails,
      activeBaseline,
      selectedSaleType,
      assignedStores,
      numbersByStoreId,
    ],
  );

  const counts = {
    critical: graded.filter((g) => g.sev === "critical").length,
    watch: graded.filter((g) => g.sev === "watch").length,
    healthy: graded.filter((g) => g.sev === "healthy").length,
  };

  const sevFilteredStores =
    sevFilter === "all" ? graded : graded.filter((g) => g.sev === sevFilter);

  const textFilteredStores = storeFilter
    ? sevFilteredStores.filter((g) =>
        g.name.toLowerCase().includes(storeFilter.toLowerCase()),
      )
    : sevFilteredStores;

  const gradeOrdered = [...textFilteredStores].sort(
    (a, b) => SEV_RANK[a.sev] - SEV_RANK[b.sev],
  );

  return {
    activeDetails,
    dayOptions,
    totals: { sales: totalSales, trans: totalTrans, items: totalItems },
    hasAmount,
    counts,
    gradeOrdered,
  };
};

export type GradedStore = ReturnType<
  typeof useStoreGrading
>["gradeOrdered"][number];
