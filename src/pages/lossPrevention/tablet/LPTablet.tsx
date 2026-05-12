import { useAppSelector } from "../../../hooks";
import DatePickers from "../../../components/datePickers/DatePickers";
import StorePicker from "../../../components/storePicker/StorePicker";
import CashierSalesTablet from "./CashierSalesTablet";
import SaleTypesTablet from "./SaleTypesTablet";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import UniqueCashiersTablet from "./UniqueCashiersTablet";

interface LPTabletProps {
  getSaleTypes: () => void;
}

const LPTablet = ({ getSaleTypes }: LPTabletProps) => {
  const lp = useAppSelector((state) => state.lossPrevention);

  const msg =
    lp.selectedSaleType === "Description"
      ? lp.searchString
      : lp.selectedSaleType;
  return (
    <div
      data-testid="lp-tablet"
      className="min-h-[calc(100vh-56px)] max-h-[calc(100vh-56px)] overflow-hidden overflow-y-auto no-scrollbar p-3 grid grid-cols-[25%_74%] gap-2"
    >
      <div>
        <div className="bg-custom-white p-2 rounded-lg shadow-lg space-y-1 md:space-y-0">
          <StorePicker />
          <DatePickers handleQuery={getSaleTypes} />
        </div>
        <SaleTypesTablet />
      </div>
      <div className="space-y-3">
        <div>
          {lp.cashierDetails.length > 0 ? <CashierSalesTablet /> : null}
          {lp.loadingCashierDetails && (
            <div className="relative h-40">
              <LoadingIndicator
                className="text-sm"
                message={`Loading data for ${msg}`}
              />
            </div>
          )}
        </div>
        <div>
          <UniqueCashiersTablet />
          {lp.fetchingCashierTransactions && (
            <div className="relative h-40">
              <LoadingIndicator
                className="text-sm"
                message={`Loading data for ${msg}`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LPTablet;
