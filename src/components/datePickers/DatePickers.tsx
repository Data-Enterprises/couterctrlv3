import StartDatePicker from "./StartDatePicker";
import EndDatePicker from "./EndDatePicker";
import { useCustomEvent } from "../../hooks/useCustomEvent";

interface Props {
  handleQuery?: () => void;
}

const DatePickers = ({ handleQuery }: Props) => {
  const { emit } = useCustomEvent("slicer-event");

  const handleClick = () => {
    if (handleQuery) {
      handleQuery();
    }

    emit({ message: "", eventType: "slicer", value: "update" });
  };

  const pickerStyle = "flex gap-2 mb-2";

  return (
    <div className="w-full">
      <div className={pickerStyle}>
        <StartDatePicker />
        <EndDatePicker />
      </div>
      <div
        className={`btn-themeBlue w-full text-center col-span-2`}
        onClick={handleClick}
      >
        Search
      </div>
    </div>
  );
};

export default DatePickers;
