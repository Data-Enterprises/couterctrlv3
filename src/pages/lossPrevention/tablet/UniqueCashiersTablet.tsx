import { useAppDispatch } from "../../../hooks";
import { useLPState } from "../hooks/useLPState";
import { useLPActions } from "../hooks/useLPActions";

import type { UniqueCashier } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";

const UniqueCashiersTablet = () => {
  const dispatch = useAppDispatch();
  const { cashiers, selectedCashier, fetchingCashierTransactions } = useLPState();
  const actions = useLPActions();

  const handleCashierClick = (e: UniqueCashier) => {
    const cashier_number = e.cashier_number;
    const store_number = e.store_number;

    if (
      cashier_number === selectedCashier.cashier_number &&
      store_number === selectedCashier.store_number
    ) {
      dispatch(actions.setCashierSaleIds([]));
      dispatch(actions.setSelectedCashier({ cashier_number: 0, store_number: "" }));
      return;
    }
    dispatch(actions.setSelectedCashier({ cashier_number, store_number }));
  };

  return (
    <>
      {cashiers.length && !fetchingCashierTransactions ? (
        <div
          data-testid="unique-cashiers-table"
          className="bg-custom-white rounded-lg shadow-lg px-3 pb-3 leading-tight"
        >
          <div className="py-1 font-medium">Cashiers ({cashiers.length})</div>

          <div className="grid grid-cols-2 h-[1.5px] mb-2">
            <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
            <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
          </div>

          <div className="overflow-y-auto max-h-[250px]">
            <div className="min-w-full divide-y divide-content/20">
              {/* Header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr] bg-bkg sticky top-0 z-10 py-3 px-4 font-medium rounded-lg shadow-sm">
                <div className="text-sm">
                  Cashier
                </div>
                <div className="text-right text-sm">
                  Transactions
                </div>
                <div className="text-right text-sm">
                  Sales
                </div>
                <div className="text-right text-sm">Store #</div>
              </div>

              {/* Rows */}
              {cashiers.map((c, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[2fr_1fr_1fr_1fr] py-3 px-4 hover:bg-blue-50/50 transition-colors duration-200 cursor-pointer border-b border-content/10 last:border-b-0 ${
                    c.cashier_number === selectedCashier.cashier_number &&
                    c.store_number === selectedCashier.store_number
                      ? "bg-blue-50/80 ring-2 ring-blue-300 ring-inset shadow-md"
                      : ""
                  }`}
                  onClick={() => handleCashierClick(c)}
                >
                  <div className="font-semibold text-sm truncate">
                    {c.cashier_name}
                  </div>
                  <div className="text-sm font-semibold text-right">
                    {c.transaction_count}
                  </div>
                  <div className="text-sm font-semibold text-right">
                    {formatCurrency2(c.total_sales)}
                  </div>
                  <div className="font-semibold text-right">
                    {c.store_number}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default UniqueCashiersTablet;
