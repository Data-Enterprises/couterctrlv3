import StartDatePicker from "./StartDatePicker";
import EndDatePicker from "./EndDatePicker";
import { useAppSelector } from "../../hooks";

interface Props {
  handleQuery?: () => void;
  btnPadding?: string;
  showBtn?: boolean;
  stacked?: boolean;
}

const DatePickers = ({
  handleQuery,
  btnPadding = "",
  showBtn = true,
  stacked = false,
}: Props) => {
  const context = useAppSelector((state) => state.app);

  const handleClick = () => {
    if (handleQuery) {
      handleQuery();
    }
  };

  const pickerStyle = stacked
    ? "grid gap-2"
    : context.isDesktop
      ? "flex gap-2"
      : context.isMobile ? "grid grid-cols-1 md:grid-cols-2 gap-2" : "grid gap-2";

  return (
    <div data-testid="date-pickers" className="w-full select-none">
      <div className={pickerStyle}>
        <StartDatePicker />
        <EndDatePicker />
      </div>
      <div
        data-testid="date-picker-search-btn"
        className={`btn-themeBlue w-full text-center col-span-2 mt-2 text-[13px] xl:text-[14px] ${btnPadding}`}
        onClick={handleClick}
        style={{ display: showBtn ? "block" : "none" }}
      >
        Search
      </div>
    </div>
  );
};

export default DatePickers;
