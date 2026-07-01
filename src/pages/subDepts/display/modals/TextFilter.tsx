import { useAppDispatch, useAppSelector } from "../../../../hooks";
import Input from "../../../../components/inputs/Input";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import type { ItemFilterType } from "../../../../features/subMarginSlice";

interface TextFilterProps {
  // define any props you need here
  label: string;
  type: ItemFilterType;
  handleClose: () => void;
}
const TextFilter = ({ label, type, handleClose }: TextFilterProps) => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const { filterTextInput } = useAppSelector((state) => state.subMargin);

  const handleInputChange = (x: string) => {
    dispatch(actions.setFilterTextInput(x));
  };

  const handleSubmit = () => {
    if (type === "upc") {
      dispatch(actions.setUpcFilter(filterTextInput));
    } else {
      dispatch(actions.setDescFilter(filterTextInput));
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
