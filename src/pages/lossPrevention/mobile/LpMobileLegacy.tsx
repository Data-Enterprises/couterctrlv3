import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  reQuery,
  setCashierDetails,
  setSaleTypes,
  setSelectedSaleType,
  setSelectedStoreId,
  setViewTransactionsMobile,
} from "../../../features/lossPreventionLegacySlice";

import DatePickers from "../../../components/datePickers/DatePickers";
import StorePicker from "../../../components/storePicker/StorePicker";
import SaleTypesMobile from "./SaleTypesMobile";
import CashierSalesMobile from "./CashierSalesMobile";

import TransactionModalLegacy from "../TransactionModalLegacy";
import UniqueCashiersMobile from "./UniqueCashiersMobile";
import TransactionsMobile from "./TransactionsMobile";

interface LpMobileProps {
  getSaleTypes: () => void;
}

const LpMobileLegacy = ({ getSaleTypes }: LpMobileProps) => {
  const dispatch = useAppDispatch();
  const { saleTypes, cashierDetails, viewTransactionsMobile } = useAppSelector(
    (state) => state.lossPreventionLegacy,
  );

  const handleGoBack = () => {
    if (viewTransactionsMobile) {
      dispatch(setViewTransactionsMobile(false));
      return;
    }
    dispatch(reQuery());
    dispatch(setSaleTypes([]));
    dispatch(setSelectedSaleType(""));
    dispatch(setCashierDetails([]));
    dispatch(setSelectedStoreId(0));
  };
  if (saleTypes.length > 0) {
    return (
      <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden overflow-y-auto no-scrollbar">
        <TransactionModalLegacy />
        {/* Inner nav => once sale types are fetched */}
        <div className="w-full px-2 pt-2">
          <button
            className="btn-themeBlue w-full px-0 py-1 text-[13px]"
            onClick={handleGoBack}
          >
            Go Back
          </button>
        </div>
        {viewTransactionsMobile ? (
          <div>
            <UniqueCashiersMobile />
            <TransactionsMobile onBack={() => {}} onOpenSearch={() => {}} />
          </div>
        ) : (
          <div className="p-2 space-y-2">
            <SaleTypesMobile />
            {cashierDetails.length > 0 && <CashierSalesMobile />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden overflow-y-auto no-scrollbar p-2">
      <div className="space-y-2">
        <div className="bg-custom-white px-2 py-2.5 rounded-lg shadow-lg space-y-1">
          <StorePicker />
          <DatePickers handleQuery={getSaleTypes} />
        </div>
      </div>
    </div>
  );
};

export default LpMobileLegacy;
