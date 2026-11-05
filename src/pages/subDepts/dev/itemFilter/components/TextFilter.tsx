// Hooks
import { useAppDispatch } from "../../../../../hooks";
import { useSubMarginActions, useSubMarginState } from "../../hooks";

// Interfaces
import type { ItemFilterType } from "../../../../../features/dev/devSubMarginSlice";

// Components
import Input from "../../../../../components-dev/inputs/Input";

interface TextFilterProps {
  // define any props you need here
  label: string;
  type: ItemFilterType;
  handleClose: () => void;
}
const TextFilter = ({ label, type, handleClose }: TextFilterProps) => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const { filterTextInput } = useSubMarginState();

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
