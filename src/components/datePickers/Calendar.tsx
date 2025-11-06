import { useState } from "react";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/16/solid";
import { formatDate } from "../../utils";
import { useAppSelector } from "../../hooks";
import { useDispatch } from "react-redux";
import { setStartDate, setEndDate } from "../../features/searchSlice";
import { setSubCompEndDate } from "../../features/subCompSlice";
import { useToast } from "../toasts/hooks/useToast";
import { search } from "../../apis/chat";

interface Props {
  handleCancel: () => void;
  useSubComp?: boolean;
  handleDate?: (x: string) => void;
  dateFlag?: string;
}

const Calendar = ({ handleCancel, useSubComp = false, handleDate, dateFlag }: Props) => {
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
  // const monthsOfYear = [
  //   "January",
  //   "February",
  //   "March",
  //   "April",
  //   "May",
  //   "June",
  //   "July",
  //   "August",
  //   "September",
  //   "October",
  //   "November",
  //   "December",
  // ];
  const currentDate = new Date();
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const searchState = useAppSelector((state) => state.search);
  const subCompState = useAppSelector((state) => state.subComp);
  const dispatch = useDispatch();
  const toast = useToast();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    setCurrentMonth((prevMonth) => (prevMonth === 0 ? 11 : prevMonth - 1));
    setCurrentYear((prevYear) => (currentMonth === 0 ? prevYear - 1 : prevYear));
  };

  const nextMonth = () => {
    setCurrentMonth((prevMonth) => (prevMonth === 11 ? 0 : prevMonth + 1));
    setCurrentYear((prevYear) => (currentMonth === 11 ? prevYear + 1 : prevYear));
  };

  const handleSelect = (e: number) => {
    const dte = formatDate(new Date(currentYear, currentMonth, e + 1).toString());

    if (useSubComp) {
      dispatch(setSubCompEndDate(dte));
      handleCancel();
      return;
    }

    if (dateFlag === "start") {
      if (new Date(dte) > new Date(searchState.endDate)) {
        toast.warn("Start date cannot be after the end date");
        return;
      }
      handleDate(dte);
    } else if (dateFlag === "end") {
      if (new Date(dte) < new Date(searchState.startDate)) {
        toast.warn("End date cannot be before the start date");
        return;
      }
      handleDate(dte);
    }
    handleCancel();
  };

  const isSelectedDate = (day: number) => {
    const d = new Date(currentYear, currentMonth, day + 1);
    if (useSubComp && formatDate(d.toString()) === subCompState.endDate) return "end-date";
    if (useSubComp) return "";

    if (dateFlag === "start" && formatDate(d.toString()) === searchState.startDate) {
      return "start-date";
    } else if (dateFlag === "end" && formatDate(d.toString()) === searchState.endDate) {
      return "end-date";
    } else {
      return "";
    }
  };

  const isEndOfWeek = (day: number) => {
    if (useSubComp) {
      const date = new Date(currentYear, currentMonth, day).toDateString();
      if (date.split(" ")[0] !== "Sun" && date.split(" ")[0] !== "Sat") {
        return "pointer-events-none opacity-20";
      }
    }
  };

  return (
    <section data-testid="calendar" className=" w-full h-full text-content px-2 select-none">
      <div className="calendar border-b">
        <div className="navigate-date flex items-center gap-2 mx-0 my-2 justify-between">
          <div className="flex">
            <h2 className="month text-2xl px-2 font-bold">{monthsOfYear[currentMonth]},</h2>
            <h2 className="year text-2xl px-2 font-bold ">{currentYear}</h2>
          </div>
          <div className="buttons flex gap-2 px-2">
            <i className="bg-[#10b981] rounded-full text-white cursor-pointer" onClick={prevMonth}>
              <ChevronLeftIcon aria-hidden="true" className="size-5" query-id="prev" />
            </i>
            <i className="bg-[#10b981] rounded-full text-white cursor-pointer" onClick={nextMonth}>
              <ChevronRightIcon aria-hidden="true" className="size-5" query-id="next" />
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
            onClick={() => handleSelect(day)}
            key={`day-${id}`}
            className={`day ${isSelectedDate(day)} ${isEndOfWeek(day + 1)}`}
          >
            {day + 1}
          </span>
        ))}
      </div>
    </section>
  );
};

export default Calendar;
