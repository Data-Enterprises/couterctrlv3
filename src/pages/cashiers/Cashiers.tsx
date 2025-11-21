import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

import { getSaleTypes } from "../../api/cashiers";
import { formatGoliathDate } from "../../utils";
import { setSaleTypes } from "../../features/cashierSlice";
import type { JsonError } from "../../interfaces";

import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import TransactionModal from "./TransactionModal";
import CashiersTable from "./CashiersTable";
import UniqueCashiersTable from "./UniqueCashiersTable";
import TrendCardCarousel from "./TrendCardCarousel";
import SaleTypes from "./SaleTypes";
import CashiersTableFilters from "./CashiersTableFilters";

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

  return (
    <div
      data-testid="cashiers-page"
      className="w-full h-[calc(100vh-3rem)] p-4 grid grid-cols-[27%_73%] gap-4"
    >
      <TransactionModal />
      <div className="grid grid-rows-[25%_0.9fr_1fr] gap-2">
        <div className="bg-custom-white px-4 py-2.5 rounded-lg shadow-lg">
          <StorePicker />
          <DatePickers handleQuery={getSaleTypesData} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SaleTypes setLoading={setLoading} />
          <CashiersTableFilters />
        </div>
        <UniqueCashiersTable />
      </div>

      <div className="grid grid-rows-[25%_74.1%] mr-4 gap-2">
        {cashier.chunkedSales.length > 0 ? (
          <div className="w-full ">
            <TrendCardCarousel />
          </div>
        ) : (
          <div className="h-[260px] w-full">
            {loading ? (
              <div className="w-full h-64 relative">
                <LoadingIndicator
                  className="text-sm"
                  message={`Loading data for ${cashier.selectedSaleType}`}
                />
              </div>
            ) : null}
          </div>
        )}
        <CashiersTable />
      </div>
    </div>
  );
};

export default Cashiers;
