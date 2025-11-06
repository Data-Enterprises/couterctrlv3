import { useState } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../../hooks";
import { setLedgerDate } from "../../features/searchSlice";
import { formatDate } from "../../utils";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/16/solid";

interface Props {
  handleCancel: () => void;
}
const SingleCalendar = ({ handleCancel }: Props) => {
  const monthsOfYear = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentDate = new Date();
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const searchState = useAppSelector((state) => state.search);
  const dispatch = useDispatch();

  const prevYear = () => {
    setCurrentYear((prevYear) => prevYear - 1);
  };

  const nextYear = () => {
    setCurrentYear((prevYear) => prevYear + 1);
  };

  const handleSelect = (e: number) => {
    const dte = formatDate(new Date(currentYear, e, 1).toString());
    dispatch(setLedgerDate(dte));
    handleCancel();
  };

  const isSelectedMonth = (mth: number) => {
    const dte = formatDate(new Date(currentYear, mth, 1).toString());
    return dte === searchState.ledgerDate ? "bg-[#10b981]" : "bg-blue-200";
  };

  const isDisabled = (mth: number) => {
    const currentDate = new Date();
    const selectedDate = new Date(currentYear, mth);
    return currentDate < selectedDate ? "pointer-events-none opacity-50" : "";
  };

  return (
    <section data-testid="calendar" className="md:w-full h-full text-content p-4 bg-custom-white shadow-lg rounded-md">
      <div className="calendar border-b">
        <div className="navigate-date flex items-center gap-2 mx-0 my-2 justify-between">
          <div className="flex">
            <h2 className="year text-2xl px-2 font-bold ">{currentYear}</h2>
          </div>
          <div className="buttons flex gap-2 px-2">
            <i className="bg-[#10b981] rounded-full text-custom-white cursor-pointer" onClick={prevYear}>
              <ChevronLeftIcon aria-hidden="true" className="size-5" query-id="prev" />
            </i>
            <i className="bg-[#10b981] rounded-full text-custom-white cursor-pointer" onClick={nextYear}>
              <ChevronRightIcon aria-hidden="true" className="size-5" query-id="next" />
            </i>
          </div>
        </div>
      </div>
      <div className="days grid grid-cols-4 gap-3 md:gap-6 my-1">
        {monthsOfYear.map((mth, i) => (
          <span
            onClick={() => handleSelect(i)}
            key={`day-${i}`}
            className={`day h-full w-full rounded-full md:p-2 ${isSelectedMonth(i)} ${isDisabled(i)}`}
          >
            {mth.substring(0, 3)}
          </span>
        ))}
      </div>
    </section>
  );
};

export default SingleCalendar;
