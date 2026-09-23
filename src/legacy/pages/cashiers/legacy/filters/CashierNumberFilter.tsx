import { useCashierCtx } from "..";
import {
  setExceptionQtyTypes,
  setExceptionSalesTypes,
  setTotalQtyFilter,
  setTotalSalesFilter,
} from "../../../../features/cashiersLegacySlice";
import type { ExceptionType } from "../../../../interfaces";

import CheckBox from "../../../../components/inputs/CheckBox";
import Input from "../../../../components/inputs/Input";

const exceptions: ExceptionType[] = [
  "Adjustment",
  "Backup",
  "Cancelled",
  "Hand Key",
  "Modified",
  "No Sale",
  "Refunded",
  "Voided",
];

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

  const handleExceptionSelect = (exc: ExceptionType) => {
    if (ctx.cashierFilterType === "total_sales") {
      // looking at sales
      const types = ctx.exceptionSalesTypes.includes(exc)
        ? ctx.exceptionSalesTypes.filter((e) => e !== exc)
        : [...ctx.exceptionSalesTypes, exc];
      ctx.dispatch(setExceptionSalesTypes(types));
    } else {
      // looking at qty
      const types = ctx.exceptionQtyTypes.includes(exc)
        ? ctx.exceptionQtyTypes.filter((e) => e !== exc)
        : [...ctx.exceptionQtyTypes, exc];
      ctx.dispatch(setExceptionQtyTypes(types));
    }
  };

  const selectedStyle = (exc: ExceptionType) => {
    if (ctx.cashierFilterType === "total_sales") {
      // looking at sales
      return ctx.exceptionSalesTypes.includes(exc) ? "bg-orange-200" : "bg-bkg"
    } else {
      //  looking at qty
      return ctx.exceptionQtyTypes.includes(exc) ? "bg-orange-200" : "bg-bkg"
    }
  };

  return (
    <div className="text-[13px]">
      <div className="grid grid-cols-3 gap-2 mb-4">
        {exceptions.map((exc) => (
          <div
            key={exc}
            className={`rounded-full border text-center py-0.5 hover:bg-orange-200 cursor-pointer transition-all duration-200 ${selectedStyle(exc)}`}
            onClick={() => handleExceptionSelect(exc)}
          >
            {exc}
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mb-2">
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
