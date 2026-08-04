import { useMemo, useState } from "react";
import CashiersExportModal from "./explorer/CashiersExportModal";
import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { useCashierCtx } from ".";
import { useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { formatGoliathDate, formatCurrency2, getStoreName } from "../../utils";
import {
  getSaleTypes,
  getCashierTable,
  getTransactionList,
} from "../../api/lossPrevention";
import type { JsonError, TransactionListItem } from "../../interfaces";
import type { ExplorerLens } from "../../features/cashiersSlice";
import {
  setExplorerSaleTypes,
  setExplorerException,
  setExplorerLens,
  setExplorerSignalKey,
  setExplorerLoading,
  setExplorerMessage,
  setExplorerScopeLabel,
  setExplorerRows,
  setSelectedSaleType,
} from "../../features/cashiersSlice";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import ExplorerSearch from "./explorer/ExplorerSearch";
import LensPanel from "./explorer/LensPanel";
import SignalDetail from "./explorer/SignalDetail";
import {
  buildTransactionLengths,
  buildSignals,
  buildTotals,
} from "./explorer/lensUtils";
import CashiersMobile from "./mobile/CashiersMobile";

// LP grades against "the prior 2 weeks" (see lossPrevention/lpInfo.ts), so the
// explorer uses the same ceiling rather than inventing a second notion of
// "recent" — and it keeps the group-scope fetch below bounded.
const MAX_RANGE_DAYS = 14;
// A group query can span hundreds of stores. Past this many transactions the
// receipt fetch stops being interactive, so it's capped and the user is told.
const MAX_TRANSACTIONS = 1500;

const dayDiff = (start: string, end: string) => {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round(Math.abs(b - a) / 86400000) + 1;
};

const Cashiers = () => {
  const toast = useToast();
  const ctx = useCashierCtx();
  const assignedStores = useAppSelector((state) => state.user.assignedStores);
  const selectedGroup = useAppSelector((state) => state.search.selectedGroup);
  const {
    explorerSaleTypes,
    explorerException,
    explorerFetchedException,
    explorerAllRows,
    explorerLens,
    explorerSignalKey,
    explorerLoading,
    explorerMessage,
    explorerScopeLabel,
    explorerSearched,
  } = useAppSelector((state) => state.cashier);

  const [searchOpen, setSearchOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [signalSearch, setSignalSearch] = useState("");
  const [truncated, setTruncated] = useState(0);
  // Distinguishes "preflight ran and found nothing" from "preflight hasn't run
  // yet" — both leave explorerSaleTypes empty.
  const [preflightRan, setPreflightRan] = useState(false);

  const rangeDays = dayDiff(ctx.startDate, ctx.endDate);

  const scopeArgs = () => ({
    start: formatGoliathDate(ctx.startDate),
    end: formatGoliathDate(ctx.endDate),
    useGroups: ctx.type === "Group" ? 1 : 0,
    singleStore: ctx.type === "Store" ? 1 : 0,
    searchValue: ctx.type === "Group" ? ctx.lastGroup : ctx.lastStore,
  });

  const scopeLabel = () =>
    ctx.type === "Group"
      ? selectedGroup?.group_name || "Group"
      : getStoreName(assignedStores, ctx.lastStore, `Store ${ctx.lastStore}`);

  // Stage one — the exception list has to come from preflight because which
  // exceptions even occurred depends on the scope and dates just chosen.
  const runPreflight = () => {
    const { start, end, useGroups, searchValue, singleStore } = scopeArgs();
    ctx.dispatch(setExplorerLoading(true));
    ctx.dispatch(setExplorerMessage("Finding exceptions…"));
    ctx.dispatch(setExplorerSaleTypes([]));
    ctx.dispatch(setExplorerException(""));

    getSaleTypes(
      ctx.url,
      ctx.token,
      start,
      end,
      useGroups,
      searchValue,
      singleStore,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          // Tender isn't an exception — LP filters it out of its own list too.
          const types = (j.sale_types as { sale_type: string }[])
            .map((t) => t.sale_type)
            .filter((t) => t !== "Tender");
          ctx.dispatch(setExplorerSaleTypes(types));
          setPreflightRan(true);
        } else {
          toast.warn(j.msg);
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching exceptions: " + err.message),
      )
      .finally(() => {
        ctx.dispatch(setExplorerLoading(false));
        ctx.dispatch(setExplorerMessage(""));
      });
  };

  const fetchAllPages = async <T,>(
    firstPage: { total_pages?: number },
    rows: T[],
    fetchPage: (page: number) => Promise<T[]>,
  ) => {
    const total = firstPage.total_pages ?? 1;
    if (total <= 1) return rows;
    const rest = await Promise.all(
      Array.from({ length: total - 1 }, (_, i) => fetchPage(i + 2)),
    );
    return [...rows, ...rest.flat()];
  };

  // Stage two — walk every page of cashier_table for the chosen exception,
  // then pull the full receipts for those transactions. transaction_list returns
  // every line of a receipt, not just the exception lines, which is what makes
  // transaction position ("line 12 of 12") and the inline receipt possible.
  const runExplore = async () => {
    const { start, end, useGroups, searchValue, singleStore } = scopeArgs();
    const exception = explorerException;
    setTruncated(0);
    ctx.dispatch(setExplorerLoading(true));
    ctx.dispatch(setExplorerMessage("Loading transactions…"));
    // The shared Transaction receipt component reads selectedSaleType off the
    // slice to decide how it totals voids vs refunds, so it has to be set here
    // for the drill-down receipts to add up correctly.
    ctx.dispatch(setSelectedSaleType(exception));
    setSearchOpen(false);

    try {
      const firstResp = await getCashierTable(
        ctx.url,
        ctx.token,
        start,
        end,
        useGroups,
        searchValue,
        singleStore,
        [exception],
        1,
      );
      const first = firstResp.data;
      if (first.error !== 0) {
        toast.warn(first.msg || "Could not load transactions");
        ctx.dispatch(setExplorerRows({ rows: [], exception }));
        return;
      }

      const transactions = await fetchAllPages(
        first,
        first.transactions as { sale_id: string }[],
        (page) =>
          getCashierTable(
            ctx.url,
            ctx.token,
            start,
            end,
            useGroups,
            searchValue,
            singleStore,
            [exception],
            page,
          ).then((r) => (r.data.error === 0 ? r.data.transactions : [])),
      );

      let saleIds = Array.from(new Set(transactions.map((t) => t.sale_id)));
      if (saleIds.length > MAX_TRANSACTIONS) {
        setTruncated(saleIds.length - MAX_TRANSACTIONS);
        saleIds = saleIds.slice(0, MAX_TRANSACTIONS);
      }
      if (saleIds.length === 0) {
        ctx.dispatch(setExplorerRows({ rows: [], exception }));
        return;
      }

      ctx.dispatch(setExplorerMessage("Loading receipts…"));
      const listResp = await getTransactionList(
        ctx.url,
        ctx.token,
        saleIds,
        1,
        exception,
      );
      const list = listResp.data;
      if (list.error !== 0) {
        toast.warn(list.msg || "Could not load transactions");
        ctx.dispatch(setExplorerRows({ rows: [], exception }));
        return;
      }

      const rows = await fetchAllPages(
        list,
        list.transactions as TransactionListItem[],
        (page) =>
          getTransactionList(ctx.url, ctx.token, saleIds, page, exception).then(
            (r) => (r.data.error === 0 ? r.data.transactions : []),
          ),
      );

      ctx.dispatch(setExplorerScopeLabel(scopeLabel()));
      ctx.dispatch(setExplorerRows({ rows, exception }));
    } catch (err) {
      toast.error("Error loading transactions: " + (err as JsonError).message);
      ctx.dispatch(setExplorerRows({ rows: [], exception }));
    } finally {
      ctx.dispatch(setExplorerLoading(false));
      ctx.dispatch(setExplorerMessage(""));
    }
  };

  const transactionLengths = useMemo(
    () => buildTransactionLengths(explorerAllRows),
    [explorerAllRows],
  );

  // transaction_list hands back whole receipts, so the signal maths has to run
  // on just the lines matching the exception the user picked.
  const exceptionRows = useMemo(
    () =>
      explorerAllRows.filter((r) => r.sale_type === explorerFetchedException),
    [explorerAllRows, explorerFetchedException],
  );

  const totals = useMemo(() => buildTotals(exceptionRows), [exceptionRows]);

  const signals = useMemo(
    () =>
      buildSignals(exceptionRows, transactionLengths, explorerLens, (id, fb) =>
        getStoreName(assignedStores, id, fb),
      ),
    [exceptionRows, transactionLengths, explorerLens, assignedStores],
  );

  const visibleSignals = useMemo(() => {
    if (!signalSearch.trim()) return signals;
    const q = signalSearch.toLowerCase();
    return signals.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.sublabel.toLowerCase().includes(q),
    );
  }, [signals, signalSearch]);

  const selected = signals.find((s) => s.key === explorerSignalKey) ?? null;

  if (ctx.isMobile) return <CashiersMobile />;

  // Stay on the entry card until an explore has actually returned — both
  // preflight and the first explore report progress through the card's own
  // button rather than swapping to an empty shell.
  if (!explorerSearched) {
    return (
      <ExplorerSearch
        saleTypes={explorerSaleTypes}
        exception={explorerException}
        onExceptionChange={(v) => ctx.dispatch(setExplorerException(v))}
        onFindExceptions={runPreflight}
        onExplore={runExplore}
        loading={explorerLoading}
        message={explorerMessage}
        rangeDays={rangeDays}
        maxRangeDays={MAX_RANGE_DAYS}
        noExceptionsFound={preflightRan && explorerSaleTypes.length === 0}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4">
      <div className="h-full flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white">
        <div className="bg-[#1e2a4a] px-3 py-2 flex-shrink-0 flex items-center gap-3">
          <span className="text-custom-white font-semibold text-[13px] flex-shrink-0">
            Cashiers
          </span>
          <span className="text-custom-white/85 text-[12px] truncate">
            {explorerScopeLabel} · {ctx.startDate} – {ctx.endDate} ·{" "}
            {explorerFetchedException}
          </span>
          <div className="flex-1" />
          {truncated > 0 && (
            <span className="text-amber-200 text-[10.5px] flex-shrink-0">
              capped — {truncated} older transactions not loaded
            </span>
          )}
          <button
            onClick={() => setSearchOpen(true)}
            title="New search"
            className="w-[20px] h-[20px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/60 hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setExportOpen(true)}
            title="Export CSV"
            className="w-[20px] h-[20px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/60 hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-6 border-b border-gray-100 flex-shrink-0">
          {[
            {
              label: "Exception lines",
              value: totals.exceptions.toLocaleString(),
            },
            {
              label: "Transactions",
              value: totals.transactions.toLocaleString(),
            },
            { label: "Amount", value: formatCurrency2(totals.amount) },
            { label: "Stores", value: totals.stores.toLocaleString() },
            { label: "Cashiers", value: totals.cashiers.toLocaleString() },
            { label: "Items", value: totals.items.toLocaleString() },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="px-3 py-2 border-r border-gray-100 last:border-r-0"
            >
              <div className="text-[11px] text-content/85">{kpi.label}</div>
              <div className="text-[16px] font-medium text-content">
                {kpi.value}
              </div>
            </div>
          ))}
        </div>

        {explorerLoading ? (
          <div className="flex-1 relative">
            <LoadingIndicator message={explorerMessage || "Loading…"} />
          </div>
        ) : exceptionRows.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[13px] font-medium text-content/60">
            No {explorerFetchedException.toLowerCase()} transactions in this
            range
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex">
            <LensPanel
              lens={explorerLens}
              onLensChange={(l: ExplorerLens) => {
                ctx.dispatch(setExplorerLens(l));
                setSignalSearch("");
              }}
              signals={visibleSignals}
              selectedKey={explorerSignalKey}
              onSelect={(key) => ctx.dispatch(setExplorerSignalKey(key))}
              search={signalSearch}
              onSearchChange={setSignalSearch}
            />
            {selected ? (
              // Keyed so picking a different signal remounts the panel and
              // drops any open receipt — otherwise the receipt view survives
              // the switch and shows a transaction from the previous signal.
              <SignalDetail
                key={`${explorerLens}-${selected.key}`}
                signal={selected}
                lens={explorerLens}
                allRows={explorerAllRows}
                transactionLengths={transactionLengths}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-[13px] font-medium text-content/60 px-6 text-center">
                Select a row to see the transactions behind it
              </div>
            )}
          </div>
        )}
      </div>

      {exportOpen && (
        <CashiersExportModal
          onClose={() => setExportOpen(false)}
          scopeLabel={explorerScopeLabel}
          exception={explorerFetchedException}
          dateRange={`${ctx.startDate} – ${ctx.endDate}`}
          lens={explorerLens}
          signals={visibleSignals}
          exceptionRows={exceptionRows}
          transactionLengths={transactionLengths}
        />
      )}

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
          <ExplorerSearch
            saleTypes={explorerSaleTypes}
            exception={explorerException}
            onExceptionChange={(v) => ctx.dispatch(setExplorerException(v))}
            onFindExceptions={runPreflight}
            onExplore={runExplore}
            loading={explorerLoading}
            message={explorerMessage}
            rangeDays={rangeDays}
            maxRangeDays={MAX_RANGE_DAYS}
            noExceptionsFound={preflightRan && explorerSaleTypes.length === 0}
            onBack={() => setSearchOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export default Cashiers;
