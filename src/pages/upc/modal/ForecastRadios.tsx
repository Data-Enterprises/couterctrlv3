import { useAppSelector, useAppDispatch } from "../../../hooks";
import { setRadioOption } from "../../../features/upcModalSlice";
import CheckBox from "../../../components/inputs/CheckBox";

const ForecastRadios = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.upcModal);

  return (
    <div className={`flex justify-center gap-4`}>
      <CheckBox
        id={0}
        label="Date Range"
        value={state.radioOption.dates}
        className="cursor-pointer"
        onChange={() => dispatch(setRadioOption("dates"))}
        idExtension="forecast-dates"
      />
      <CheckBox
        id={1}
        label="Metrics"
        value={state.radioOption.metrics}
        className="cursor-pointer"
        onChange={() => dispatch(setRadioOption("metrics"))}
        idExtension="forecast-metrics"
      />
    </div>
  );
};

export default ForecastRadios;
