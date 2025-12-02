import StartDatePicker from "./StartDatePicker";
import EndDatePicker from "./EndDatePicker";
import { useCustomEvent } from "../../hooks/useCustomEvent";
import { useAppSelector } from "../../hooks";

interface Props {
  handleQuery?: () => void;
  btnPadding?: string;
  showBtn?: boolean;
}

const DatePickers = ({ handleQuery, btnPadding = "", showBtn = true }: Props) => {
  const { emit } = useCustomEvent("slicer-event");
  const context = useAppSelector((state) => state.app);

  const handleClick = () => {
    if (handleQuery) {
      handleQuery();
    }

    emit({ message: "", eventType: "slicer", value: "update" });
  };

  const pickerStyle = context.isDesktop ?  "flex gap-2 mb-2" : "mb-2";

  return (
    <div data-testid="date-pickers" className="w-full select-none">
      <div className={pickerStyle}>
        <StartDatePicker />
        <EndDatePicker />
      </div>
      <div
        data-testid="date-picker-search-btn"
        className={`btn-themeBlue w-full text-center col-span-2 ${btnPadding}`}
        onClick={handleClick}
        style={{ display: showBtn ? "block" : "none" }}
      >
        Search
      </div>
    </div>
  );
};

export default DatePickers;
