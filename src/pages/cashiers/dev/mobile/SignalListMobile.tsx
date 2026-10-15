import { useState } from "react";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import {
  setExplorerLens,
  openExplorerSignal,
} from "../../../../features/dev/devCashiersSlice";
import BottomSheet from "../../../../components-dev/BottomSheet";
import InfoModal from "../../../../components-dev/InfoModal";
import MobileSortChips from "../../../../components-dev/mobile/MobileSortChips";
import PerfCardHeader from "../../../../components-dev/mobile/perf/PerfCardHeader";
import { TY_COLOR } from "../../../../components-dev/mobile/perf/perfColors";
import { useSearchScopeLabel } from "../../../../hooks/useSearchScopeLabel";
import { fmtRangeLabel } from "../../../../utils/dateLabels";
import { formatCurrency2 } from "../../../../utils";
import { LENSES } from "../explorer/lensUtils";
import { useCashierSignals } from "../useCashierSignals";

/**
 * The explorer's signal list on mobile.
 *
 * Wears the mobile Performance chrome: no navy page header, a scope card that
 * names what is being read and carries the figures, then the signals as a
 * carded list under it. Cashiers is not a graded page, so there are no
 * severity chips and no `SevBadge`; each row instead carries
 * `signal.spreadLabel`, the explorer's own read of whether an exception is one
 * person's behaviour or a problem with the item or the lane.
 *
 * NO COMPARISON BARS, and that is a fact about the data rather than a styling
 * choice. Every other mobile Performance card draws a pair because its page
 * fetches a second period — Loss Prevention asks for the prior fortnight
 * alongside the week. `useCashierExplorer` fetches one window, so there is
 * nothing to pair against and a single bar would be a chart of one number.
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
  onSearch: () => void;
  start: string;
  end: string;
}

/**
 * Neutral fills. Spread is a classification, not a verdict — `wide` is not
 * worse than `single`, it is a different kind of problem — so it must not
 * borrow the red/amber/green the graded pages use.
 *
 * `unmapped` used to be amber-100/800, which made it the one coloured thing
 * on the page and read as a warning about the cashier rather than a note that
 * the item is missing from the map. Navy is the page's own emphasis and says
 * "look here" without grading anything.
 */
const SPREAD_CLASS: Record<string, string> = {
  single: "bg-gray-100 text-content border-brand_line",
  narrow: "bg-gray-100 text-content border-brand_line",
  wide: "bg-brand_navy/10 text-brand_navy border-brand_navy/20",
  unmapped: "bg-brand_navy/10 text-brand_navy border-brand_navy/20",
};

