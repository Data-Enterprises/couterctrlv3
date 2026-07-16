import { useAppDispatch } from "../../../hooks";
import { useLPState } from "../hooks/useLPState";
import { useLPActions } from "../hooks/useLPActions";
import { formatCurrency2 } from "../../../utils";
import FiltersModal from "./FiltersModal";

const filterOptions = [
  "Sale Date",
  "Total Sales",
  "Total Qty",
  "Transaction ID",
  "Refresh",
];

const CashiersTableFilters = () => {
  const dispatch = useAppDispatch();
  const cashier = useLPState();
  const actions = useLPActions();

  const panelStyle =
    "py-1.5 rounded-lg text-center shadow-md shadow-content/20 hover:bg-orange-200 cursor-pointer transition-all duration-200";

  const activePanelStyle = (option: string) => {
    // Grabbing the filters
    const saleDate = cashier.saleDateFilter;
    const transId = cashier.transIdFilter;

    // Declaring the active style and applying it to the matching conditions
    const style = "bg-orange-500 text-custom-white font-semibold shadow-inner";
    let result = false;
    if (option === "Sale Date" && saleDate) result = true;
    if (option === "Total Sales" && cashier.salesThreshold) result = true;
    if (option === "Total Qty" && cashier.qtyThreshold) result = true;
    if (option === "Transaction ID" && transId) result = true;
    return result ? style : "";
  };

  const renderFilterText = (type: string) => {
    if (type === "Sale Date") {
      return cashier.saleDateFilter ? `${cashier.saleDateFilter}` : "Sale Date";
    } else if (type === "Total Sales") {
      const s = cashier.salesThreshold;
      return s
        ? `${s.op === "gt" ? "Over" : s.op === "lt" ? "Under" : "="} ${formatCurrency2(s.amount)}`
        : "Total Sales";
    } else if (type === "Total Qty") {
      const q = cashier.qtyThreshold;
      return q
        ? `${q.op === "gt" ? "Over" : q.op === "lt" ? "Under" : "="} ${q.amount}`
        : "Total Qty";
    } else if (type === "Transaction ID") {
      return cashier.transIdFilter
        ? `${cashier.transIdFilter}`
        : "Transaction ID";
    } else {
      return type;
    }
  };

  const setFilterModal = (type: string) => {
    if (type === "Refresh") {
      dispatch(actions.setSalesThreshold(null));
      dispatch(actions.setQtyThreshold(null));
      dispatch(actions.setTransIdFilter(""));
      dispatch(actions.setSaleDateFilter(""));
      dispatch(actions.setFilterType(""));
      dispatch(actions.setUpcFilter(""));
      dispatch(actions.setDescFilter(""));
      dispatch(actions.setSelectedPriceTypes([]));
      dispatch(actions.setTransIdFilter(""));
      return;
    }

    dispatch(actions.setFilterModalOpen(true));
    dispatch(actions.setFilterType(type));
  };

  return (
    <div
      className={`bg-custom-white rounded-lg shadow-lg ${
        !cashier.transList.length && "hidden"
      }`}
    >
      <FiltersModal />
      <div className="rounded-t-lg text-center py-0.5 text-sm bg-blue-500 text-custom-white font-medium">
        Filter By
      </div>
      <div className="grid text-sm p-2 gap-2">
        {filterOptions.map((option, i) => (
          <div
            key={i}
            data-testid={`cashier-table-filter-${option
              .split(" ")
              .join("-")
              .toLowerCase()}`}
            className={`${panelStyle} ${activePanelStyle(option)}`}
            onClick={() => setFilterModal(option)}
          >
            {renderFilterText(option)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CashiersTableFilters;
