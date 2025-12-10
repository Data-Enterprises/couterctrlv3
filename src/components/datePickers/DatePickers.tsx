import StartDatePicker from "./StartDatePicker";
import EndDatePicker from "./EndDatePicker";
import { useAppSelector } from "../../hooks";

interface Props {
  handleQuery?: () => void;
  btnPadding?: string;
  showBtn?: boolean;
  singleDate?: boolean;
}

const DatePickers = ({ handleQuery, btnPadding = "", showBtn = true, singleDate = false }: Props) => {
  const context = useAppSelector((state) => state.app);

  const handleClick = () => {
    if (handleQuery) {
      handleQuery();
    }
  };

  const pickerStyle = context.isDesktop ?  "flex gap-2 mb-2" : "mb-2";

  return (
    <div data-testid="date-pickers" className="w-full select-none">
      <div className={pickerStyle}>
        {!singleDate && <StartDatePicker />}
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
