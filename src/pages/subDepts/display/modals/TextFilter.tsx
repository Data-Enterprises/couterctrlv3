import { useAppDispatch, useAppSelector } from "../../../../hooks";
import Input from "../../../../components/inputs/Input";
import {
  setDescFilter,
  setFilterTextInput,
  setUpcFilter,
  type ItemFilterType,
} from "../../../../features/subMarginSlice";

interface TextFilterProps {
  // define any props you need here
  label: string;
  type: ItemFilterType;
  handleClose: () => void;
}
const TextFilter = ({ label, type, handleClose }: TextFilterProps) => {
  const dispatch = useAppDispatch();
  const { filterTextInput } = useAppSelector((state) => state.subMargin);

  const handleInputChange = (x: string) => {
    dispatch(setFilterTextInput(x));
  };

  const handleSubmit = () => {
    if (type === "upc") {
      dispatch(setUpcFilter(filterTextInput));
    } else {
      dispatch(setDescFilter(filterTextInput));
    }
    handleClose();
  };

  return (
    <div className="space-y-2">
      <Input
        label={label}
        value={filterTextInput}
        setValue={handleInputChange}
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

export default TextFilter;
