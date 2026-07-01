import { useCashierCtx } from "..";
import {
  setStoreNameFilter,
  setCashierNameFilter,
} from "../../../../features/cashiersLegacySlice";
import Input from "../../../../components/inputs/Input";

const CashierTextFilter = () => {
  const ctx = useCashierCtx();

  const handleTextChange = (x: string) => {
    if (ctx.cashierFilterType === "cashier_name") {
      ctx.dispatch(setCashierNameFilter(x));
    } else if (ctx.cashierFilterType === "store_name") {
      ctx.dispatch(setStoreNameFilter(x));
    }
  };

  const filterText = () => {
    switch (ctx.cashierFilterType) {
      case "cashier_name":
        return ctx.cashierNameFilter;
      case "store_name":
        return ctx.storeNameFilter;
      default:
        return "";
    }
  };

  const filterLabel = () => {
    switch (ctx.cashierFilterType) {
      case "cashier_name":
        return "Cashier Name";
      case "store_name":
        return "Store Name";
      default:
        return "";
    }
  };

  return (
    <div>
      <Input
        label={filterLabel()}
        value={filterText()}
        setValue={handleTextChange}
      />
    </div>
  );
};

export default CashierTextFilter;
