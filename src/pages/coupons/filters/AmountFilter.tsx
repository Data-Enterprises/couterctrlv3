import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setThresh } from "../../../features/couponLegacySlice";
import CheckBox from "../../../components/inputs/CheckBox";

interface AmountFilterProps {
  text: string;
  setText: (value: string) => void;
}

const AmountFilter = ({ text, setText }: AmountFilterProps) => {
  const state = useAppSelector((state) => state.couponLegacy);
  const dispatch = useAppDispatch();
  const handleChange = (n: number) => {
    let thresh: "less" | "greater" | "equal" = "equal";
    if (n === 0) {
      thresh = "less";
    } else if (n === 1) {
      thresh = "greater";
    }

    dispatch(setThresh(thresh));
  };

  const handleAmtTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const dots = value.split(".").length; // Checking to see if there is already a decimal in the input
    
    // Allowing only numbers, one decimal point, or an empty string
    if ((value === "" || (value === '.') || !isNaN(parseFloat(value))) && dots <= 2) {
      setText(value);
    }
  };

  return (
    <div className="mb-2">
      <div className="flex justify-between my-2">
        <CheckBox
          id={0}
          label="Less Than"
          onChange={() => handleChange(0)}
          value={state.amtLessThan}
        />
        <CheckBox
          id={1}
          label="Greater Than"
          onChange={() => handleChange(1)}
          value={state.amtGreaterThan}
        />
        <CheckBox
          id={2}
          label="Equal To"
          onChange={() => handleChange(2)}
          value={!state.amtLessThan && !state.amtGreaterThan}
        />
      </div>
      <input
        data-testid="amount-filter-input"
        type="text"
        value={text}
        onChange={handleAmtTextChange}
        className="basic-input focus:border bg-custom-white"
      />
    </div>
  );
};

export default AmountFilter;
