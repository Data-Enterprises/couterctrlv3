import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getCashierDetails } from "../../../api/lossPrevention";
import {
  setSelectedSaleType,
  setCashierDetails,
  setCashierTrends,
  resetCashierSlice,
  setSaleTypes,
  toggleNoTransMsg,
  reQuery,
  setSearchString,
  setLoadingCashierDetails,
  setSelectedStoreId,
} from "../../../features/lossPreventionSlice";
import type { JsonError } from "../../../interfaces";
import { activePanelStyle } from "..";
import { useApiContext } from "../../hooks";
import DescModal from "../components/DescModal";

const SaleTypesTablet = () => {
  const toast = useToast();
  const params = useApiContext();
  const dispatch = useAppDispatch();
  const cashier = useAppSelector((state) => state.lossPrevention);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const submitDescription = (description: string) => {
    // Doing this to reset when looking for a different sale type
    const panels = cashier.saleTypes;
    dispatch(resetCashierSlice());
    dispatch(setSaleTypes(panels));
    dispatch(setSearchString(description));

    // Setting this to handle selected css styling and show the loading indicator
    dispatch(setSelectedSaleType("Description"));
    dispatch(setLoadingCashierDetails(true));
    setIsOpen(false);
    getCashierDetails(
      params.url,
      params.token,
      params.start,
      params.end,
      params.useGroups,
      params.searchValue,
      params.singleStore,
      ["description"],
      description,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0 && j.sales.length > 0) {
          dispatch(toggleNoTransMsg(false));
          // The chunked sales and trends are being set in the dispatches
          dispatch(setCashierDetails(j.sales));
          dispatch(setCashierTrends(j.trend));
        } else {
          dispatch(toggleNoTransMsg(true));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching cashier details: " + err.message),
      )
      .finally(() => dispatch(setLoadingCashierDetails(false)));
  };

  const handlePanelClick = (saleType: string) => {
    if (saleType === "Description") {
      setIsOpen(true);
      return;
    }
    // Doing this to reset when looking for a different sale type
    const panels = cashier.saleTypes;
    const selectedSaleType = cashier.selectedSaleType;
    dispatch(setSelectedStoreId(0));
    dispatch(setCashierTrends([]));
    dispatch(setCashierDetails([]));
    dispatch(reQuery());
    dispatch(setSaleTypes(panels));
    dispatch(setSelectedSaleType(selectedSaleType));

    // Setting this to handle selected css styling and show the loading indicator
    dispatch(setSelectedSaleType(saleType));
    dispatch(setLoadingCashierDetails(true));

    // Using useApiContext hook to get the params
    getCashierDetails(
      params.url,
      params.token,
      params.start,
      params.end,
      params.useGroups,
      params.searchValue,
      params.singleStore,
      [saleType],
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          // Checking to see if we need to display No Transactions Found
          if (j.sales.length === 0) {
            dispatch(toggleNoTransMsg(true));
          } else {
            dispatch(toggleNoTransMsg(false));
          }

          // The chunked sales and trends are being set in the dispatches
          dispatch(setCashierDetails(j.sales));
          dispatch(setCashierTrends(j.trend));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching cashier details: " + err.message),
      )
      .finally(() => dispatch(setLoadingCashierDetails(false)));
  };

  return (
    <div
      className={`bg-custom-white rounded-lg shadow-lg mt-3 ${
        !cashier.saleTypes.length && "hidden"
      }`}
    >
      <DescModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        handleSubmit={submitDescription}
      />
      <div className="rounded-t-lg text-center py-0.5 font-medium">
        Select Exception
      </div>
      <div className="grid grid-cols-2 h-[1.5px]">
        <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
        <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
      </div>
      <div className="grid text-sm gap-2 p-2">
        {cashier.saleTypes.map((st, i) => (
          <div
            key={i}
            data-testid={`sale-type-panel-${st.sale_type}`}
            className={`${activePanelStyle(
              st.sale_type,
              cashier.selectedSaleType,
            )} py-1.5 rounded-lg text-center shadow-md shadow-content/20 hover:bg-emerald-200
                cursor-pointer transition-all duration-200 ripple-button`}
            onClick={() => handlePanelClick(st.sale_type)}
          >
            <span>{st.sale_type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SaleTypesTablet;
