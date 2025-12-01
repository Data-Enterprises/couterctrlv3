import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useHeight } from "../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getSubs } from "../../../api/sales";
import type { JsonError } from "../../../interfaces";
import { formatGoliathDate } from "../../../utils";
import SubCard from "./SubCard";
import { setCompareSubs } from "../../../features/salesSlice";

// type NewBarData = {
//   date: string;
// } & SalesBarData;

const Subs = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const sales = useAppSelector((state) => state.sales);
  const { topRef, bottomRef, height } = useHeight();

  useEffect(() => {
    if (sales.selectedSalesPanel.storeid === 0) return;
    console.log(sales.compareSalesPanel);
    const p = sales.compareSalesPanel;
    const start = p.sale_date
      ? p.sale_date.split("T")[0]
      : formatGoliathDate(search.startDate);
    const end = p.sale_date
      ? p.sale_date.split("T")[0]
      : formatGoliathDate(search.endDate);

    getSubs(context.url, context.token, start, end, 0, p.storeid, 1)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setCompareSubs(j.subs));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching subs data: " + err.message)
      );
  }, [sales.compareSalesPanel]);

  // Should be false by default when loading, only when compare is selected will this return true
  const isComparing = () => {
    return sales.compareSalesPanel.storeid === 0;
  };

  return (
    <div
      className={`w-full h-full bg-custom-white rounded-lg shadow-lg  ${
        sales.windowVisible.subs ? "" : "hidden"
      }`}
      ref={topRef}
    >
      <div>
        <div
          ref={bottomRef}
          className="bg-blue-500 text-custom-white flex justify-between py-0.5 px-4 font-medium rounded-t-lg"
        >
          <div>Sub Department Sales</div>
        </div>
        {isComparing() ? (
          <div
            className={`grid grid-cols-2 no-scrollbar overflow-y-scroll p-2 gap-2`}
            style={{ height: height, maxHeight: height }}
          >
            {sales.subSales.map((sub, i) => (
              <SubCard key={i} sub={sub} />
            ))}
          </div>
        ) : (
          <div
            className={`grid grid-cols-2 no-scrollbar overflow-y-scroll p-2 gap-2`}
            style={{ height: height, maxHeight: height }}
          >
            <div className="space-y-2">
              {sales.subSales.map((sub, i) => (
                <SubCard key={i} sub={sub} />
              ))}
            </div>
            <div className="space-y-2">
              {sales.compareSubs.map((sub, i) => (
                <SubCard key={i} sub={sub} type="compare" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subs;
