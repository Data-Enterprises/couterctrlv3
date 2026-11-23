// Hooks
import { useMemo, useState } from "react";
import { useCashierCtx, useCashierSignals, useDesktopExplorer } from "./hooks";

// Redux
import {
  setExplorerException,
  setExplorerLens,
  setExplorerSignalKey,
  type ExplorerLens,
} from "../../../features/dev/devCashiersSlice";

// Utils
import { dayDiff, MAX_RANGE_DAYS } from "./utils";

// Components
import LoadingIndicator from "../../../components-dev/loading/LoadingIndicator";
import CashiersExportModal from "./exportModal/CashiersExportModal";
import CashiersHeader from "./components/CashiersHeader";
import ExplorerKpiStrip from "./components/ExplorerKpiStrip";
import ExplorerSearch from "./components/ExplorerSearch";
import LensPanel from "./components/LensPanel";
import SignalDetail from "./components/SignalDetail";
import CashiersMobile from "./mobile/CashiersMobile";

/** The Cashiers page: the exception explorer entry card, then the loaded exceptions with a KPI strip,
 *  a lens list of signals (by cashier, store, item and so on) and the transactions behind the picked one, with CSV export. */
const Cashiers = () => {
  const ctx = useCashierCtx();
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [exportOpen, setExportOpen] = useState<boolean>(false);
  const [signalSearch, setSignalSearch] = useState<string>("");
  const { runPreflight, runExplore, preflightRan, saleTypes } =
    useDesktopExplorer(ctx);
  const { exceptionRows, transactionLengths, totals, signals } =
    useCashierSignals();

  const visibleSignals = useMemo(() => {
    if (!signalSearch.trim()) return signals;
    const q = signalSearch.toLowerCase();
    return signals.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.sublabel.toLowerCase().includes(q),
    );
  }, [signals, signalSearch]);

  const rangeDays = dayDiff(ctx.startDate, ctx.endDate);
  const selected = signals.find((s) => s.key === ctx.explorerSignalKey) ?? null;

  // The entry card and the re-search pop-up are the same card.
  const searchProps = {
    saleTypes,
    exception: ctx.explorerException,
    onExceptionChange: (v: string) => ctx.dispatch(setExplorerException(v)),
    onFindExceptions: runPreflight,
    onExplore: () => {
      setSearchOpen(false);
      runExplore();
    },
    loading: ctx.explorerLoading,
    message: ctx.explorerMessage,
    rangeDays,
    maxRangeDays: MAX_RANGE_DAYS,
    noExceptionsFound: preflightRan && saleTypes.length === 0,
  };

  if (ctx.isMobile) return <CashiersMobile />;

  // Stay on the entry card until an explore has returned; progress shows on
  // the card's own button.
  if (!ctx.explorerSearched) return <ExplorerSearch {...searchProps} />;

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4">
      <div className="h-full cc-panel shadow-lg">
        <CashiersHeader
          scopeLabel={ctx.explorerScopeLabel}
          startDate={ctx.startDate}
          endDate={ctx.endDate}
          exception={ctx.explorerFetchedException}
          truncated={ctx.explorerTruncated}
          onBack={() => setSearchOpen(true)}
          onExport={() => setExportOpen(true)}
        />

        <ExplorerKpiStrip totals={totals} />

        {ctx.explorerLoading ? (
          <div className="flex-1 relative">
            <LoadingIndicator message={ctx.explorerMessage || "Loading…"} />
          </div>
        ) : exceptionRows.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[13px] font-medium text-content/95">
            No {ctx.explorerFetchedException.toLowerCase()} transactions in this
            range
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex">
            <LensPanel
              lens={ctx.explorerLens}
              onLensChange={(l: ExplorerLens) => {
                ctx.dispatch(setExplorerLens(l));
                setSignalSearch("");
              }}
              signals={visibleSignals}
              selectedKey={ctx.explorerSignalKey}
              onSelect={(key) => ctx.dispatch(setExplorerSignalKey(key))}
              search={signalSearch}
              onSearchChange={setSignalSearch}
            />
            {selected ? (
              // Keyed so picking another signal remounts the panel and drops
              // any open receipt from the previous signal.
              <SignalDetail
                key={`${ctx.explorerLens}-${selected.key}`}
                signal={selected}
                lens={ctx.explorerLens}
                allRows={ctx.explorerAllRows}
                transactionLengths={transactionLengths}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-[13px] font-medium text-content/95 px-6 text-center">
                Select a row to see the transactions behind it
              </div>
            )}
          </div>
        )}
      </div>

      {exportOpen && (
        <CashiersExportModal
          onClose={() => setExportOpen(false)}
          scopeLabel={ctx.explorerScopeLabel}
          exception={ctx.explorerFetchedException}
          dateRange={`${ctx.startDate} – ${ctx.endDate}`}
          lens={ctx.explorerLens}
          signals={visibleSignals}
          exceptionRows={exceptionRows}
          transactionLengths={transactionLengths}
        />
      )}

      {searchOpen && (
        <div className="cc-modal-backdrop z-50">
          <ExplorerSearch
            {...searchProps}
            onBack={() => setSearchOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export default Cashiers;
