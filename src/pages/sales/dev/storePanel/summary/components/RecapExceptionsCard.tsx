// Utils
import { count, money } from "../utils/recapFormat";
import { combineExceptions } from "../utils/recapPeriod";

// Interfaces
import type { WeekExceptionsState } from "../interfaces/index";

// Components
import RecapStatCard from "./RecapStatCard";

/**
 * The period's exceptions, a day or the week: how many transactions had one
 * and their amount, then each type with its transactions and amount (board
 * 15, and 16 for the week).
 *
 * Read once for the week from /cashiers/exceptions. Transactions are distinct
 * receipts, so a ten-line void is one; amounts are net sales, like the rest
 * of the recap. A No Sale rings nothing, so it shows only its count. Types
 * with nothing in the period are left out.
 */
const RecapExceptionsCard = ({
  dates,
  state,
  short,
}: {
  /** The day, or the week's seven. */
  dates: string[];
  state: WeekExceptionsState;
  short: boolean;
}) => {
  if (state.status !== "ready") {
    return (
      <RecapStatCard
        title="Exceptions"
        hero={state.status === "error" ? "—" : "…"}
        heroSub={state.status === "error" ? "could not be read" : "reading the week's exceptions"}
        short={short}
        rows={[]}
      />
    );
  }
  const day = combineExceptions(state.byDay, dates);
  return (
    <RecapStatCard
      title="Exceptions"
      hero={count(day.transactions)}
      heroSub={`transactions | ${money(day.amount)}`}
      short={short}
      rows={day.types.map((t) => ({
        label: t.label,
        value: count(t.transactions),
        sub: t.amount === null ? undefined : ` | ${money(t.amount)}`,
      }))}
    />
  );
};

export default RecapExceptionsCard;
