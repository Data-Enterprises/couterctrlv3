import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

import { getSaleTypes } from "../../api/lossPrevention";
import { formatGoliathDate } from "../../utils";
import {
  resetCashierSlice,
  setSaleTypes,
} from "../../features/lossPreventionSlice";
import type { JsonError } from "../../interfaces";

import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import TransactionModal from "./TransactionModal";
import CashiersTable from "./CashiersTable";
import UniqueCashiersTable from "./UniqueCashiersTable";
import CashierSales from "./cashierSales/CashierSales";
import SaleTypes from "./SaleTypes";
import CashiersTableFilters from "./filters/CashiersTableFilters";
import MobileTrendCards from "./cashierSales/MobileTrendCards";
import LPTablet from "./tablet/LPTablet";
import LpMobile from "./mobile/LpMobile";

const LossPreventionLegacy = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const cashier = useAppSelector((state) => state.lossPrevention);
  const [loading, setLoading] = useState<boolean>(false);

  const getSaleTypesData = () => {
    if (cashier.saleTypes.length > 0) {
      dispatch(resetCashierSlice());
    }
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
      singleStore,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const saleTypes = [...j.sale_types, { sale_type: "Description" }];
          dispatch(setSaleTypes(saleTypes));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching sale types: " + err.message),
      );
  };

  if (context.isMobile) {
    return <LpMobile getSaleTypes={getSaleTypesData} />;
  }

  if (context.isTablet) {
    return <LPTablet getSaleTypes={getSaleTypesData} />;
  }

  // Styles for mobile and desktop
  const pageContainer = context.isDesktop
    ? "w-full h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden overflow-y-auto no-scrollbar p-4 grid grid-cols-[20%_80%] gap-4"
    : "p-4 w-full min-h-full overflow-y-auto space-y-4 max-h-screen";
  const leftContainer = context.isDesktop
    ? cashier.saleTypes.length
      ? `flex flex-col gap-2`
      : ""
    : "";
  const cols = context.isDesktop ? "grid-cols-2" : "grid-cols-1 mt-4";
  const cardContainer = context.isDesktop ? `flex flex-col mr-4 gap-2` : "";

  const msg = cashier.selectedSaleType === "Description" ? cashier.searchString : cashier.selectedSaleType;

  return (
    <div data-testid="cashiers-page" className={pageContainer}>
      <TransactionModal />
      <div className={leftContainer}>
        <div className="bg-custom-white px-2 py-2.5 rounded-lg shadow-lg space-y-1 md:space-y-0">
          <StorePicker />
          <DatePickers handleQuery={getSaleTypesData} />
        </div>
        <div className={`grid ${cols} gap-2`}>
          <SaleTypes setLoading={setLoading} />
          {context.isDesktop && <CashiersTableFilters />}
        </div>
        {context.isDesktop && <UniqueCashiersTable />}
      </div>

      <div className={cardContainer}>
        {cashier.noTransMsg && (
          <div className="w-full h-full flex items-center justify-center bg-custom-white rounded-lg shadow-lg">
            <p data-testid="no-transactions-msg" className="font-medium">
              No transactions Found
            </p>
          </div>
        )}
        {cashier.cashierDetails.length > 0 ? (
          <div className="w-full ">
            {context.isDesktop ? <CashierSales /> : <MobileTrendCards />}
          </div>
        ) : (
          <div className="h-[260px] w-full">
            {loading && cashier.selectedSaleType ? (
              <div className="w-full h-64 relative">
                <LoadingIndicator
                  className="text-sm"
                  message={`Loading data for ${msg}`}
                />
              </div>
            ) : null}
          </div>
        )}
        {cashier.transList.length > 0 ? (
          <CashiersTable />
        ) : (
          <div className="relative h-[60vh]">
            {cashier.fetchingCashierTransactions && (
              <LoadingIndicator
                className="text-sm"
                message={cashier.transactionLoadingMessage}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LossPreventionLegacy;
