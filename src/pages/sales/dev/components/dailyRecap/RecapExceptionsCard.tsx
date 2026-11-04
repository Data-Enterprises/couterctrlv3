import RecapStatCard from "./RecapStatCard";
import { NO_EXCEPTIONS } from "./recapExceptions";
import { count, money } from "./recapFormat";
import type { WeekExceptionsState } from "./recapTypes";

/**
 * The day's exceptions: how many transactions had one and their amount, then
 * each type with its transactions and amount (board 15).
 *
 * Read once for the week from /cashiers/exceptions. Transactions are distinct
 * receipts, so a ten-line void is one; amounts are net sales, like the rest
 * of the recap. A No Sale rings nothing, so it shows only its count. Types
 * with nothing that day are left out.
 */
const RecapExceptionsCard = ({
  date,
  state,
  short,
}: {
  date: string;
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
  const day = state.byDay.get(date) ?? NO_EXCEPTIONS;
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
