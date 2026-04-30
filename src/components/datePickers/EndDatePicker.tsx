import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import Calendar from "./Calendar";
import { useRef } from "react";
import { useAppSelector } from "../../hooks";
import { setEndDate } from "../../features/searchSlice";
import { useDispatch } from "react-redux";

const EndDatePicker = () => {
  const context = useAppSelector((state) => state.app);
  const searchState = useAppSelector((state) => state.search);
  const menuRef = useRef<HTMLButtonElement>(null);
  const dispatch = useDispatch();

  const handleEndDate = (date: string) => {
    dispatch(setEndDate(date));
  };

  const formatShortDate = (date: string) => {
    const dte = new Date(date);
    const month = dte.getMonth() + 1;
    const day = dte.getDate();
    return month + "/" + day;
  };

  const formatDisplay = () => {
    if (searchState.endDate) {
      return formatShortDate(searchState.endDate);
    }
  };

  const styling = context.isDesktop
    ? `relative text-left md:px-0 w-full`
    : `relative inline-block text-left md:px-0 mx-auto w-full`;

  const menuStyle = context.isDesktop ? "px-2.5 md:px-0" : "";
  const calendarStyle = "w-[98%] md:w-[100%]";

  return (
    <Menu data-testid="end-date-picker" as="div" className={styling}>
      <div className={menuStyle}>
        <label className="md:block flex justify-start md:justify-center pl-1 md:pl-0 text-[13px] md:text-[13px] font-medium ">
          End Date
        </label>{" "}
        <MenuButton
          data-testid="end-date-menu-button"
          ref={menuRef}
          className="inline-flex w-full bg-custom-white hover:bg-blue-200/50 hover:shadow-inner transition-colors duration-200 justify-between gap-x-1.5 rounded-md px-3 py-2 md:py-3 text-sm font-semibold  shadow-sm ring-1 ring-inset ring-gray-300 "
        >
          {formatDisplay()}
          <ChevronDownIcon
            aria-hidden="true"
            className="-mr-1 size-5 text-gray-400"
          />
        </MenuButton>
      </div>

      <MenuItems
        transition
        className={`-mx-9 md:mx-0 flex bg-custom-white w-[80%] ${calendarStyle} justify-center absolute 
        right-10 md:right-0 z-20 origin-top-right rounded-md shadow-lg ring-1 
        ring-black/5 transition focus:outline-none 
        data-[closed]:scale-95 
        data-[closed]:transform 
        data-[closed]:opacity-0 
        data-[enter]:duration-100 
        data-[leave]:duration-75 
        data-[enter]:ease-out 
        data-[leave]:ease-in`}
      >
        <div data-testid="end-calendar-container" className="py-1">
          <MenuItem>
            {({ close }) => (
              <Calendar
                handleCancel={close}
                handleDate={handleEndDate}
                dateFlag="end"
              />
            )}
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  );
};

export default EndDatePicker;
