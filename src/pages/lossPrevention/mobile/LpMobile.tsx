import { useAppSelector, useAppDispatch } from "../../../hooks";

import DatePickers from "../../../components/datePickers/DatePickers";
import StorePicker from "../../../components/storePicker/StorePicker";
import SaleTypesMobile from "./SaleTypesMobile";
import CashierSalesMobile from "./CashierSalesMobile";
import TransactionsGrid from "../tablet/TransactionsGrid";
import { reQuery, setSaleTypes, setSelectedStoreId } from "../../../features/lossPreventionSlice";

interface LpMobileProps {
  getSaleTypes: () => void;
}

const LpMobile = ({ getSaleTypes }: LpMobileProps) => {
  const dispatch = useAppDispatch();
  const { saleTypes, cashierDetails } = useAppSelector(
    (state) => state.lossPrevention,
  );

  const handleGoBack = () => {
    dispatch(reQuery());
    dispatch(setSaleTypes([]));
    dispatch(setSelectedStoreId(0));
  };
  if (saleTypes.length > 0) {
    return (
      <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden overflow-y-auto no-scrollbar">
        {/* Inner nav => once sale types are fetched */}
        <div className="w-full px-2 pt-2">
          <button
            className="btn-themeBlue w-full px-0 py-1 text-[13px]"
            onClick={handleGoBack}
          >
            Go Back
          </button>
        </div>
        <div className="p-2 space-y-2">
          <SaleTypesMobile />
          {cashierDetails.length > 0 && <CashierSalesMobile />}
        </div>
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

export default LpMobile;
