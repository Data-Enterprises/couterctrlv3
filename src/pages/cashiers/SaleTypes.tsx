import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

import { getCashierDetails, getCashierTable } from "../../api/cashiers";
import {
  setSelectedSaleType,
  setChunkedSales,
  setChunkedTrends,
  setCashierDetails,
  setCashierTrends,
  setCashierTransactions,
  resetCashierState,
  setSaleTypes,
} from "../../features/cashierSlice";
import type { JsonError } from "../../interfaces";
import { formatGoliathDate } from "../../utils";
import { activePanelStyle, chunkData } from ".";

interface SaleTypesProps {
  setLoading: (loading: boolean) => void;
}

const SaleTypes = ({ setLoading }: SaleTypesProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const cashier = useAppSelector((state) => state.cashier);
  const search = useAppSelector((state) => state.search);

  const handlePanelClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Doing this to reset when looking for a different sale type
    const panels = cashier.saleTypes;
    dispatch(resetCashierState());
    dispatch(setSaleTypes(panels));

    // Setting this to handle selected css styling and show the loading indicator
    dispatch(setSelectedSaleType(e.currentTarget.innerText));
    setLoading(true);

    const saleType = e.currentTarget.innerText;
    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue =
      search.type === "Group" ? search.lastGroup : search.lastStore;

    getCashierTable(
      context.url,
      context.token,
      formatGoliathDate(search.startDate),
      formatGoliathDate(search.endDate),
      useGroups,
      searchValue,
      singleStore,
      [saleType],
      1
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setCashierTransactions(j.transactions));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching cashier table: " + err.message)
      );

    getCashierDetails(
      context.url,
      context.token,
      formatGoliathDate(search.startDate),
      formatGoliathDate(search.endDate),
      useGroups,
      searchValue,
      singleStore,
      [saleType]
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setCashierDetails(j.sales));
          dispatch(setCashierTrends(j.trend));
          dispatch(setChunkedSales(chunkData(j.sales)));
          dispatch(setChunkedTrends(chunkData(j.trend)));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching cashier details: " + err.message)
      )
      .finally(() => setLoading(false));
  };

  return (
    <div className="grid grid-cols-4 gap-4 mt-4">
      {cashier.saleTypes.map((st, i) => (
        <div
          key={i}
          className={`${activePanelStyle(
            st.sale_type,
            cashier.selectedSaleType
          )} py-3 rounded-lg text-center shadow-lg hover:bg-panel_active/75 
                cursor-pointer transition-all duration-200 ripple-button`}
          onClick={handlePanelClick}
        >
          <span>{st.sale_type}</span>
        </div>
      ))}
    </div>
  );
};

export default SaleTypes;
