import { useAppDispatch, useAppSelector } from "../../hooks";
import { setFilter, applyFilters, resetFilters } from "../../features/couponSlice";
import Input from "../../components/inputs/Input";
const CouponGridFilters = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.coupons);

    const setStoreFilter = (value: string) => {
      dispatch(setFilter({ type: "Store", value }));
    };

    const setCpnAmtFilter = (value: string) => {
      if (!isNaN(Number(value))) {
        dispatch(setFilter({ type: "CpnAmount", value: Number(value) }));
      }
    };

    const setUpcFilter = (value: string) => {
      dispatch(setFilter({ type: "UPC", value }));
    };

    const setDescFilter = (value: string) => {
      dispatch(setFilter({ type: "Desc", value }));
    };

    const setCustomerIdFilter = (value: string) => {
      dispatch(setFilter({ type: "CustomerID", value }));
    };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg mt-4">
      <div className="bg-blue-500 text-custom-white font-medium rounded-t-lg px-4 py-1">
        Filter By
      </div>
      <div className="px-4 py-2">
        <Input label="Store" value={state.storeNum} setValue={setStoreFilter} />
        <Input
          label="Cpn Amount"
          value={state.cpnAmount ? state.cpnAmount.toString() : ""}
          setValue={setCpnAmtFilter}
        />
        <Input
          label="Product Code"
          value={state.productCode}
          setValue={setUpcFilter}
        />
        <Input
          label="Product Description"
          value={state.productDescription}
          setValue={setDescFilter}
        />
        <Input
          label="Customer ID"
          value={state.customerId}
          setValue={setCustomerIdFilter}
        />
        <div className="flex gap-2 w-full mt-2">
          <button
            className="btn-themeBlue w-1/2"
            onClick={() => dispatch(applyFilters())}
          >
            Filter
          </button>
          <button
            className="btn-themeOrange w-1/2"
            onClick={() => dispatch(resetFilters())}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouponGridFilters;