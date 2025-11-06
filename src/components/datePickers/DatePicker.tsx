import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import Calendar from "./Calendar";
import { useRef } from "react";
import { useAppSelector } from "../../hooks";

interface Props {
  useSingleDate?: boolean;
  useSubComp?: boolean;
}

const DatePicker = ({ useSingleDate = false, useSubComp = false }: Props) => {
  const searchState = useAppSelector((state) => state.search);
  const menuRef = useRef<HTMLButtonElement>(null);

  const formatShortDate = (date: string) => {
    const dte = new Date(date);
    const month = dte.getMonth() + 1;
    const day = dte.getDate();
    return month + "/" + day;
  };

  const formatDisplay = () => {
    if (useSingleDate && searchState.startDate) {
      return formatShortDate(searchState.startDate);
    }
    if (searchState.startDate && searchState.endDate) {
      return formatShortDate(searchState.startDate) + " - " + formatShortDate(searchState.endDate);
    } else if (searchState.startDate) {
      return formatShortDate(searchState.startDate) + " - Select End Date";
    } else if (searchState.endDate) {
      return "Select Start Date - " + formatShortDate(searchState.endDate);
    } else {
      return "Select Dates";
    }
  };

  return (
    <Menu as="div" className="relative inline-block text-left min-w-full px-6 md:px-0 md:w-40">
      <div>
        <label className="md:block flex justify-center text-sm/6 font-medium ">
          {useSingleDate ? "Select Date" : "Select Dates"}
        </label>
        <MenuButton
          ref={menuRef}
          className="inline-flex w-full bg-custom-white justify-between gap-x-1.5 rounded-md px-3 py-3 text-sm font-semibold  shadow-sm ring-1 ring-inset ring-gray-300 "
        >
          {formatDisplay()}
          <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
        </MenuButton>
      </div>

      <MenuItems
        transition
        className="-mx-9 md:mx-0 flex bg-custom-white justify-center md:absolute md:right-0 z-10 mt-2 origin-top-right rounded-md shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
      >
        <div className="py-1">
          <MenuItem>
            {({ close }) => <Calendar handleCancel={close} useSubComp={useSubComp} />}
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  );
};

export default DatePicker;
