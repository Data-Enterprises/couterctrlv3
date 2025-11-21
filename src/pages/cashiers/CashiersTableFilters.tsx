import { setFilterModalOpen, setFilterType } from "../../features/cashierSlice";
import { useAppSelector, useAppDispatch } from "../../hooks";
import FiltersModal from "./FiltersModal";

const filterOptions = [
  "Sale Date",
  "UPC",
  "Description",
  "Total Sales",
  "Price Type",
  "Refresh",
];
const CashiersTableFilters = () => {
  const dispatch = useAppDispatch();
  const cashier = useAppSelector((state) => state.cashier);

  const panelStyle =
    "py-1.5 rounded-lg text-center shadow-md shadow-content/20 hover:bg-orange-200 cursor-pointer transition-all duration-200";

  const setFilterModal = (type: string) => {
    if (type === "Refresh") return;
    dispatch(setFilterModalOpen(true));
    dispatch(setFilterType(type));
  };

  return (
    <div
      className={`bg-custom-white rounded-lg shadow-lg ${
        !cashier.saleTypes.length && "hidden"
      }`}
    >
      <FiltersModal />
      <div className="rounded-t-lg text-center py-0.5 bg-blue-500 text-custom-white font-medium">
        Filter By
      </div>
      <div className="grid grid-row-6 p-2 gap-2">
        {filterOptions.map((option, i) => (
          <div
            key={i}
            className={panelStyle}
            onClick={() => setFilterModal(option)}
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CashiersTableFilters;
