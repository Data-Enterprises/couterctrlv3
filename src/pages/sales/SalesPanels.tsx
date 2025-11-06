// HOOKS
import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

// API
import { salesTwoDates } from "../../api/sales";

// TYPES
import type { JsonError } from "../../interfaces";

// REDUX
import { setSalesTwoDates } from "../../features/salesSlice";

// UTILS
import { formatGoliathDate } from "../../utils";

const SalesPanels = () => {
  const dummyCards = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);

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
          dispatch(setSalesTwoDates(j.items));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting Sales Two Dates data: " + err.message);
      });
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg overflow-hidden">
      {dummyCards.map((card) => (
        <div key={card} className="bg-custom-white rounded-lg p-4 shadow-lg">
          Card {card}
        </div>
      ))}
    </div>
  );
};

export default SalesPanels;
