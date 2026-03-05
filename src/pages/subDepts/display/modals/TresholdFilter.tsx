import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import {
  setFilterTextInput,
  setThresholdFilter,
  setThreshOperator,
  type ItemFilterType,
  type ThreshOperator,
} from "../../../../features/subMarginSlice";
import CheckBox from "../../../../components/inputs/CheckBox";
import Input from "../../../../components/inputs/Input";

interface ThresholdFilter {
  label: string;
  type: ItemFilterType;
  handleClose: () => void;
}

const ThresholdFilter = ({ label, type, handleClose }: ThresholdFilter) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const subMargin = useAppSelector((state) => state.subMargin);

  const textChange = (x: string) => {
    dispatch(setFilterTextInput(x));
  };

  const handleSubmit = () => {
    if (isNaN(Number(subMargin.filterTextInput))) {
      toast.warn("Please enter a valid number");
      return;
    }
    if (subMargin.threshOperator === "") {
      toast.warn(
        "Please select one of the operators. Greater than, Less than, Equal to",
      );
      return;
    }

    if (type === "sales") {
      // dispatch action to set sales filter
      dispatch(
        setThresholdFilter({
          filter: "salesFilter",
          value: {
            operator: subMargin.threshOperator,
            value: Number(subMargin.filterTextInput),
          },
        }),
      );
    } else if (type === "qty") {
      // dispatch action to set quantity filter
      dispatch(
        setThresholdFilter({
          filter: "qtyFilter",
          value: {
            operator: subMargin.threshOperator,
            value: Number(subMargin.filterTextInput),
          },
        }),
      );
    } else if (type === "cogs") {
      // dispatch action to set cogs filter
      dispatch(
        setThresholdFilter({
          filter: "cogsFilter",
          value: {
            operator: subMargin.threshOperator,
            value: Number(subMargin.filterTextInput),
          },
        }),
      );
    } else if (type === "caseCost") {
      // dispatch action to set case cost filter
      dispatch(
        setThresholdFilter({
          filter: "caseCostFilter",
          value: {
            operator: subMargin.threshOperator,
            value: Number(subMargin.filterTextInput),
          },
        }),
      );
    } else if (type === "unitCost") {
      // dispatch action to set unit cost filter
      dispatch(
        setThresholdFilter({
          filter: "unitCostFilter",
          value: {
            operator: subMargin.threshOperator,
            value: Number(subMargin.filterTextInput),
          },
        }),
      );
    } else if (type === "margin") {
      // dispatch action to set margin filter
      dispatch(
        setThresholdFilter({
          filter: "marginFilter",
          value: {
            operator: subMargin.threshOperator,
            value: Number(subMargin.filterTextInput),
          },
        }),
      );
    }

    handleClose();
  };

  const handleOperatorChange = (operator: ThreshOperator) => {
    // dispatch action to set the operator (greater than, less than, equal to)
    if (subMargin.threshOperator === operator) {
      dispatch(setThreshOperator(""));
    } else {
      dispatch(setThreshOperator(operator));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between select-none">
        <CheckBox
          id={1}
          label="Greater Than"
          value={subMargin.threshOperator === ">"}
          onChange={() => handleOperatorChange(">")}
        />
        <CheckBox
          id={1}
          label="Equal To"
          value={subMargin.threshOperator === "="}
          onChange={() => handleOperatorChange("=")}
        />
        <CheckBox
          id={1}
          label="Less Than"
          value={subMargin.threshOperator === "<"}
          onChange={() => handleOperatorChange("<")}
        />
      </div>
      <Input
        label={label}
        value={subMargin.filterTextInput}
        setValue={textChange}
      />
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-themeGreen" onClick={handleSubmit}>
          Submit
        </button>
        <button className="btn-themeOrange" onClick={handleClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ThresholdFilter;
