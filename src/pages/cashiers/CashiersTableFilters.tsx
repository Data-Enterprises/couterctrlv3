import { useAppSelector, useAppDispatch } from "../../hooks";

const CashiersTableFilters = () => {
  const dispatch = useAppDispatch();
  const cashier = useAppSelector((state) => state.cashier);

  const panelStyle = "py-2 rounded-lg text-center shadow-md shadow-content/20 hover:bg-orange-200 cursor-pointer transition-all duration-200"

  return (
    <div
      className={`bg-custom-white rounded-lg shadow-lg ${
        !cashier.saleTypes.length && "hidden"
      }`}
    >
      <div className="rounded-t-lg text-center py-0.5 bg-blue-500 text-custom-white font-medium">
        Filter By
      </div>
      <div className="grid grid-row-6 p-2 gap-2">
        <div className={panelStyle}>Sale Date</div>
        <div className={panelStyle}>UPC</div>
        <div className={panelStyle}>Description</div>
        <div className={panelStyle}>Total Sales</div>
        <div className={panelStyle}>Price Type</div>
        <div className={panelStyle}>Refresh</div>
      </div>
    </div>
  );
};

export default CashiersTableFilters;