const SignalListMobile = ({
  saleTypes,
  onExceptionChange,
  onSearch,
  start,
  end,
}: Props) => {
  const dispatch = useAppDispatch();
  const scopeLabel = useSearchScopeLabel();
  const {
    explorerLens,
    explorerFetchedException,
    explorerLoading,
    explorerTruncated,
  } = useAppSelector((s) => s.dev.cashier);
  const { signals, totals } = useCashierSignals();
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  /** The "?" used to belong to MobilePerfHeader, which owned its own modal.
   *  Kept local rather than threaded up through CashiersMobile: nothing above
   *  this screen has any reason to know the help sheet is open. */
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-bkg">
      {/* pb-14 clears the fixed bottom tab bar, which is outside document flow
          and would otherwise hide the last row of the list. */}
      <div className="flex-1 overflow-y-auto pb-14">
        <div className="flex flex-col gap-3 p-3">
          {/* ── the scope ─────────────────────────────────────────── */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
            {/* The exception is what the card is ABOUT, so it is the title and
                the title opens the picker — the same control Loss Prevention
                gives its event type. It used to be a SelectFilter sitting
                beside the lens chips, which read as a matched pair with them;
                they are different axes, and pairing them said otherwise. */}
            <PerfCardHeader
              title={explorerFetchedException || "All exceptions"}
              label={scopeLabel}
              when={fmtRangeLabel(start, end)}
              onSearch={onSearch}
              onInfo={() => setInfoOpen(true)}
              onTitleTap={
                saleTypes.length > 1 ? () => setTypePickerOpen(true) : undefined
              }
            />

            <div className="px-4 pb-3 pt-2.5">
              <div className="text-[12px] text-content/95">
                Exception lines this week
              </div>
              <div className="font-display text-[30px] font-extrabold leading-none tracking-tight text-content">
                {totals.exceptions.toLocaleString()}
              </div>

              {/* Four tiles rather than the six-column band this replaced.
                  Amount was compacted to "$1.2k" there purely because a sixth
                  of a phone could not hold "$1,219.70"; given half a card it
                  can say what it is. Lines moved up to the headline and
                  Stores is in the scope line above, so nothing is lost. */}
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-brand_line pt-2.5">
                {(
                  [
                    ["Transactions", totals.transactions.toLocaleString()],
                    ["Amount", formatCurrency2(totals.amount)],
                    ["Cashiers", totals.cashiers.toLocaleString()],
                    ["Items", totals.items.toLocaleString()],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="flex flex-col items-center text-center">
                    <span className="font-mono text-[9.5px] uppercase tracking-wider text-content/95">
                      {k}
                    </span>
                    <span className="font-display text-[15px] font-bold text-content">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* The receipt fetch is capped, so past it every figure above runs
                low. Desktop says so in its header; there is no room for that
                here, so it gets its own line rather than being left out. The
                same note treatment the Performance cards use for a short
                comparison — it qualifies figures, it does not grade them. */}
            {explorerTruncated > 0 && (
              <p className="border-t border-brand_line bg-gray-100 px-4 py-2 text-[11.5px] font-semibold text-content">
                Capped: {explorerTruncated.toLocaleString()} more{" "}
                {explorerTruncated === 1 ? "transaction" : "transactions"} not
                loaded, so these totals run low.
              </p>
            )}
          </section>

          {/* ── the signals ───────────────────────────────────────── */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
            <MobileSortChips
              label="Lens"
              options={LENSES.map((l) => ({ key: l.key, label: l.label }))}
              value={explorerLens}
              onChange={(key) => dispatch(setExplorerLens(key))}
            />

            {explorerLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-[12.5px] text-content/95">
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200"
                  style={{ borderTopColor: TY_COLOR }}
                />
                Loading signals...
              </div>
            ) : signals.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12.5px] text-content/95">
                No {explorerFetchedException || "exceptions"} for this week.
              </div>
            ) : (
              signals.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => dispatch(openExplorerSignal(s.key))}
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
                  {/* The counts carry their own words now. They used to be
                      "84 · 61" under a column heading in a band above the
                      list — which only reads if that band is still on screen,
                      and it scrolls away on the second row. */}
                  <div className="mt-1 flex items-center gap-2">
                    <span className="min-w-0 truncate font-mono text-[12px] text-content/95">
                      {s.count.toLocaleString()} lines ·{" "}
                      {s.transactions.toLocaleString()} trans
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
              ))
            )}
          </section>
        </div>
      </div>

      <InfoModal
        page="cashiers"
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
      />

      {typePickerOpen && (
        <BottomSheet onClose={() => setTypePickerOpen(false)}>
          <div className="px-4 pb-6 pt-1">
            <h2 className="font-display text-[15px] font-bold text-content">
              Exception
            </h2>
            <p className="pb-2 pt-0.5 text-[12px] text-content/95">
              Scopes the whole screen, including the signals below.
            </p>
            {saleTypes.map((t) => (
              <button
                key={t}
                type="button"
                aria-current={t === explorerFetchedException ? "true" : undefined}
                onClick={() => {
                  onExceptionChange(t);
                  setTypePickerOpen(false);
                }}
                className={`flex w-full items-baseline gap-3 border-t border-brand_line px-1 py-3 text-left first:border-t-0 ${
                  t === explorerFetchedException
                    ? "bg-row_selected"
                    : "active:bg-bkg"
                }`}
              >
                <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
                  {t}
                </span>
              </button>
            ))}
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

export default SignalListMobile;
