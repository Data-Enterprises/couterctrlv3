import { useState } from "react";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/16/solid";
import { formatDate } from "../../utils";
import { useAppSelector } from "../../hooks";
// import { setStartDate, setEndDate } from "../../features/searchSlice";
import { useToast } from "../toasts/hooks/useToast";

interface Props {
  handleCancel: () => void;
  handleDate?: (x: string) => void;
  dateFlag?: string;
}

const Calendar = ({ handleCancel, handleDate, dateFlag }: Props) => {
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const monthsOfYear = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const currentDate = new Date();
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const searchState = useAppSelector((state) => state.search);
  const toast = useToast();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    setCurrentMonth((prevMonth) => (prevMonth === 0 ? 11 : prevMonth - 1));
    setCurrentYear((prevYear) =>
      currentMonth === 0 ? prevYear - 1 : prevYear
    );
  };

  const nextMonth = () => {
    setCurrentMonth((prevMonth) => (prevMonth === 11 ? 0 : prevMonth + 1));
    setCurrentYear((prevYear) =>
      currentMonth === 11 ? prevYear + 1 : prevYear
    );
  };

  const handleSelect = (e: number) => {
    const dte = formatDate(
      new Date(currentYear, currentMonth, e + 1).toString()
    );

    if (dateFlag === "start") {
      if (new Date(dte) > new Date(searchState.endDate)) {
        toast.warn("Start date cannot be after the end date");
        return;
      }
      handleDate!(dte);
    } else if (dateFlag === "end") {
      if (new Date(dte) < new Date(searchState.startDate)) {
        toast.warn("End date cannot be before the start date");
        return;
      }
      handleDate!(dte);
    } else if (dateFlag === "single") {
      handleDate!(dte);
    }
    handleCancel();
  };

  const isSelectedDate = (day: number) => {
    const d = new Date(currentYear, currentMonth, day + 1);
    if (
      dateFlag === "start" &&
      formatDate(d.toString()) === searchState.startDate
    ) {
      return "start-date";
    } else if (
      dateFlag === "end" &&
      formatDate(d.toString()) === searchState.endDate
    ) {
      return "end-date";
    } else if (
      dateFlag === "single" &&
      formatDate(d.toString()) === searchState.singleDate
    ) {
      return "end-date";
    } else {
      return "";
    }
  };

  return (
    <section
      data-testid="calendar"
      className=" w-full h-full text-content px-2 select-none"
    >
      <div className="calendar border-b">
        <div className="navigate-date flex items-center gap-2 mx-0 my-2 justify-between">
          <div className="flex">
            <h2 className="month text-xl px-2 font-bold">
              {monthsOfYear[currentMonth]},
            </h2>
            <h2 className="year text-xl px-2 font-bold ">{currentYear}</h2>
          </div>
          <div className="buttons flex gap-2 px-2">
            <i
              data-testid="prev-month-button"
              className="bg-[#10b981] rounded-full text-white cursor-pointer"
              onClick={prevMonth}
            >
              <ChevronLeftIcon
                aria-hidden="true"
                className="size-5"
                query-id="prev"
              />
            </i>
            <i
              data-testid="next-month-button"
              className="bg-[#10b981] rounded-full text-white cursor-pointer"
              onClick={nextMonth}
            >
              <ChevronRightIcon
                aria-hidden="true"
                className="size-5"
                query-id="next"
              />
            </i>
          </div>
        </div>
      </div>
      <div className="md:w-full mt-2 flex uppercase font-bold text-sm gap-1 tracking-tight text-center">
        {daysOfWeek.map((day, i) => (
          <div key={`dow=${i}`} className="weekday">
            {day}
          </div>
        ))}
      </div>
      <div className="days flex flex-wrap">
        {[...Array(firstDayOfMonth).keys()].map((_, idx) => (
          <span className="day text-center" key={`empty-${idx}`}>
            &nbsp;
          </span>
        ))}
        {[...Array(daysInMonth).keys()].map((day, id) => (
          <span
            data-testid={`${dateFlag}-calendar-day-${id}`}
            onClick={() => handleSelect(day)}
            key={`day-${id}`}
            className={`day hover:bg-blue-200 transition-all duration-200 ${isSelectedDate(
              day
            )}`}
          >
            {day + 1}
          </span>
        ))}
      </div>
    </section>
  );
};

export default Calendar;
