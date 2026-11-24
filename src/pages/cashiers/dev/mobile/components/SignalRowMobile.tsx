// Utils
import { formatCurrency2 } from "../../../../../utils";
import { SPREAD_CLASS } from "../utils";

// Interfaces
import type { Signal } from "../../interfaces";

// Components
import { ChevronRightIcon } from "@heroicons/react/20/solid";

interface SignalRowMobileProps {
  signal: Signal;
  onOpen: () => void;
}

/** One signal on the phone: its label and amount, lines and transactions, and
 *  how widely it is spread. Opens its transactions. */
const SignalRowMobile = ({ signal: s, onOpen }: SignalRowMobileProps) => (
  <button
    type="button"
    onClick={onOpen}
    className="block w-full border-t border-brand_line px-3.5 py-3 text-left first:border-t-0 active:bg-bkg"
  >
    <div className="flex items-baseline gap-2">
      <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
        {s.label}
      </span>
      <span className="flex-none font-display text-[13px] font-bold tabular-nums text-content">
        {formatCurrency2(s.amount)}
      </span>
      <ChevronRightIcon className="h-4 w-4 flex-none self-center text-content/95" />
    </div>
    {/* The counts carry their own words. */}
    <div className="mt-1 flex items-center gap-2">
      <span className="min-w-0 truncate font-mono text-[12px] text-content/95">
        {s.count.toLocaleString()} lines · {s.transactions.toLocaleString()}{" "}
        trans
      </span>
      <span
        className={`ml-auto flex-none truncate rounded-full border px-2 py-0.5 text-[11.5px] font-medium ${
          SPREAD_CLASS[s.spread] ?? SPREAD_CLASS.single
        }`}
      >
        {s.spreadLabel} · {s.sublabel}
      </span>
    </div>
  </button>
);

export default SignalRowMobile;
