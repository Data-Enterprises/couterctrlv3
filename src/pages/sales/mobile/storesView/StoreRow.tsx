import { getHourly, getTopTen, getWeekly } from "../../../../api/sales";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import {
  setSalesViewHourly,
  setSalesViewHourlyLastYear,
  setSalesViewWeekly,
  setSelectedStore,
  setSortedSalesViewTopTen,
} from "../../../../features/salesMobileSlice";
import type { JsonError, WeeklySale } from "../../../../interfaces";
import {
  addDays,
  formatBigNumber,
  formatCurrency2,
  sameWeekDayLastYear,
} from "../../../../utils";
import { setDates } from "../../utils";
import { useMobileSalesCtx } from "../hooks";

interface StoreRowProps {
  panel: WeeklySale;
}

const StoreRow = ({ panel }: StoreRowProps) => {
  const toast = useToast();
  const ctx = useMobileSalesCtx();
  const dow = new Date(panel.sale_date).toLocaleDateString("en-US", {
    weekday: "short",
  });

  const formatDate = (dateStr: string) => {
    const split = dateStr.split("T")[0].split("-");
    return `${split[1]}/${split[2]}/${split[0]}`;
  };
  const dateStr = `${dow}, ${formatDate(panel.sale_date)}`;

  const formatWeight = (weight: number) => {
    const formatted = new Intl.NumberFormat("en-us", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(weight);

    return formatted;
  };

  const handleStoreSelect = () => {
    const selected = {
      store_name: panel.store_name,
      storeid: panel.storeid,
      sale_date: panel.sale_date,
    };
    ctx.dispatch(setSelectedStore(selected));

    // Make calls to topTen and weekly, and hourly
    const date = panel.sale_date.split("T")[0];
    const startDate = addDays(date, -6).toISOString().split("T")[0];
    const endDateLY = sameWeekDayLastYear(date);
    const lyDate = new Date(endDateLY.date);
    const lyWkEnd = setDates(lyDate);

    getHourly(ctx.url, ctx.token, date, date, 0, panel.storeid, 1)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          ctx.dispatch(
            setSalesViewHourly({ hourly: j.subs, isResetting: false }),
          );

          // Last year's same week
          getHourly(ctx.url, ctx.token, lyWkEnd, lyWkEnd, 0, panel.storeid, 1)
            .then((resp) => {
              const j = resp.data;
              if (j.error === 0) {
                ctx.dispatch(
                  setSalesViewHourlyLastYear({
                    hourly: j.subs,
                    isResetting: false,
                  }),
                );
              }
            })
            .catch((err: JsonError) => toast.error(err.message));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));

    getTopTen(ctx.url, ctx.token, panel.storeid, "Store", date, date)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          ctx.dispatch(
            setSortedSalesViewTopTen({ topTen: j.items, isResetting: false }),
          );
        }
      })
      .catch((err: JsonError) => toast.error(err.message));

    getWeekly(ctx.url, ctx.token, startDate, date, 0, panel.storeid, 1)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const sorted: WeeklySale[] = [...j.sales].sort(
            (a, b) =>
              new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime(),
          );

          ctx.dispatch(
            setSalesViewWeekly({ weekly: sorted, isResetting: false }),
          );
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const bgStyle =
    ctx.selectedStore.sale_date === panel.sale_date &&
    ctx.selectedStore.storeid === panel.storeid
      ? "bg-orange-200"
      : `odd:bg-custom-white even:bg-blue-200/50`;

  return (
    <div
      className={`transition-all duration-200 ${bgStyle} px-2 py-0.5`}
      onClick={handleStoreSelect}
    >
      <div className="font-medium flex justify-between">
        <div>{dateStr}</div>
        <div>{panel.store_name}</div>
      </div>
      <div className="grid grid-cols-4">
        <div>
          <div className="text-content/60">Sales</div>
          <div className="font-medium">
            {formatCurrency2(panel.total_sales - panel.total_tax)}
          </div>
        </div>
        <div>
          <div className="text-content/60">Tax</div>
          <div className="font-medium">{formatCurrency2(panel.total_tax)}</div>
        </div>

        <div>
          <div className="text-content/60">Qty</div>
          <div className="font-medium">{formatBigNumber(panel.qty, 0)}</div>
        </div>

        <div>
          <div className="text-content/60">Weight</div>
          <div className="font-medium">{formatWeight(panel.weight)}</div>
        </div>
      </div>
    </div>
  );
};

export default StoreRow;
