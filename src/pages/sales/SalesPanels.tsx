// HOOKS
import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
// API
import { salesTwoDates } from "../../api/sales";
// TYPES
import type { JsonError } from "../../interfaces";
// REDUX
import { setSalesPanels } from "../../features/salesSlice";
// UTILS
import { formatGoliathDate, formatCurrency2, reformatDate } from "../../utils";

const SalesPanels = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const { salesPanels } = useAppSelector((state) => state.sales);

  useEffect(() => {
    if (context.token) {
      getData();
    }
  }, [context.token]);

  const getData = () => {
    // For now I'm formatting the date before the api call since the api needs it that way
    const start = formatGoliathDate(search.startDate);
    const end = formatGoliathDate(search.endDate);
    const useGroups =
      search.type.toString() == "2" || search.type.toString() == "Group"
        ? 1
        : 0;
    const singleStore =
      search.type.toString() == "2" || search.type.toString() == "Group"
        ? 0
        : 1;
    salesTwoDates(
      context.url,
      context.token,
      start,
      end,
      useGroups,
      search.lastStore,
      singleStore
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setSalesPanels(j.items));
          // make the call to weekly with the first returned item to get default behavior
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting Sales Two Dates data: " + err.message);
      });
  };

  // When the sales panels are ready, onClick will call handlePanelClick() for that panel
  return (
    <div className="grid grid-cols-4 gap-4 min-h-[100%] max-h-[100%]">
      {salesPanels.length
        ? salesPanels.map((panel, idx) => (
            <div
              key={idx}
              className="bg-custom-white rounded-lg px-4 py-2 shadow-lg"
            >
              <div className="font-medium border-b border-content/30 flex justify-between">
                <div className="w-1/3">{panel.store_name}</div>
                <div className="w-1/3 text-center">
                  {reformatDate(panel.sale_date.split("T")[0])}
                </div>
                <div className="w-1/3 text-right">Term: {panel.terminal}</div>
              </div>
              <div className="flex justify-between pb-1 pt-2 text-center">
                <div className="w-1/3">
                  <div>Total Sales</div>
                  <div className="font-medium">
                    {formatCurrency2(panel.total_sales)}
                  </div>
                </div>
                <div className="w-1/3">
                  {" "}
                  <div>Weight</div>
                  <div className="font-medium">{panel.weight.toFixed(2)}</div>
                </div>
                <div className="w-1/3">
                  <div>Quantity</div>
                  <div className="font-medium">{panel.qty}</div>
                </div>
              </div>
            </div>
          ))
        : null}
    </div>
  );
};

export default SalesPanels;
