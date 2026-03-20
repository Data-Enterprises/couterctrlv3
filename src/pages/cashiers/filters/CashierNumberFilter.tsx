import { useCashierCtx } from "..";
import {
  setTotalQtyFilter,
  setTotalSalesFilter,
  setTotalTransactionsFilter,
} from "../../../features/cashiersSlice";

import CheckBox from "../../../components/inputs/CheckBox";
import Input from "../../../components/inputs/Input";

const CashierNumberFilter = () => {
  const ctx = useCashierCtx();

  const reduxValueToSet =
    ctx.cashierFilterType === "total_sales"
      ? ctx.totalSalesFilter
      : ctx.cashierFilterType === "total_qty"
        ? ctx.totalQtyFilter
        : ctx.totalTransactionsFilter;

  const dispatchToUse = () => {
    switch (ctx.cashierFilterType) {
      case "total_sales":
        return setTotalSalesFilter;
      case "total_qty":
        return setTotalQtyFilter;
      default:
        return setTotalTransactionsFilter;
    }
  };

  const handleOperandSelect = (id: number | boolean) => {
    if (id === 1) {
      // Greater than selected
      ctx.dispatch(dispatchToUse()({ ...reduxValueToSet, operator: ">" }));
    } else if (id === 2) {
      // Equal to selected
      ctx.dispatch(dispatchToUse()({ ...reduxValueToSet, operator: "=" }));
    } else {
      // id is 3 here => Less than selected
      ctx.dispatch(dispatchToUse()({ ...reduxValueToSet, operator: "<" }));
    }
  };

  const hasMaxOneDecimal = (x: string) => {
    // Splitting the input string by the decimal
    const xSplit = x.split(".").length;
    // if there is one or less decimals => then the split string's length should never exceed 2
    return xSplit <= 2;
  };

  const handleValueChange = (x: string) => {
    if (!isNaN(Number(x)) && hasMaxOneDecimal(x)) {
      ctx.dispatch(dispatchToUse()({ ...reduxValueToSet, value: Number(x) }));
    }
  };

  return (
    <div>
      <div className="flex justify-around items-center">
        <CheckBox
          label="Greater Than"
          id={1}
          value={false}
          onChange={handleOperandSelect}
          isBool={false}
        />
        <CheckBox
          label="Equal To"
          id={2}
          value={false}
          onChange={handleOperandSelect}
          isBool={false}
        />
        <CheckBox
          label="Less Than"
          id={3}
          value={false}
          onChange={handleOperandSelect}
          isBool={false}
        />
      </div>
      <Input
        label="Threshold"
        value={reduxValueToSet.value.toString()}
        setValue={handleValueChange}
      />
    </div>
  );
};

export default CashierNumberFilter;
