import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import SearchCard from "../../../../components-dev/SearchCard";
import {
  closeExplorerSignal,
  setExplorerMobileSearchOpen,
  setExplorerNotice,
} from "../../../../features/dev/devCashiersSlice";
import { useCashierSignals } from "../useCashierSignals";
import { useCashierExplorer, type ExplorerOutcome } from "../useCashierExplorer";
import SignalListMobile from "./SignalListMobile";
import SignalTransactionsMobile from "./SignalTransactionsMobile";

const NOTICES: Partial<Record<ExplorerOutcome, string>> = {
  empty:
    "Nothing found for that search — try a different store, group, or week.",
  error: "Couldn't load that search. Check your connection and try again.",
};

/**
 * Cashiers on mobile — the signal explorer, not the old card drill-down.
 *
 * The previous version was built before the desktop was rebuilt as an explorer,
 * and answered a different question ("which store, then which cashier?") off a
 * different pipeline (`getStoreCards`/`getCashierCards`). This runs the same
 * two-stage fetch the desktop does, via `useCashierExplorer`, and derives the
 * same signals via `useCashierSignals` — so the two views can't disagree.
 *
 * Walkthrough, mirroring Loss Prevention but with no severity grading, because
 * nothing here is graded:
 *
 *   search (scope + week) → preflight picks the exception
 *     → signal list (lens picker)
 *       → that signal's transactions
 *         → receipt sheet
 */
const CashiersMobile = () => {
  const dispatch = useAppDispatch();
  const {
    explorerLoading,
    explorerMessage,
    explorerSaleTypes,
    explorerAllRows,
    explorerNotice,
    explorerMobileScreen,
    explorerMobileSearchOpen,
    explorerSignalKey,
  } = useAppSelector((s) => s.dev.cashier);
  const { runPreflight, runExplore, scopeArgs } = useCashierExplorer();
  const { signals } = useCashierSignals();

  /** The transactions screen needs its signal. Coming back to the page after
   *  the rows changed underneath it — desktop switched lens, or reloaded —
   *  would otherwise render nothing at all; send it back to the list. */
  const signalGone =
    explorerMobileScreen === "transactions" &&
    !signals.some((s) => s.key === explorerSignalKey);
  useEffect(() => {
    if (signalGone) dispatch(closeExplorerSignal());
  }, [signalGone]);

  const { start, end } = scopeArgs();
  const hasData = explorerAllRows.length > 0;

  /** Anything short of rows lands back on the search card, so it has to say
   *  why — a card that just reappears reads as the search never having run. */
  const noticeFor = (outcome: ExplorerOutcome) =>
    dispatch(setExplorerNotice(NOTICES[outcome] ?? ""));

  /** Both stages in one go: the user picked a scope and a week, and the
   *  exception they'd most likely want is derivable — making them choose it in
   *  a second step would be asking a question we can already answer. */
  const handleSearch = async () => {
    dispatch(setExplorerNotice(""));
    const preflight = await runPreflight();
    // A superseded run applied nothing, and the run that replaced it owns the
    // screen from here.
    if (preflight.outcome === "stale") return;
    if (preflight.outcome === "empty") {
      dispatch(
        setExplorerNotice("No exceptions were recorded for that search and week."),
      );
      return;
    }
    if (preflight.outcome === "error") {
      noticeFor("error");
      return;
    }
    const outcome = await runExplore(preflight.fallback);
    if (outcome === "stale") return;
    noticeFor(outcome);
    // Loaded rows reset the screen and close the search card in the slice
    // (setExplorerRows), so there's nothing left to do here.
  };

  /** Changing the exception refetches — unlike LP, each one is its own
   *  `cashier_table` call, so this can't be a client-side filter. */
  const handleExceptionChange = async (saleType: string) => {
    dispatch(closeExplorerSignal());
    const outcome = await runExplore(saleType);
    if (outcome !== "stale") noticeFor(outcome);
  };

  if (!hasData || explorerMobileSearchOpen) {
    return (
      <div className="h-[calc(100dvh-3rem)] overflow-y-auto">
        <div className="mx-4 pt-4 pb-2">
          <SearchCard
            top
            title="Cashiers"
            description="Pick a store or group and a week."
            buttonLabel="Find exceptions"
            singleDate
            onSearch={handleSearch}
            loading={explorerLoading}
            loadingMessage={explorerMessage || "Finding exceptions..."}
            notice={explorerNotice || undefined}
            onBack={
              hasData
                ? () => dispatch(setExplorerMobileSearchOpen(false))
                : undefined
            }
          />
        </div>
      </div>
    );
  }

  if (explorerMobileScreen === "transactions" && !signalGone) {
    return (
      <SignalTransactionsMobile onBack={() => dispatch(closeExplorerSignal())} />
    );
  }

  return (
    <SignalListMobile
      saleTypes={explorerSaleTypes}
      onExceptionChange={handleExceptionChange}
      onSearch={() => dispatch(setExplorerMobileSearchOpen(true))}
      start={start}
      end={end}
    />
  );
};

export default CashiersMobile;
