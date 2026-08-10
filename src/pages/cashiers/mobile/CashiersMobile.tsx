import { useState } from "react";
import { useAppSelector } from "../../../hooks";
import SearchCard from "../../../components/SearchCard";
import { useCashierExplorer } from "../useCashierExplorer";
import SignalListMobile from "./SignalListMobile";
import SignalTransactionsMobile from "./SignalTransactionsMobile";

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
  const {
    explorerLoading,
    explorerMessage,
    explorerSaleTypes,
    explorerAllRows,
  } = useAppSelector((s) => s.cashier);
  const { runPreflight, runExplore, scopeArgs } = useCashierExplorer();

  const [screen, setScreen] = useState<"signals" | "transactions">("signals");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notice, setNotice] = useState<string | undefined>(undefined);

  const { start, end } = scopeArgs();
  const hasData = explorerAllRows.length > 0;

  /** Both stages in one go: the user picked a scope and a week, and the
   *  exception they'd most likely want is derivable — making them choose it in
   *  a second step would be asking a question we can already answer. */
  const handleSearch = async () => {
    setNotice(undefined);
    const { types, fallback } = await runPreflight();
    if (types.length === 0) {
      setNotice("No exceptions were recorded for that store and week.");
      return;
    }
    await runExplore(fallback);
    setScreen("signals");
    setSearchOpen(false);
  };

  /** Changing the exception refetches — unlike LP, each one is its own
   *  `cashier_table` call, so this can't be a client-side filter. */
  const handleExceptionChange = async (saleType: string) => {
    setScreen("signals");
    await runExplore(saleType);
  };

  if (!hasData || searchOpen) {
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
            notice={notice}
            onBack={hasData ? () => setSearchOpen(false) : undefined}
          />
        </div>
      </div>
    );
  }

  if (screen === "transactions") {
    return <SignalTransactionsMobile onBack={() => setScreen("signals")} />;
  }

  return (
    <SignalListMobile
      saleTypes={explorerSaleTypes}
      onExceptionChange={handleExceptionChange}
      onSelectSignal={() => setScreen("transactions")}
      onSearch={() => setSearchOpen(true)}
      start={start}
      end={end}
    />
  );
};

export default CashiersMobile;
