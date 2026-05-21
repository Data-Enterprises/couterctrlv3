import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  setCashierSaleIds,
  setSelectedCashier,
} from "../../../features/lossPreventionSlice";

import type { UniqueCashier } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";

const UniqueCashiersMobile = () => {
  const dispatch = useAppDispatch();
  const { cashiers, selectedCashier, fetchingCashierTransactions, selectedStoreId } =
    useAppSelector((state) => state.lossPrevention);
  const assignedStores = useAppSelector((state) => state.user.assignedStores);

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

  const storeName= assignedStores.find((s) => s.storeid === selectedStoreId)?.store_name || "";

  return (
    <div className="p-2">
      {cashiers.length && !fetchingCashierTransactions ? (
        <div
          data-testid="unique-cashiers-table"
          className="bg-custom-white rounded-lg shadow-lg px-2 pb-2 leading-tight"
        >
          <div className="py-1 font-medium text-[11px] flex justify-between items-center">
            <div>Cashiers ({cashiers.length})</div>
            <div>{storeName}</div>
          </div>

          <div className="grid grid-cols-2 h-[1.5px] mb-2">
            <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
            <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
          </div>

          <div className="overflow-y-auto max-h-[150px]">
            <div className="min-w-full divide-y divide-content/20">
              {/* Header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr] bg-bkg sticky top-0 z-10 py-1 px-3 font-medium rounded-lg shadow-sm text-[11px]">
                <div className="">
                  Cashier
                </div>
                <div className="text-right ">
                  Transactions
                </div>
                <div className="text-right ">
                  Sales
                </div>
                <div className="text-right ">Store #</div>
              </div>

              {/* Rows */}
              {cashiers.map((c, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[2fr_1fr_1fr_1fr] text-[10px] py-1 px-3 hover:bg-blue-50/50 transition-colors duration-200 cursor-pointer border-b border-content/10 last:border-b-0 ${
                    c.cashier_number === selectedCashier.cashier_number &&
                    c.store_number === selectedCashier.store_number
                      ? "bg-blue-50/80 ring-2 ring-blue-300 ring-inset shadow-md"
                      : ""
                  }`}
                  onClick={() => handleCashierClick(c)}
                >
                  <div className="font-semibold truncate">
                    {c.cashier_name}
                  </div>
                  <div className="font-semibold text-right">
                    {c.transaction_count}
                  </div>
                  <div className="font-semibold text-right">
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
    </div>
  );
};

export default UniqueCashiersMobile;
