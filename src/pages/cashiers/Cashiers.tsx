import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

import { getSaleTypes } from "../../api/cashiers";
import { formatGoliathDate } from "../../utils";
import { setSaleTypes } from "../../features/cashierSlice";
import type { JsonError } from "../../interfaces";

// components
import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";

const Cashiers = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);

  useEffect(() => {
    const start = formatGoliathDate(search.startDate);
    const end = formatGoliathDate(search.endDate);
    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue =
      search.type === "Group" ? search.lastGroup : search.lastStore;
    getSaleTypes(
      context.url,
      context.token,
      start,
      end,
      useGroups,
      searchValue,
      singleStore
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setSaleTypes(j.sale_types));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching sale types: " + err.message)
      );
  }, []);
  return (
    <div
      data-testid="cashiers-page"
      className="w-full h-[calc(100vh-3rem)] p-4"
    >
      <div className="w-[30%] bg-custom-white px-4 py-2 rounded-lg shadow-lg">
        <StorePicker />
        <DatePickers />
      </div>
    </div>
  );
};

export default Cashiers;
