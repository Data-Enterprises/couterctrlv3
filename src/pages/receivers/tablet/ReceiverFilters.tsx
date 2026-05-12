import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  resetFilters,
  setFilterModalOpen,
  setFilterType,
  setReceiverDetails,
  setSelectedInvoice,
  type FilterType,
} from "../../../features/receiversSlice";

const filterOptions: (FilterType | "Refresh")[] = [
  "VendorID",
  "VendorName",
  "TransactionID",
  "InvoiceID",
  "Refresh",
];

const ReceiverFilters = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.receivers);

  const renderFilterText = (type: FilterType) => {
    if (type === "InvoiceID") {
      return state.invoiceIdFilter ? `${state.invoiceIdFilter}` : "Invoice #";
    } else if (type === "VendorID") {
      return state.vendorIdFilter ? `${state.vendorIdFilter}` : "Vendor ID";
    } else if (type === "VendorName") {
      return state.vendorNameFilter
        ? `${state.vendorNameFilter}`
        : "Vendor Name";
    } else if (type === "TransactionID") {
      return state.transIDFilter ? `${state.transIDFilter}` : "Transaction ID";
    } else {
      return type;
    }
  };

  const setFilterModal = (option: FilterType | "Refresh") => {
    if (option === "Refresh") {
      dispatch(resetFilters());
      dispatch(setReceiverDetails([]));
      dispatch(setSelectedInvoice(""));
    } else {
      dispatch(setFilterModalOpen(true));
      dispatch(setFilterType(option));
    }
  };

  const activePanelStyle = (option: string) => {
    const vendorId = state.vendorIdFilter;
    const vendorName = state.vendorNameFilter;
    const invoiceId = state.invoiceIdFilter;

    // Declaring the active style and applying it to the matching conditions
    const style = "bg-orange-500 text-white font-semibold shadow-inner";
    let result = false;
    if (option === "VendorID" && vendorId) result = true;
    if (option === "VendorName" && vendorName) result = true;
    if (option === "InvoiceID" && invoiceId) result = true;
    if (option === "TransactionID" && state.transIDFilter) result = true;
    return result ? style : "";
  };

  const panelStyle =
    "py-1.5 rounded-lg text-center shadow-md shadow-content/20 hover:bg-orange-200 cursor-pointer transition-all duration-200";

  return (
    <div>
      <div
        className={`${
          state.list.length === 0 && "hidden"
        } bg-custom-white rounded-lg shadow-lg`}
      >
        <div className=" text-center font-medium px-2 py-0.5">Filter By</div>
        <div className="h-[1.5px] grid grid-cols-2">
          <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
          <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
        </div>
        <div className="bg-custom-white p-2 rounded-b-lg space-y-2">
          {filterOptions.map((option, i) => (
            <div
              key={i}
              data-testid={`rec-list-table-filter-${option
                .split(" ")[0]
                .toLowerCase()}`}
              className={`${panelStyle} ${activePanelStyle(option)}`}
              onClick={() => setFilterModal(option)}
            >
              {renderFilterText(option as FilterType)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReceiverFilters;
