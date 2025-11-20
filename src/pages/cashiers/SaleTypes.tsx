import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

import { getCashierDetails } from "../../api/cashiers";
import {
  setSelectedSaleTypes,
  setSelectedSaleType,
  setChunkedSales,
  setChunkedTrends,
  setCashierDetails,
  setCashierTrends,
  setCashierTransactions,
} from "../../features/cashierSlice";
import type { JsonError } from "../../interfaces";
import { formatGoliathDate } from "../../utils";
import { chunkData } from ".";

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
    dispatch(setSelectedSaleTypes(e.currentTarget.innerText));
    dispatch(setSelectedSaleType(e.currentTarget.innerText));
    // handleRipple(e);

    dispatch(setChunkedSales([]));
    dispatch(setChunkedTrends([]));
    setLoading(true);

    const saleType = e.currentTarget.innerText;
    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue =
      search.type === "Group" ? search.lastGroup : search.lastStore;
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
          dispatch(setCashierTransactions(j.transactions));
          dispatch(setChunkedSales(chunkData(j.sales)));
          dispatch(setChunkedTrends(chunkData(j.trend)));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching cashier details: " + err.message)
      )
      .finally(() => setLoading(false));
  };

  const activePanelStyle = (type: string) => {
    if (cashier.selectedSaleType === type) {
      return "bg-emerald-500 text-custom-white font-medium shadow-inner";
    } else {
      return "bg-custom-white";
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4 mt-4">
      {cashier.saleTypes.map((st, i) => (
        <div
          key={i}
          className={`${activePanelStyle(
            st.sale_type
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
