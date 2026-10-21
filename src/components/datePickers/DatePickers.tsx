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
      {/* Not display:none when it is off. Most callers pass showBtn={false}
          because their own card owns the search button, and a hidden one left
          in the markup reads as a second action to anything that goes by the
          DOM rather than by what is painted -- a screen reader, or a test
          agent. Tommy's run reported Receivers as having two search controls
          for exactly this reason. */}
      {showBtn && (
        <div
          data-testid="date-picker-search-btn"
          className={`btn-themeBlue w-full text-center col-span-2 mt-2 text-[13px] xl:text-[14px] ${btnPadding}`}
          onClick={handleClick}
        >
          Search
        </div>
      )}
    </div>
  );
};

export default DatePickers;
