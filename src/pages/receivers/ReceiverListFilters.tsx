import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  setVendorIdFilter,
  setVendorNameFilter,
  setInvoiceIdFilter,
  clearFilters,
} from "../../features/receiversSlice";
import Input from "../../components/inputs/Input";

const RecevierListFilters = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.receivers);

  const handleVendorIdFilter = (value: string) => {
    if (!isNaN(Number(value))) {
      dispatch(setVendorIdFilter(value));
    }
  };

  const handleVendorNameFilter = (value: string) => {
    dispatch(setVendorNameFilter(value));
  };

  const handleInvoiceIdFilter = (value: string) => {
    if (!isNaN(Number(value))) {
      dispatch(setInvoiceIdFilter(value));
    }
  };

  const resetFilters = () => {
    dispatch(clearFilters());
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg">
      <div className="bg-blue-500 text-custom-white font-medium rounded-t-lg px-4 py-1">
        Filter By
      </div>
      <div className="bg-custom-white p-4 rounded-b-lg">
        <Input
          label="Vendor Id"
          setValue={handleVendorIdFilter}
          value={String(state.vendorIdFilter)}
        />
        <Input
          label="Vendor Name"
          setValue={handleVendorNameFilter}
          value={state.vendorNameFilter}
        />
        <Input
          label="Invoice #"
          setValue={handleInvoiceIdFilter}
          value={String(state.invoiceIdFilter)}
        />
        <div className="flex gap-2 mt-2">
          <button className="btn-themeBlue w-1/2">Filter</button>
          <button className="btn-themeOrange w-1/2" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecevierListFilters;
