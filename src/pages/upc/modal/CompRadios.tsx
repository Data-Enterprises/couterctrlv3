import { useAppSelector, useAppDispatch } from "../../../hooks";
import { setCompOption } from "../../../features/upcModalSlice";
import CheckBox from "../../../components/inputs/CheckBox";

const CompRadios = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.upcModal);

  return (
    <div className={`flex justify-center gap-4`}>
      <CheckBox
        id={0}
        label="Both"
        value={state.compOption.both}
        className="cursor-pointer"
        onChange={() => dispatch(setCompOption("both"))}
      />
      <CheckBox
        id={1}
        label="Last Year"
        value={state.compOption.ly}
        className="cursor-pointer"
        onChange={() => dispatch(setCompOption("ly"))}
      />
      <CheckBox
        id={2}
        label="This Year"
        value={state.compOption.ty}
        className="cursor-pointer"
        onChange={() => dispatch(setCompOption("ty"))}
      />
    </div>
  );
};

export default CompRadios;
