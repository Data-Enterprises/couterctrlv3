import { useAppDispatch } from "../../../hooks";
import { listSelect, modeSelect } from "../components";
import { setPriceOptOption } from "../../../features/upcModalSlice";
import SingleSelect from "../../../components/SingleSelect";

const PriceOptSelects = () => {
  const dispatch = useAppDispatch();
  return (
    <div className="flex gap-2 mb-2">
      <SingleSelect
        className="bg-custom-white"
        data={listSelect}
        displayKey={"display"}
        valueKey={"value"}
        label="Select List"
        onSelect={(x) =>
          dispatch(setPriceOptOption({ option: "list", value: x as string }))
        }
      />
      <SingleSelect
        className="bg-custom-white"
        data={modeSelect}
        displayKey={"display"}
        valueKey={"value"}
        label="Select data"
        onSelect={(x) =>
          dispatch(setPriceOptOption({ option: "data", value: x as string }))
        }
      />
    </div>
  );
};

export default PriceOptSelects;
