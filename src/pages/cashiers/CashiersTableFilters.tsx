import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  setCashierTableUpcFilter,
  setCashierTableDescFilter,
  setCashierTableThreshComp,
} from "../../features/cashierSlice";

const CashiersTableFilters = () => {
  const dispatch = useAppDispatch();
  const cashier = useAppSelector((state) => state.cashier);

  const handleRadioClick = (type: "gt" | "lt") => {
    if (type === "gt") {
      dispatch(
        setCashierTableThreshComp({
          gt: !cashier.cashierTableThreshComp.gt,
          lt: false,
        })
      );
    } else {
      dispatch(
        setCashierTableThreshComp({
          gt: false,
          lt: !cashier.cashierTableThreshComp.lt,
        })
      );
    }
  };

  const handleTextChange = (type: "upc" | "desc", value: string) => {
    if (type === "upc") {
      dispatch(setCashierTableUpcFilter(value));
    } else {
      dispatch(setCashierTableDescFilter(value));
    }
  };

  return (
    <div className="flex items-end gap-4 mb-2">
      <div>
        <button className="btn-themeGreen py-1">Show All</button>
      </div>
      <div>
        <label htmlFor="upc" className="text-xs font-medium">
          UPC
        </label>
        <input
          type="text"
          name="upc"
          className="basic-input py-1 bg-custom-white focus:border"
          value={cashier.cashierTableUpcFilter}
          onChange={(e) => handleTextChange("upc", e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="desc" className="text-xs font-medium">
          Description
        </label>
        <input
          type="text"
          name="desc"
          className="basic-input py-1 bg-custom-white focus:border"
          value={cashier.cashierTableDescFilter}
          onChange={(e) => handleTextChange("desc", e.target.value)}
        />
      </div>
      <div className="flex">
        <div className="translate-y-1/2 mb-1">
          <label className="text-xs font-medium mr-2 select-none">
            Greater than:
          </label>
          <input
            type="checkbox"
            className="focus:outline-none focus:ring-0 rounded-full cursor-pointer 
                      hover:bg-blue-200 transition-all duration-200"
            onClick={() => handleRadioClick("gt")}
            checked={cashier.cashierTableThreshComp.gt}
          />
          <label className="text-xs font-medium mr-2 ml-4 select-none">
            Less than:
          </label>
          <input
            type="checkbox"
            className="mr-4 focus:outline-none focus:ring-0 rounded-full cursor-pointer 
                      hover:bg-blue-200 transition-all duration-200"
            onClick={() => handleRadioClick("lt")}
            checked={cashier.cashierTableThreshComp.lt}
          />
        </div>
        <div>
          <label htmlFor="desc" className="text-xs font-medium">
            Sales Threshold
          </label>
          <input
            type="text"
            name="desc"
            className="basic-input py-1 bg-custom-white focus:border w-32"
            value={0}
            onChange={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default CashiersTableFilters;
