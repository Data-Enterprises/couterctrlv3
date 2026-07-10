import type { Store } from "../interfaces";
import { getHolidayLastYear } from "./holidays";

export const getStoreName = (assignedStores: Store[], storeid: number, fallback?: string): string => {
  const match = assignedStores.find((s) => s.storeid === storeid);
  return match?.store_name ?? fallback ?? String(storeid);
};

export const formatDate = (date: string) => {
  const dte = new Date(date);
  const month = dte.getMonth() + 1;
  const day = dte.getDate();
  const year = dte.getFullYear();
  return month + "/" + day + "/" + year;
};

export const formatDateSimple = (date: string) => {
  const dte = date.split("T")[0];
  // yyyy-mm-dd => mm/dd/yyyy
  const [year, month, day] = dte.split("-");
  return month + "/" + day + "/" + year;
};

export const addDays = (date: string | Date, number: number) => {
  const newDate = new Date(date.toString());
  return new Date(newDate.setDate(newDate.getDate() + number));
};

// format to yyyy-mm-dd for goliath
export const formatGoliathDate = (date: string) => {
  const addZero = (num: number) => (num < 10 ? "0" + num : num);
  const dte = new Date(date);
  const month = dte.getMonth() + 1;
  const day = dte.getDate();
  const year = dte.getFullYear();
  return `${year}-${addZero(month)}-${addZero(day)}`;
};

export const formatCurrency2 = (x: number) => {
  const format = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };
  return x < 0 ? `${format(x)}` : format(x);
};

export const formatCurrencyCompact = (x: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(x);
};

export const formatBigNumber = (
  value: number,
  decimals: number = 2,
  locale: string = "en-US"
): string => {
  const options: Intl.NumberFormatOptions = {};
  options.minimumFractionDigits = decimals;
  return new Intl.NumberFormat(locale, options).format(value);
};

export const handleRipple = (e: React.MouseEvent<HTMLDivElement>) => {
  /**
   * In order for this to work
    .ripple-button {
      position: relative;
      overflow: hidden;
    }

    .ripple-button .ripple {
      position: absolute;
      border-radius: 50%;
      background-color: rgba(240, 245, 255, 0.7); => this can be default and changed dynamically
      transform: scale(0);
      animation: ripple-animation 500ms linear forwards;
      pointer-events: none;
    }
   */

  // the parent element being clicked on and the status text inside it
  const parent = e.currentTarget;
  const targetChild = parent.getElementsByClassName("status")[0];
  const text = targetChild ? targetChild.textContent : "test";

  // get the background color based on status
  const bg =
    text === "Inactive"
      ? "bg-emerald-500/40"
      : text === "Active"
      ? "bg-orange-500/40"
      : "bg-slate-50/75";

  // then create the ripple element to append
  const circle = document.createElement("span");
  // circle.classList.add(bg);

  // Then the ripple size needs to be big enought to cover the largetst dimension
  const diameter = Math.max(parent.clientWidth, parent.clientHeight);

  // Find the circle's radius which helps center the effect under the mouse pointer
  const radius = diameter / 2;

  // Set the size and position of the ripple, should be a perfect circle covering the clicked area
  // shorthand to set both width and height
  /**
   * the same as
   * circle.style.width = `${diameter}px`;
   * circle.style.height = `${diameter}px`;
   */
  circle.style.width = circle.style.height = `${diameter}px`;

  // Then we need to position the ripple so its center aligns with where the mouse clicks, hence the radius subtraction
  // the event's clientX/Y gives the position relative to the viewport, so we subtract the parent's
  // bounding rectangle position to get coordinates relative to the parent
  circle.style.left = `${
    e.clientX - parent.getBoundingClientRect().left - radius
  }px`;
  circle.style.top = `${
    e.clientY - parent.getBoundingClientRect().top - radius
  }px`;

  // Add the 'ripple' class to the circle for styling and animation
  circle.classList.add("ripple");
  circle.classList.add(bg);

  // Remove old ripple if present
  const oldRipple = parent.getElementsByClassName("ripple")[0];
  if (oldRipple) {
    oldRipple.remove();
  }

  // Then append the new ripple to the parent element
  parent.appendChild(circle);
};

// This will be used to determine how we get last year's data 
const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const sameWeekDayLastYear = (current: string) => {
  // Holidays get matched to the actual holiday date last year instead of a
  // plain weekday-preserving shift — fixed-date holidays land on a different
  // weekday each year, and floating ones (Thanksgiving, Labor Day, etc.)
  // aren't tied to a fixed date at all, so the weekday shift below is wrong
  // for either case.
  const holidayLastYear = getHolidayLastYear(current.split("T")[0]);
  if (holidayLastYear) {
    const d = new Date(holidayLastYear + "T12:00:00");
    return { date: holidayLastYear, dow: days[d.getDay()] };
  }

  const currDte = new Date(current);
  const currYear = currDte.getFullYear();
  const prevYear = currYear - 1;

  const isLeapYr = (y: number) =>
    (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

  const crossesLeapYr =
    isLeapYr(prevYear) && currDte > new Date(`${currYear}-02-28`);
  const daysToSubtract = crossesLeapYr ? 365 : 364;

  const result = new Date(currDte);
  result.setDate(result.getDate() - daysToSubtract);

  const formattedDate = result.toISOString().split("T")[0];

  const testing = {
    date: formattedDate,
    dow: days[result.getDay() + 1 === 7 ? 0 : result.getDay() + 1],
  };

  return testing;
};
