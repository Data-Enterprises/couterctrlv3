import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  setCashierSaleIds,
  setSelectedCashier,
} from "../../../features/lossPreventionSlice";

import type { UniqueCashier } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";

const UniqueCashiersTablet = () => {
  const dispatch = useAppDispatch();
  const { cashiers, selectedCashier, fetchingCashierTransactions } =
    useAppSelector((state) => state.lossPrevention);

  const handleCashierClick = (e: UniqueCashier) => {
    const cashier_number = e.cashier_number;
    const store_number = e.store_number;

    if (
      cashier_number === selectedCashier.cashier_number &&
      store_number === selectedCashier.store_number
    ) {
      dispatch(setCashierSaleIds([]));
      dispatch(setSelectedCashier({ cashier_number: 0, store_number: "" }));
      return;
    }
    dispatch(setSelectedCashier({ cashier_number, store_number }));
  };

  return (
    <>
      {cashiers.length && !fetchingCashierTransactions ? (
        <div
          data-testid="unique-cashiers-table"
          className="bg-custom-white rounded-lg shadow-lg px-3 pb-3 leading-tight"
        >
          <div className="py-1 font-medium">
            Cashiers ({cashiers.length})
          </div>

          <div className="grid grid-cols-2 h-[1.5px] mb-2">
            <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
            <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {cashiers.map((c, i) => (
              <div
                key={i}
                className={`grid grid-cols-[60%_38%] gap-2 p-3 bg-bkg/75 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer ${
                  c.cashier_number === selectedCashier.cashier_number &&
                  c.store_number === selectedCashier.store_number
                    ? "ring-2 ring-blue-300 bg-blue-50/80 shadow-xl"
                    : ""
                }`}
                onClick={() => handleCashierClick(c)}
              >
                <div className="bg-custom-white rounded-lg p-2 shadow-sm">
                  <div className="text-xs md:text-sm text-content/60 mb-1">
                    Cashier
                  </div>
                  <div className="font-semibold text-sm text-nowrap truncate">
                    {c.cashier_name}
                  </div>
                </div>

                <div className="bg-custom-white rounded-lg p-2 shadow-sm">
                  <div className="text-xs md:text-sm text-content/60 mb-1">
                    Transactions
                  </div>
                  <div className="font-semibold text-sm">
                    {c.transaction_count}
                  </div>
                </div>

                <div className="bg-custom-white rounded-lg p-2 shadow-sm">
                  <div className="text-xs md:text-sm text-content/60 mb-1">
                    Sales
                  </div>
                  <div className="font-semibold text-sm">
                    {formatCurrency2(c.total_sales)}
                  </div>
                </div>

                <div className="bg-custom-white rounded-lg p-2 shadow-sm">
                  <div className="text-xs md:text-sm text-content/60 mb-1">
                    Store #
                  </div>
                  <div className="font-semibold text-sm">
                    {c.store_number}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default UniqueCashiersTablet;
