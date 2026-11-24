// Utils
import { formatCurrency2 } from "../../../../../utils";

// Interfaces
import type { ExplorerTotals } from "../../interfaces";

// Components
import PerfCardHeader from "../../../../../components/mobile/perf/PerfCardHeader";
import PhoneFigure from "./PhoneFigure";

interface ExplorerScopeCardProps {
  /** The exception, which is the card's title. */
  exception: string;
  scopeLabel: string;
  when: string;
  totals: ExplorerTotals;
  /** Transactions past the cap that were not loaded. */
  truncated: number;
  onSearch: () => void;
  onInfo: () => void;
  /** Opens the exception picker; absent when there is only one exception. */
  onTitleTap?: () => void;
}

/** The phone's top card: the exception and scope, the week's exception lines,
 *  four figures, and the cap note. */
const ExplorerScopeCard = ({
  exception,
  scopeLabel,
  when,
  totals,
  truncated,
  onSearch,
  onInfo,
  onTitleTap,
}: ExplorerScopeCardProps) => (
  <section className="cc-card-phone">
    {/* The exception is what the card is about, so it is the title
        and opens the picker, as Loss Prevention's event type does. */}
    <PerfCardHeader
      title={exception || "All exceptions"}
      label={scopeLabel}
      when={when}
      onSearch={onSearch}
      onInfo={onInfo}
      onTitleTap={onTitleTap}
    />

    <div className="px-4 pb-3 pt-2.5">
      <div className="text-[12px] text-content/95">
        Exception lines this week
      </div>
      <div className="font-display text-[30px] font-extrabold leading-none tracking-tight text-content">
        {totals.exceptions.toLocaleString()}
      </div>

      {/* Four tiles: Amount gets room to print in full; Lines is in
          the headline and Stores in the scope line. */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-brand_line pt-2.5">
        <PhoneFigure
          label="Transactions"
          value={totals.transactions.toLocaleString()}
        />
        <PhoneFigure label="Amount" value={formatCurrency2(totals.amount)} />
        <PhoneFigure
          label="Cashiers"
          value={totals.cashiers.toLocaleString()}
        />
        <PhoneFigure label="Items" value={totals.items.toLocaleString()} />
      </div>
    </div>

    {/* The receipt fetch is capped, so past it the figures run low;
        said on its own line. */}
    {truncated > 0 && (
      <p className="border-t border-brand_line bg-fill_muted px-4 py-2 text-[11.5px] font-semibold text-content">
        Capped: {truncated.toLocaleString()} more{" "}
        {truncated === 1 ? "transaction" : "transactions"} not loaded, so these
        totals run low.
      </p>
    )}
  </section>
);

export default ExplorerScopeCard;
