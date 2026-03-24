import { useCashierCtx } from "..";
import {
  setTotalQtyFilter,
  setTotalSalesFilter,
} from "../../../features/cashiersSlice";

import CheckBox from "../../../components/inputs/CheckBox";
import Input from "../../../components/inputs/Input";

const CashierNumberFilter = () => {
  const ctx = useCashierCtx();

  const reduxValueToSet =
    ctx.cashierFilterType === "total_sales"
      ? ctx.totalSalesFilter
      : ctx.totalQtyFilter;

  const dispatchToUse = () => {
    switch (ctx.cashierFilterType) {
      case "total_sales":
        return setTotalSalesFilter;
      default:
        return setTotalQtyFilter;
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

  const handleValue = (id: number) => {
    if (id === 1 && reduxValueToSet.operator === ">") {
      return true;
    } else if (id === 2 && reduxValueToSet.operator === "=") {
      return true;
    } else if (id === 3 && reduxValueToSet.operator === "<") {
      return true;
    }

    return false;
  };

  return (
    <div>
      <div className="flex justify-around items-center">
        <CheckBox
          label="Greater Than"
          id={1}
          value={handleValue(1)}
          onChange={handleOperandSelect}
          isBool={false}
        />
        <CheckBox
          label="Equal To"
          id={2}
          value={handleValue(2)}
          onChange={handleOperandSelect}
          isBool={false}
        />
        <CheckBox
          label="Less Than"
          id={3}
          value={handleValue(3)}
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
