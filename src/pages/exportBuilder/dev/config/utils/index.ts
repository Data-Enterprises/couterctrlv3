// Interfaces
import type { SelectFilterOption } from "../../../../../components-dev/filters/interfaces";
import type { FlagFilter } from "../../utils/sources";

/**
 * What to call a store in the list.
 *
 * `store_name` usually arrives with the number already in it ("001 - IGA
 * GLASGOW KY"), so the number is only prefixed when the name does not carry it.
 */
export const storeLabel = ({
  store_number,
  store_name,
}: {
  store_number: string;
  store_name: string;
}) => {
  const name = String(store_name ?? "");
  const id = String(store_number ?? "");
  // Compare the numbers, not the text: "1" is in "IGA 100" by accident.
  const leading = name.match(/^\s*0*(\d+)/)?.[1];
  const number = id.replace(/^0+/, "") || id;
  return leading === number ? name : `${id} - ${name}`;
};

/**
 * The three states of a flag filter. The endpoint reads null, 0 and 1 and
 * tests COALESCE(flag, 0), so "only refunds" catches every marker the column
 * uses, not just the literal 1.
 */
export const flagChoices = (flag: FlagFilter): SelectFilterOption[] => [
  { value: "all", label: "All lines" },
  { value: "exclude", label: `Exclude ${flag.plural}` },
  { value: "only", label: `Only ${flag.plural}` },
];

export const flagToChoice = (flag: number | null) =>
  flag === null ? "all" : flag ? "only" : "exclude";

export const choiceToFlag = (choice: string) =>
  choice === "all" ? null : choice === "only" ? 1 : 0;

/**
 * What the endpoint will take as a file name. It names the build's folder in
 * S3, so dots are refused outright: `sales.csv` is a 400 there and is caught
 * here first.
 */
export const PREFIX_OK = /^[A-Za-z0-9_-]{1,60}$/;

/**
 * A day, with its weekday: "every Saturday in the month" is the question the
 * Days list exists to answer. Read in UTC, because the strings are plain days
 * and a local reading turns one of them into the evening before.
 */
export const dayLabel = (day: string) => {
  const at = new Date(day + "T00:00:00Z");
  if (Number.isNaN(at.getTime())) return day;
  const weekday = at.toLocaleDateString(undefined, {
    weekday: "short",
    timeZone: "UTC",
  });
  return `${weekday} · ${day}`;
};

/** What the export endpoint accepts for `fileFormat`. */
export const FILE_FORMATS: SelectFilterOption[] = [
  { value: "csv", label: "CSV" },
  { value: "text", label: "Text" },
  { value: "binary", label: "Binary" },
];
