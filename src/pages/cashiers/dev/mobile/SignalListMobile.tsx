// Hooks
import { useState } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useSearchScopeLabel } from "../../../../hooks/useSearchScopeLabel";
import { useCashierSignals, useCashiersState } from "../hooks";

// Redux
import {
  setExplorerLens,
  openExplorerSignal,
} from "../../../../features/dev/devCashiersSlice";

// Utils
import { fmtRangeLabel } from "../../../../utils/dateLabels";
import { formatCurrency2 } from "../../../../utils";
import { LENSES } from "../utils";
import { SPREAD_CLASS } from "./utils";

// Components
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import BottomSheet from "../../../../components-dev/BottomSheet";
import InfoModal from "../../../../components-dev/InfoModal";
import MobileSortChips from "../../../../components-dev/mobile/MobileSortChips";
import PerfCardHeader from "../../../../components-dev/mobile/perf/PerfCardHeader";
import { TY_COLOR } from "../../../../components-dev/mobile/perf/perfColors";

interface SignalListMobileProps {
  /** Exception types this store/week actually returned, from preflight. */
  saleTypes: string[];
  onExceptionChange: (saleType: string) => void;
  onSearch: () => void;
  start: string;
  end: string;
}

/**
 * The explorer's signal list on mobile, in the Performance chrome. Not graded:
 * each row carries `signal.spreadLabel` instead of severity. No comparison
 * bars: `useCashierExplorer` fetches one window. The badge is `spreadFor`'s
 * own text (items on the Cashier lens, cashiers elsewhere).
 */
const SignalListMobile = ({
  saleTypes,
  onExceptionChange,
  onSearch,
  start,
  end,
}: SignalListMobileProps) => {
  const dispatch = useAppDispatch();
  const scopeLabel = useSearchScopeLabel();
  const {
    explorerLens,
    explorerFetchedException,
    explorerLoading,
    explorerTruncated,
  } = useCashiersState();
  const { signals, totals } = useCashierSignals();
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  /** The "?" help sheet's state stays here: nothing above this screen needs it. */
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-bkg">
      {/* pb-14 clears the fixed bottom tab bar, which is outside document flow
          and would otherwise hide the last row of the list. */}
      <div className="flex-1 overflow-y-auto pb-14">
        <div className="flex flex-col gap-3 p-3">
          {/* ── the scope ─────────────────────────────────────────── */}
          <section className="overflow-hidden rounded-2xl border border-line_field bg-custom-white shadow-md">
            {/* The exception is what the card is about, so it is the title
                and opens the picker, as Loss Prevention's event type does. */}
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

              {/* Four tiles: Amount gets room to print in full; Lines is in
                  the headline and Stores in the scope line. */}
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
                    <span className="cc-caps-mono text-[9.5px]">
                      {k}
                    </span>
                    <span className="font-display text-[15px] font-bold text-content">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* The receipt fetch is capped, so past it the figures run low;
                said on its own line. */}
            {explorerTruncated > 0 && (
              <p className="border-t border-brand_line bg-fill_muted px-4 py-2 text-[11.5px] font-semibold text-content">
                Capped: {explorerTruncated.toLocaleString()} more{" "}
                {explorerTruncated === 1 ? "transaction" : "transactions"} not
                loaded, so these totals run low.
              </p>
            )}
          </section>

          {/* ── the signals ───────────────────────────────────────── */}
          <section className="overflow-hidden rounded-2xl border border-line_field bg-custom-white shadow-md">
            <MobileSortChips
              label="Lens"
              options={LENSES.map((l) => ({ key: l.key, label: l.label }))}
              value={explorerLens}
              onChange={(key) => dispatch(setExplorerLens(key))}
            />

            {explorerLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-[12.5px] text-content/95">
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line_field"
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
                  {/* The counts carry their own words. */}
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
