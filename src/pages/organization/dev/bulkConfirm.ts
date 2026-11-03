/**
 * What Assign all and Unassign all ask before they act, on the Companies,
 * Stores and Base Groups tabs. Neither asked: Unassign all on Companies took
 * the company off everyone, the person pressing it included, in one click.
 *
 * Unassign all always asks. Assign all asks above a handful, where a slip
 * would be a lot to undo. The count is named, and so is the person pressing
 * it when they are in the list.
 */
export interface BulkConfirm {
  message: string;
  confirmLabel: string;
}

/** Assign all asks only above this many. */
export const HANDFUL = 5;

const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;

/** People given or taken off something: a company, a store, a group. */
export const peopleConfirm = ({
  direction,
  ids,
  me,
  what,
  always = false,
}: {
  direction: "in" | "out";
  ids: number[];
  /** The signed-in person, named when they are in the list. */
  me: number;
  /** "Food Giant", "store 301", "East". */
  what: string;
  /** Ask whatever the count: the Companies tab shows who is moving every
   *  time, so a small Assign all is checked as well as a big one. */
  always?: boolean;
}): BulkConfirm | null => {
  const who = `${people(ids.length)}${ids.includes(me) ? ", including you" : ""}`;
  if (direction === "out") {
    return { message: `Take ${what} off ${who}?`, confirmLabel: "Yes, take it off" };
  }
  return always || ids.length > HANDFUL
    ? { message: `Give ${what} to ${who}?`, confirmLabel: "Yes, give it" }
    : null;
};

/** Stores put into or taken out of a base group. */
export const groupStoresConfirm = ({
  direction,
  count,
  group,
}: {
  direction: "in" | "out";
  count: number;
  group: string;
}): BulkConfirm | null => {
  const stores = `${count} store${count === 1 ? "" : "s"}`;
  if (direction === "out") {
    return {
      message: `Take ${stores} out of ${group}? Everyone who holds ${group} loses them, unless another group gives them.`,
      confirmLabel: "Yes, take them out",
    };
  }
  return count > HANDFUL
    ? {
        message: `Add ${stores} to ${group}? Everyone who holds ${group} By group gets them.`,
        confirmLabel: "Yes, add them",
      }
    : null;
};
