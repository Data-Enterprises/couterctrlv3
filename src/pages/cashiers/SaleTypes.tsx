import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getCashierDetails, getCashierTable } from "../../api/cashiers";
import {
  setSelectedSaleType,
  setCashierDetails,
  setCashierTrends,
  setCashierTransactions,
  resetCashierState,
  setSaleTypes,
} from "../../features/cashierSlice";
import type { JsonError } from "../../interfaces";
import { activePanelStyle } from ".";
import { useApiContext } from "../hooks";

interface SaleTypesProps {
  setLoading: (loading: boolean) => void;
}

const SaleTypes = ({ setLoading }: SaleTypesProps) => {
  const toast = useToast();
  const params = useApiContext();
  const dispatch = useAppDispatch();
  const cashier = useAppSelector((state) => state.cashier);

  const handlePanelClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Doing this to reset when looking for a different sale type
    const panels = cashier.saleTypes;
    dispatch(resetCashierState());
    dispatch(setSaleTypes(panels));

    // Setting this to handle selected css styling and show the loading indicator
    dispatch(setSelectedSaleType(e.currentTarget.innerText));
    setLoading(true);

    // Using useApiContext hook to get the params
    const saleType = e.currentTarget.innerText;
    getCashierTable(
      params.url,
      params.token,
      params.start,
      params.end,
      params.useGroups,
      params.searchValue,
      params.singleStore,
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
      params.url,
      params.token,
      params.start,
      params.end,
      params.useGroups,
      params.searchValue,
      params.singleStore,
      [saleType]
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          // The chunked sales and trends are being set in the dispatches
          dispatch(setCashierDetails(j.sales));
          dispatch(setCashierTrends(j.trend));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching cashier details: " + err.message)
      )
      .finally(() => setLoading(false));
  };

  return (
    <div className="grid gap-2 mt-2">
    {/* <div className="grid grid-cols-4 gap-4 mt-4"> */}
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
