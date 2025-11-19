import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

import { getCashierDetails, getSaleTypes } from "../../api/cashiers";
import { formatGoliathDate, handleRipple } from "../../utils";
import {
  setSaleTypes,
  setCashierDetails,
  setCashierTrends,
  setCashierTransactions,
  setSelectedSaleTypes,
  setSelectedSaleType,
  setChunkedSales,
  setChunkedTrends,
} from "../../features/cashierSlice";
import type { JsonError } from "../../interfaces";

import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import TransactionModal from "./TransactionModal";
import CashiersTable from "./CashiersTable";
import UniqueCashiersTable from "./UniqueCashiersTable";
import TrendCardCarousel from "./TrendCardCarousel";

const Cashiers = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const cashier = useAppSelector((state) => state.cashier);
  const [loading, setLoading] = useState<boolean>(false);

  const getSaleTypesData = () => {
    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue =
      search.type === "Group" ? search.lastGroup : search.lastStore;
    getSaleTypes(
      context.url,
      context.token,
      formatGoliathDate(search.startDate),
      formatGoliathDate(search.endDate),
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
  };

  const handlePanelClick = (e: React.MouseEvent<HTMLDivElement>) => {
    dispatch(setSelectedSaleTypes(e.currentTarget.innerText));
    dispatch(setSelectedSaleType(e.currentTarget.innerText));
    handleRipple(e);

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

  const chunkData = (arr: any[], chunkSize: number = 3) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      chunks.push(arr.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const activePanelStyle = (type: string) => {
    if (cashier.selectedSaleType === type) {
      return "bg-blue-200 text-content shadow-inner";
    } else {
      return "bg-custom-white";
    }
  };

  return (
    <div
      data-testid="cashiers-page"
      className="w-full h-[calc(100vh-3rem)] p-4 flex gap-4"
    >
      <TransactionModal />
      <div className="w-[23%]">
        <div className="bg-custom-white px-4 py-2.5 rounded-lg shadow-lg">
          <StorePicker />
          <DatePickers handleQuery={getSaleTypesData} />
        </div>
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
              <span className="">{st.sale_type}</span>
            </div>
          ))}
        </div>

        <UniqueCashiersTable />
      </div>

      <div className="w-[77%]">
        {cashier.chunkedSales.length > 0 ? (
          <div className="w-full ">
            <TrendCardCarousel />
          </div>
        ) : (
          <div className="h-[260px] w-full"></div>
        )}

        {loading ? (
          <div className="w-full h-64 relative">
            <LoadingIndicator
              className="text-sm"
              message={`Loading data for ${cashier.selectedSaleType}`}
            />
          </div>
        ) : null}

        <CashiersTable />
      </div>
    </div>
  );
};

export default Cashiers;
