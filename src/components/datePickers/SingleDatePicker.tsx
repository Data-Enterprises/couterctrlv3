import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
// import Calendar from "./Calendar";
import { useRef } from "react";
import { useAppSelector } from "../../hooks";
import SingleCalendar from "./SingleCalendar";
import { useDispatch } from "react-redux";
import { setLedgerDate } from "../../features/searchSlice";

const SingleDatePicker = () => {
  const dispatch = useDispatch();
  const searchState = useAppSelector((state) => state.search);
  const menuRef = useRef<HTMLButtonElement>(null);

  const formatShortDate = (date: string) => {
    const dte = new Date(date);
    const month = dte.getMonth() + 1;
    const day = dte.getDate();
    const year = dte.getFullYear();
    return month + "/" + day + "/" + year;
  };

  const formatDisplay = () => {
    const dte = new Date();
    const month = dte.getMonth();
    const year = dte.getFullYear();
    if (!searchState.ledgerDate) dispatch(setLedgerDate(formatShortDate(new Date(year, month, 1).toDateString())));
    return searchState.ledgerDate ? formatShortDate(searchState.ledgerDate) : formatShortDate(new Date(year, month, 1).toDateString());
  };

  return (
    <Menu as="div" className="relative inline-block text-left w-full ">
      <div>
        <label className="block text-sm/6 font-medium ">Select Date</label>
        <MenuButton
          ref={menuRef}
          className="inline-flex w-full justify-between gap-x-1.5 rounded-md bg-custom-white px-3 py-3 text-sm font-semibold  shadow-sm ring-1 ring-inset ring-gray-300 "
        >
          {formatDisplay()}
          <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
        </MenuButton>
      </div>

      <MenuItems
        transition
        className="-mx-9 md:mx-0 flex justify-center md:absolute md:right-0 z-10 mt-2 origin-top-right rounded-md bg-bkg shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
      >
        <div className="py-1">
          <MenuItem>{({ close }) => <SingleCalendar handleCancel={close} />}</MenuItem>
        </div>
      </MenuItems>
    </Menu>
  );
};

export default SingleDatePicker;
