import { useCashierCtx } from "..";
import Modal from "../../../components/Modal";
import { defaultNumberFilter } from "../../../features/cashiersSlice";
import { useCashiersActions } from "../hooks/useCashiersActions";
import Input from "../../../components/inputs/Input";
import CheckBox from "../../../components/inputs/CheckBox";
import { useState } from "react";

const TransFilterModal = () => {
  const ctx = useCashierCtx();
  const actions = useCashiersActions();
  const [date, setDate] = useState<string>(ctx.transDateFilter);
  const [cashierName, setCashierName] = useState<string>(
    ctx.transCashNameFilter,
  );
  const [totalValue, setTotalValue] = useState<string>(
    ctx.transTotalSalesFilter.value.toString(),
  );

  const handleClose = (isClearing: boolean = false) => {
    if (isClearing) {
      // reset all filters
      if (ctx.selectedTransFilter === "date") {
        setDate("");
        ctx.dispatch(actions.setTransDateFilter(""));
      } else if (ctx.selectedTransFilter === "cashier_name") {
        setCashierName("");
        ctx.dispatch(actions.setTransCashNameFilter(""));
      } else if (ctx.selectedTransFilter === "total_sales") {
        setTotalValue("");
        ctx.dispatch(actions.setTransTotalSalesFilter(defaultNumberFilter));
      } else {
        setTotalValue("");
        ctx.dispatch(actions.setTransTotalQtyFilter(defaultNumberFilter));
      }
    }

    ctx.dispatch(actions.setTransFilterModalOpen(false));
    ctx.dispatch(actions.setSelectedTransFilter(""));
  };

  const handleSubmit = () => {
    if (ctx.selectedTransFilter === "total_sales") {
      ctx.dispatch(
        actions.setTransTotalSalesFilter({
          operator: ctx.transTotalSalesFilter.operator,
          value: !isNaN(parseFloat(totalValue)) ? parseFloat(totalValue) : 0,
        }),
      );
    }

    if (ctx.selectedTransFilter === "total_qty") {
      ctx.dispatch(
        actions.setTransTotalQtyFilter({
          operator: ctx.transTotalQtyFilter.operator,
          value: !isNaN(parseFloat(totalValue)) ? parseFloat(totalValue) : 0,
        }),
      );
    }

    if (ctx.selectedTransFilter === "date") {
      ctx.dispatch(actions.setTransDateFilter(date));
    }

    if (ctx.selectedTransFilter === "cashier_name") {
      ctx.dispatch(actions.setTransCashNameFilter(cashierName));
    }

    ctx.dispatch(actions.setApplyTransFilters(true));
    handleClose(false);
  };

  const handleSalesValue = (x: string) => {
    const hasLessThanTwoDecimals = x.split(".").length <= 2;
    const isValidNumber = !isNaN(parseFloat(x));
    if ((isValidNumber || x[0] === "-" || x === "") && hasLessThanTwoDecimals) {
      setTotalValue(x);
    }
  };

  return (
    <Modal isOpen={ctx.transFilterModalOpen} onClose={handleClose}>
      {ctx.selectedTransFilter === "date" && (
        <Input
          label="Date Filter (mm/dd/yyyy)"
          value={date}
          setValue={setDate}
        />
      )}
      {ctx.selectedTransFilter === "cashier_name" && (
        <Input
          label="Cashier Name Filter"
          value={cashierName}
          setValue={setCashierName}
        />
      )}
      {ctx.selectedTransFilter === "total_sales" && (
        <div>
          <div className="flex gap-2 justify-between mb-2">
            <CheckBox
              id={1}
              label="Greater Than"
              value={ctx.transTotalSalesFilter.operator === ">"}
              isBool={true}
              onChange={() =>
                ctx.dispatch(
                  actions.setTransTotalSalesFilter({
                    ...ctx.transTotalSalesFilter,
                    operator: ">",
                  }),
                )
              }
            />
            <CheckBox
              id={2}
              label="Equal To"
              value={ctx.transTotalSalesFilter.operator === "="}
              isBool={true}
              onChange={() =>
                ctx.dispatch(
                  actions.setTransTotalSalesFilter({
                    ...ctx.transTotalSalesFilter,
                    operator: "=",
                  }),
                )
              }
            />
            <CheckBox
              id={3}
              label="Less Than"
              value={ctx.transTotalSalesFilter.operator === "<"}
              isBool={true}
              onChange={() =>
                ctx.dispatch(
                  actions.setTransTotalSalesFilter({
                    ...ctx.transTotalSalesFilter,
                    operator: "<",
                  }),
                )
              }
            />
          </div>
          <Input
            label="Total Sales Filter"
            value={totalValue}
            setValue={handleSalesValue}
          />
        </div>
      )}

      {ctx.selectedTransFilter === "total_qty" && (
        <div>
          <div className="flex gap-2 justify-between mb-2">
            <CheckBox
              id={1}
              label="Greater Than"
              value={ctx.transTotalQtyFilter.operator === ">"}
              isBool={true}
              onChange={() =>
                ctx.dispatch(
                  actions.setTransTotalQtyFilter({
                    ...ctx.transTotalQtyFilter,
                    operator: ">",
                  }),
                )
              }
            />
            <CheckBox
              id={2}
              label="Equal To"
              value={ctx.transTotalQtyFilter.operator === "="}
              isBool={true}
              onChange={() =>
                ctx.dispatch(
                  actions.setTransTotalQtyFilter({
                    ...ctx.transTotalQtyFilter,
                    operator: "=",
                  }),
                )
              }
            />
            <CheckBox
              id={3}
              label="Less Than"
              value={ctx.transTotalQtyFilter.operator === "<"}
              isBool={true}
              onChange={() =>
                ctx.dispatch(
                  actions.setTransTotalQtyFilter({
                    ...ctx.transTotalQtyFilter,
                    operator: "<",
                  }),
                )
              }
            />
          </div>
          <Input
            label="Total Sales Filter"
            value={totalValue}
            setValue={handleSalesValue}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mt-4">
        <button className="btn-themeGreen" onClick={handleSubmit}>
          Submit
        </button>
        <button className="btn-themeBlue" onClick={() => handleClose(true)}>
          Clear
        </button>
        <button className="btn-themeOrange" onClick={() => handleClose(false)}>
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default TransFilterModal;
