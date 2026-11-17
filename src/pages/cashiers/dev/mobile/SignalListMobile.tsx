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
import { LENSES } from "../utils";

// Components
import InfoModal from "../../../../components-dev/InfoModal";
import MobileSortChips from "../../../../components-dev/mobile/MobileSortChips";
import { TY_COLOR } from "../../../../components-dev/mobile/perf/perfColors";
import ExplorerScopeCard from "./components/ExplorerScopeCard";
import SignalRowMobile from "./components/SignalRowMobile";
import ExceptionPickerSheet from "./components/ExceptionPickerSheet";

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
  const [typePickerOpen, setTypePickerOpen] = useState<boolean>(false);
  /** The "?" help sheet's state stays here: nothing above this screen needs it. */
  const [infoOpen, setInfoOpen] = useState<boolean>(false);

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-bkg">
      {/* pb-14 clears the fixed bottom tab bar, which is outside document flow
          and would otherwise hide the last row of the list. */}
      <div className="flex-1 overflow-y-auto pb-14">
        <div className="flex flex-col gap-3 p-3">
          <ExplorerScopeCard
            exception={explorerFetchedException}
            scopeLabel={scopeLabel}
            when={fmtRangeLabel(start, end)}
            totals={totals}
            truncated={explorerTruncated}
            onSearch={onSearch}
            onInfo={() => setInfoOpen(true)}
            onTitleTap={
              saleTypes.length > 1 ? () => setTypePickerOpen(true) : undefined
            }
          />

          {/* ── the signals ───────────────────────────────────────── */}
          <section className="cc-card-phone">
            <MobileSortChips
              label="Lens"
              options={LENSES.map((l) => ({ key: l.key, label: l.label }))}
              value={explorerLens}
              onChange={(key) => dispatch(setExplorerLens(key))}
            />

            {explorerLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-[12.5px] text-content/95">
                <span
                  className="cc-spinner"
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
                <SignalRowMobile
                  key={s.key}
                  signal={s}
                  onOpen={() => dispatch(openExplorerSignal(s.key))}
                />
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
        <ExceptionPickerSheet
          saleTypes={saleTypes}
          current={explorerFetchedException}
          onPick={(t) => {
            onExceptionChange(t);
            setTypePickerOpen(false);
          }}
          onClose={() => setTypePickerOpen(false)}
        />
      )}
    </div>
  );
};

export default SignalListMobile;
