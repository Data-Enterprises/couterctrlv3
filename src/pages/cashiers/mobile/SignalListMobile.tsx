import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import {
  setExplorerLens,
  setExplorerSignalKey,
} from "../../../features/cashiersSlice";
import SelectFilter from "../../../components/filters/SelectFilter";
import MobilePerfHeader from "../../../components/mobile/MobilePerfHeader";
import { useSearchScopeLabel } from "../../../hooks/useSearchScopeLabel";
import { fmtRangeLabel } from "../../../utils/dateLabels";
import { formatCurrency2, formatCurrencyCompact } from "../../../utils";
import { LENSES } from "../explorer/lensUtils";
import { useCashierSignals } from "../useCashierSignals";
import { CASHIERS_INFO } from "../cashiersInfo";

/**
 * The explorer's signal list on mobile.
 *
 * Same skeleton as the Loss Prevention list — navy header, a picker, then rows
 * — but Cashiers is not a graded page, so there are no severity chips and no
 * `SevBadge`. Each row instead carries `signal.spreadLabel`, which is the
 * explorer's own read of whether an exception is one person's behaviour or a
 * problem with the item or the lane.
 *
 * The badge text is deliberately whatever `spreadFor` produced rather than a
 * count assembled here: on the Cashier lens it counts distinct *items* ("7
 * items"), everywhere else distinct *cashiers*. Rebuilding it locally would
 * have been wrong on the lens users open most.
 */

interface Props {
  /** Exception types this store/week actually returned, from preflight. */
  saleTypes: string[];
  onExceptionChange: (saleType: string) => void;
  onSelectSignal: () => void;
  onSearch: () => void;
  start: string;
  end: string;
}

/** Neutral fills. Spread is a classification, not a verdict — `wide` is not
 *  worse than `single`, it is a different kind of problem — so it must not
 *  borrow the red/amber/green the graded pages use. */
const SPREAD_CLASS: Record<string, string> = {
  single: "bg-gray-100 text-content/85",
  narrow: "bg-gray-100 text-content/85",
  wide: "bg-[#1e2a4a]/10 text-[#1e2a4a]",
  unmapped: "bg-amber-100 text-amber-800",
};

const SignalListMobile = ({
  saleTypes,
  onExceptionChange,
  onSelectSignal,
  onSearch,
  start,
  end,
}: Props) => {
  const dispatch = useAppDispatch();
  const scopeLabel = useSearchScopeLabel();
  const { explorerLens, explorerFetchedException, explorerLoading } =
    useAppSelector((s) => s.cashier);
  const { signals, totals } = useCashierSignals();

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] bg-gray-50 overflow-hidden">
      <MobilePerfHeader
        pageName="Cashiers"
        dateRange={fmtRangeLabel(start, end)}
        storeName={scopeLabel}
        onSearch={onSearch}
        info={CASHIERS_INFO}
      />

      {/* The six figures desktop puts across the top, as six equal columns —
          the same divided strip every other mobile KPI row uses. Amount is
          compacted because a full "$1,219.70" cannot fit a sixth of a phone
          without dropping under the 10px floor. */}
      <div className="grid grid-cols-6 divide-x divide-gray-100 bg-custom-white border-b border-[#1e2a4a]/15 flex-shrink-0">
        {(
          [
            ["Lines", totals.exceptions.toLocaleString()],
            ["Trans", totals.transactions.toLocaleString()],
            ["Amount", formatCurrencyCompact(totals.amount)],
            ["Stores", totals.stores.toLocaleString()],
            ["Cshrs", totals.cashiers.toLocaleString()],
            ["Items", totals.items.toLocaleString()],
          ] as [string, string][]
        ).map(([label, value]) => (
          <div key={label} className="px-1.5 py-2 min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-wide text-content/85 truncate">
              {label}
            </div>
            <div className="text-[12px] font-semibold text-content mt-0.5 tabular-nums truncate">
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Lens as a tab strip, matching desktop. The exception is a header
          subtitle there, not a control, so it sits beside the tabs rather than
          pairing with them as a second dropdown — they are different axes and
          reading as a matched pair was misleading. */}
      <div className="flex items-center gap-2 px-3 py-2 bg-custom-white border-b border-[#1e2a4a]/15 flex-shrink-0">
        <div className="flex gap-1.5 flex-1 overflow-x-auto">
          {LENSES.map((l) => (
            <button
              key={l.key}
              onClick={() => dispatch(setExplorerLens(l.key))}
              className={`flex-shrink-0 text-[11px] font-medium px-3 py-1 rounded-full border transition-colors ${
                explorerLens === l.key
                  ? "bg-[#1e2a4a] text-custom-white border-[#1e2a4a]"
                  : "bg-custom-white text-content/85 border-gray-200"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <SelectFilter
          options={saleTypes.map((s) => ({ value: s, label: s }))}
          value={explorerFetchedException}
          onChange={onExceptionChange}
          placeholder="Exception"
          className="w-[104px] flex-shrink-0"
        />
      </div>

      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 border-b border-[#1e2a4a]/15 flex-shrink-0 text-[10px] font-medium uppercase tracking-wide text-content/85">
        <span>Signal</span>
        <span>Lines · trans · amount</span>
      </div>

      {/* pb-14 clears the fixed bottom tab bar. */}
      <div className="flex-1 overflow-y-auto pb-14">
        {explorerLoading ? (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
            Loading…
          </div>
        ) : signals.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
            No {explorerFetchedException || "exceptions"} for this week.
          </div>
        ) : (
          signals.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                dispatch(setExplorerSignalKey(s.key));
                onSelectSignal();
              }}
              className="w-full px-3 py-2.5 bg-custom-white border-b border-[#1e2a4a]/15 even:bg-row_stripe text-left active:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="flex-1 text-[12px] font-medium text-content truncate">
                  {s.label}
                </span>
                <span className="text-[11px] text-content/85 tabular-nums flex-shrink-0">
                  {s.count} · {s.transactions}
                </span>
                <span className="text-[12px] font-semibold text-content tabular-nums">
                  {formatCurrency2(s.amount)}
                </span>
                <ChevronRightIcon className="w-4 h-4 text-content/85 flex-shrink-0" />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex-1 text-[11px] text-content/85 truncate">
                  {s.sublabel}
                </span>
                <span
                  className={`text-[11px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${
                    SPREAD_CLASS[s.spread] ?? SPREAD_CLASS.single
                  }`}
                >
                  {s.spreadLabel}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default SignalListMobile;
