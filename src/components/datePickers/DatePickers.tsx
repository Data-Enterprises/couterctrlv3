import StartDatePicker from "./StartDatePicker";
import EndDatePicker from "./EndDatePicker";
import { useCustomEvent } from "../../hooks/useCustomEvent";
import { useAppSelector } from "../../hooks";

interface Props {
  useSingleDate?: boolean;
  handleQuery?: () => void;
  inReports?: boolean;
}

const DatePickers = ({
  useSingleDate = false,
  handleQuery,
  inReports = false,
}: Props) => {
  const context = useAppSelector((state) => state.app);
  const { emit } = useCustomEvent("slicer-event");

  const handleClick = () => {
    if (handleQuery) {
      handleQuery();
    }

    emit({ message: "", eventType: "slicer", value: "update" });
  };

  const btnStyle = context.isDesktop
    ? "md:px-6 w-2/3 md:w-auto text-center mt-1 md:mt-0"
    : context.isTablet
    ? "w-full mt-6 text-center"
    : "w-full text-center mt-2";

  const pickerStyle = context.isDesktop
    ? "flex flex-row md:gap-2"
    : context.isTablet
    ? `grid ${inReports ? "grid-cols-2" : "grid-cols-3"} gap-6 w-full`
    : "w-full grid";

  return (
    <div className="flex flex-col gap-2 mb-4 md:px-0 items-center select-none md:w-auto bg-red-200">
      <div className={pickerStyle}>
        <StartDatePicker inReports={inReports} />
        {!useSingleDate && <EndDatePicker inReports={inReports} />}
      </div>
      {!inReports ? (
        <div className={`btn-themeBlue ${btnStyle}`} onClick={handleClick}>
          Search
        </div>
      ) : null}
    </div>
  );
};

export default DatePickers;
