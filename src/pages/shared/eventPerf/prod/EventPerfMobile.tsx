import {
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useStore } from "react-redux";
import {
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import type { RootState } from "../../../../store";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import SearchCard from "../../../../components/SearchCard";
import BottomSheet from "../../../../components/BottomSheet";
import type { InfoGlossaryEntry } from "../../../../components/InfoPopover";
import MobileInfoSheet from "../../../../components/mobile/MobileInfoSheet";
import MobileSortChips, {
  type SortOption,
} from "../../../../components/mobile/MobileSortChips";
import { formatCurrency2, formatDateSimple } from "../../../../utils";
import type { JsonError } from "../../../../interfaces";
import {
  beginEventLoad,
  claimEventPerf,
  clearEventCashier,
  closeReceipt,
  failEventLoad,
  failReceipt,
  openReceipt,
  GROUP_KEY,
  openEventDetail,
  ROWS_PER_PAGE,
  selectEventCashier,
  setEventData,
  setEventInfoOpen,
  setEventLens,
  setEventLoadProgress,
  setEventQuery,
  setEventSearchOpen,
  setEventSort,
  setEventView,
  setReceiptLines,
  showMoreEvents,
  toggleEventCard,
  toggleEventDay,
  toggleEventGroupDay,
  type EventReceiptState,
  type EventRow,
  type EventSort,
  type EventView,
} from "../../../../features/eventPerfSlice";
import {
  buildEventDays,
  buildGroupRows,
  buildLensBusiest,
  buildLensCards,
  buildReceipts,
  buildTotals,
  defaultEventSort,
  eventDirOf,
  receiptLabel,
  type EventReceipt,
  type EventScope,
  type EventTotals,
} from "./eventPerfData";
import type { ReceiptLine } from "./receiptTypes";
import PairedBars from "../../../../components/mobile/perf/PairedBars";
import PerfDayChart from "../../../../components/mobile/perf/PerfDayChart";
import PerfCardHeader from "../../../../components/mobile/perf/PerfCardHeader";
import { TY_COLOR } from "../../../../components/mobile/perf/perfColors";
import MobilePerfCard from "../../../../components/mobile/MobilePerfCard";
import MobilePerfDetail from "../../../../components/mobile/MobilePerfDetail";
import EventStoreReport from "./EventStoreReport";
import EventDrillList from "./EventDrillList";

export interface EventFetchResult {
  rows: EventRow[];
  baseline: EventRow[];
  lenses: string[];
}

interface Props {
  /** Which page this is. One slice serves both, so the shell has to be able to
   *  tell whose data it is holding — see `owner` on the slice. */
  pageKey: string;
  /** The searched week, ISO. Both pages derive it through `useApiContext`,
   *  which is also where the comparison window comes from — keeping that
   *  arithmetic in one place is why it is not repeated here. */
  start: string;
  end: string;
  title: string;
  /** Entry-card copy. */
  description: string;
  buttonLabel: string;
  /** The first carousel card — every event type at once. Names the LENS
   *  ("All coupons"), never the scope: the line under it already says which
   *  stores are in view, and the two saying different things is what made the
   *  card read as contradicting itself. */
  allLabel: string;
  /**
   * Which figure leads. LP asks how often, so it leads with a count; Coupon
   * Sales asks how much, so it leads with dollars. Everything downstream —
   * hero, bars, row ordering — follows this one switch.
   */
  measure: "transactions" | "amount";
  /** Loads the week and its comparison period. */
  load: (
    start: string,
    end: string,
    onProgress: (m: string) => void,
  ) => Promise<EventFetchResult>;
  /** Resolves one receipt's lines. May fetch. */
  loadReceipt: (
    saleId: string,
    day: string,
    storeid: number,
  ) => Promise<ReceiptLine[]>;
  /** The page's mobile "?" copy — same shape as the desktop `*Info.ts`. */
  info: { title: string; purpose: string; glossary: InfoGlossaryEntry[] };
}

const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");

/** What the store and cashier lists can sort by. The page's own figure leads,
 *  so the chip row opens on the order the list is already in. */
const sortOptions = (
  measure: "transactions" | "amount",
  by: "store" | "cashier",
): SortOption<EventSort>[] => {
  const size: SortOption<EventSort>[] = [
    { key: "transactions", label: "Transactions" },
    { key: "amount", label: "Amount" },
  ];
  return [
    ...(measure === "amount" ? size.reverse() : size),
    { key: "change", label: "vs Avg" },
    { key: "name", label: by === "store" ? "Store #" : "Name" },
  ];
};

/**
 * Loss Prevention and Coupon Sales on a phone, without grading.
 *
 * Three tabs over one flat set of events — stores, the people in them, and the
 * receipts. The event type is not a level in that hierarchy: it is a lens, and
 * it lives in a carousel of summary cards across the top. The first card is
 * everything at once; swiping to the next filters the whole screen to that
 * type. It used to be a screen you passed through, which meant comparing voids
 * to refunds cost you your place in the drill.
 *
 * Both pages load their whole week up front, so swiping regroups rows already
 * in hand rather than firing a request.
 */
const EventPerfMobile = ({
  pageKey,
  start,
  end,
  title,
  description,
  buttonLabel,
  allLabel,
  measure,
  load,
  loadReceipt,
  info,
}: Props) => {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const toast = useToast();
  const perf = useAppSelector((s) => s.prod.eventPerf);

  /** Narrows a long store list. Ephemeral by design — it describes what you
   *  are looking for right now, not what the search returned. */
  const [storeFilter, setStoreFilter] = useState("");
  /** The type picker. Local: it is a menu, not a place you can be. */
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  const scroller = useRef<HTMLDivElement>(null);
  const openCard = useRef<HTMLDivElement>(null);
  /** Where the list was left. It unmounts while the detail view is up, so the
   *  position has to survive outside the DOM. */
  const listScroll = useRef(0);

  /** Whatever is in the slice belongs to this page. Checked in render as well
   *  as cleared in the effect, so the other page's rows never paint for the
   *  frame before the reset lands. */
  const mine = perf.owner === pageKey;
  useEffect(() => {
    if (!mine) dispatch(claimEventPerf(pageKey));
  }, [mine, pageKey]);

  /** The seven dates of the week that was LOADED, so a day with no activity
   *  still gets a column. Not the `start` prop: that follows the search card's
   *  picker, which can move without a search ever running. Parsed at midday:
   *  a UTC-parsed ISO date read back in local time lands a day early, which
   *  would shift the whole chart. */
  const loadedStart = perf.loadedStart ?? start;
  const weekDates = useMemo(() => {
    const d0 = new Date(`${loadedStart}T12:00:00`);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(d0);
      d.setDate(d.getDate() + i);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });
  }, [loadedStart]);

  /**
   * Load the week, tagged with the generation it started under.
   *
   * Every dispatch that follows carries the tag, and the slice drops any whose
   * tag is no longer current — the other page claimed the slice, or a newer
   * search started. The generation is read back off the store rather than
   * predicted, so two taps in one frame cannot share one.
   */
  const runSearch = async () => {
    dispatch(beginEventLoad({ owner: pageKey, message: "Loading..." }));
    const tag = { owner: pageKey, gen: store.getState().eventPerf.loadGen };
    const current = () => {
      const s = store.getState().eventPerf;
      return s.owner === tag.owner && s.loadGen === tag.gen;
    };
    try {
      const result = await load(start, end, (message) =>
        dispatch(setEventLoadProgress({ ...tag, message })),
      );
      dispatch(
        setEventData({
          ...tag,
          rows: result.rows,
          baseline: result.baseline,
          lenses: result.lenses,
          start,
        }),
      );
    } catch (err) {
      // A search nobody is waiting for any more fails quietly.
      if (current())
        toast.error(`Error loading ${title}: ` + (err as JsonError).message);
      dispatch(failEventLoad(tag));
    }
  };

  /**
   * The scope everything reads from, held one render behind.
   *
   * Regrouping thousands of events is synchronous, so a swipe otherwise looked
   * like it did nothing until the new list was ready. Deferring lets the card
   * and a building notice paint first. Memoised because useDeferredValue
   * compares by identity — a fresh object every render would read as
   * permanently stale.
   */
  /** The group card is a card in the same accordion, so "which is open" stays
   *  one question with one answer. */
  const groupOpen = perf.selectedStoreKey === GROUP_KEY;

  /**
   * Two scopes, because the group card and a store card ask different
   * questions.
   *
   * The group's day is the screen's scope — it re-scopes every store row in
   * the list below, and a store card opens on it. A store card's day is local
   * to that card and is dropped when another opens, because a day picked while
   * reading one store says nothing about the next.
   */
  const groupScope: EventScope = useMemo(
    () => ({
      lens: perf.lens,
      day: perf.groupDay,
      storeKey: null,
      cashierKey: null,
    }),
    [perf.lens, perf.groupDay],
  );

  const cardScope: EventScope = useMemo(
    () => ({
      lens: perf.lens,
      day: groupOpen ? perf.groupDay : (perf.selectedDay ?? perf.groupDay),
      // The group card is every store, so it scopes to none.
      storeKey: groupOpen ? null : perf.selectedStoreKey,
      cashierKey: perf.selectedCashierKey,
    }),
    [
      perf.lens,
      perf.groupDay,
      perf.selectedDay,
      perf.selectedStoreKey,
      perf.selectedCashierKey,
      groupOpen,
    ],
  );

  const shownGroup = useDeferredValue(groupScope);
  const shownCard = useDeferredValue(cardScope);

  /**
   * Two rebuild flags, because the two scopes move independently.
   *
   * Only the group's scope can restate the store list — opening a card changes
   * the CARD's scope and nothing about the list it sits in. Sharing one flag
   * meant a tap replaced the whole list with a spinner, the page collapsed to
   * nothing, the browser clamped the scroll to the top, and the card someone
   * had just opened came back off screen.
   */
  const listBuilding = shownGroup !== groupScope;
  const detailBuilding = shownCard !== cardScope;

  /**
   * Opening a card brings it to the top of the screen.
   *
   * An accordion has to scroll DOWN as well as up: the card just tapped is
   * usually below the one that was open, so leaving the viewport where it was
   * opens the report off screen. That is why this doesn't use
   * `useDrillScroll` — that hook only ever scrolls up within a level, which is
   * right for tabs and wrong for this.
   *
   * It also watches the group scope, which is what brings you back after
   * picking a type. That rebuilds the list, so the open card unmounts and its
   * scroll goes with it — the card is still open in state, it has just left
   * the screen. Running again once the new list lands puts it back under the
   * reader rather than making them find it.
   */
  useLayoutEffect(() => {
    if (perf.detailOpen || !perf.selectedStoreKey) return;
    const el = scroller.current;
    // Null while the group card is the open one — the ref is only attached to
    // store cards — and while the list is mid-rebuild.
    const card = openCard.current;
    if (!el || !card) return;
    const offset =
      card.getBoundingClientRect().top - el.getBoundingClientRect().top;
    el.scrollTop = Math.max(0, el.scrollTop + offset - 8);
  }, [perf.selectedStoreKey, shownGroup]);

  /** Coming back from the detail view lands where the list was left. */
  useLayoutEffect(() => {
    if (perf.detailOpen) return;
    const el = scroller.current;
    if (el) el.scrollTop = listScroll.current;
  }, [perf.detailOpen]);
  /** What the old single scope meant, for the pieces that still read one. */
  const shown = shownCard;

  /**
   * Null first: the carousel opens on everything, and swiping narrows.
   *
   * One event type collapses to a single card. "All" and "the only one" are
   * the same set, so the second card would repeat the first figure for figure
   * — which is exactly what Coupon Sales looked like on a week of nothing but
   * vendor coupons.
   */
  const pages = useMemo<(string | null)[]>(
    () => (perf.lenses.length > 1 ? [null, ...perf.lenses] : [null]),
    [perf.lenses],
  );
  const pageIndex = Math.max(pages.indexOf(perf.lens), 0);

  /**
   * A card's figures for every lens, not just the open one — a swipe should
   * land on a card already filled in rather than one that pops.
   *
   * Built off the DEFERRED scope, like everything else on the screen. Reading
   * the urgent one put the page's heaviest work inside the render that is
   * supposed to paint immediately, so every day tap and row tap stuttered
   * before the list even started rebuilding.
   */
  const cardTotals = useMemo(
    () => buildLensCards(perf.rows, perf.baseline, shownGroup, pages),
    [pages, perf.rows, perf.baseline, shownGroup],
  );

  /** The week for whichever card is open. */
  const days = useMemo(
    () =>
      buildEventDays(perf.rows, perf.baseline, shownCard, weekDates, measure),
    [perf.rows, perf.baseline, shownCard, weekDates, measure],
  );

  /** The open store's own figures. Null while the group card is the open one —
   *  the carousel above already carries the group's. */
  const storeTotals = useMemo(
    () =>
      groupOpen || !perf.selectedStoreKey
        ? null
        : buildTotals(perf.rows, perf.baseline, shownCard),
    [groupOpen, perf.selectedStoreKey, perf.rows, perf.baseline, shownCard],
  );

  const query = perf.query.trim();
  const deferredQuery = useDeferredValue(query);

  /** Busiest day per card, each for its own lens — see buildLensBusiest. */
  const cardBusiest = useMemo(
    () => buildLensBusiest(perf.rows, shownGroup, pages, weekDates, measure),
    [perf.rows, shownGroup, pages, weekDates, measure],
  );

  /** Busiest day for the open store, on its own scope. */
  const storeBusiest = useMemo(
    () =>
      buildLensBusiest(perf.rows, shownCard, [perf.lens], weekDates, measure)[0],
    [perf.rows, shownCard, perf.lens, weekDates, measure],
  );

  const storeSortState = perf.sort.stores;
  const storeSort = storeSortState?.key ?? defaultEventSort(measure);
  const storeReversed = storeSortState?.reversed ?? false;
  const cashierSortState = perf.sort.cashiers;
  const cashierSort = cashierSortState?.key ?? defaultEventSort(measure);
  const cashierReversed = cashierSortState?.reversed ?? false;

  /** The screen's own list: every store, on the group's day. */
  const storeRows = useMemo(
    () =>
      buildGroupRows(
        perf.rows,
        perf.baseline,
        shownGroup,
        "store",
        measure,
        storeSort,
        storeReversed,
      ),
    [perf.rows, perf.baseline, shownGroup, measure, storeSort, storeReversed],
  );

  /** Narrowed by the filter. Must sit with the other hooks, above the early
   *  returns — the search screen and the results screen have to run the same
   *  hooks in the same order. */
  const visibleStores = useMemo(() => {
    const q = storeFilter.trim().toLowerCase();
    if (!q) return storeRows;
    return storeRows.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.key.toLowerCase().includes(q) ||
        r.sub.toLowerCase().includes(q),
    );
  }, [storeRows, storeFilter]);

  /** The detail view's lists, on the open card's scope. */
  const cashierRows = useMemo(() => {
    if (!perf.detailOpen || perf.view !== "cashiers") return [];
    return buildGroupRows(
      perf.rows,
      perf.baseline,
      shownCard,
      "cashier",
      measure,
      cashierSort,
      cashierReversed,
    );
  }, [perf.rows, perf.baseline, shownCard, perf.detailOpen, perf.view, measure, cashierSort, cashierReversed]);

  const receipts = useMemo(() => {
    if (!perf.detailOpen || perf.view !== "receipts") return [];
    return buildReceipts(perf.rows, shownCard, deferredQuery);
  }, [perf.rows, shownCard, perf.detailOpen, perf.view, deferredQuery]);

  // Opening a receipt may be a fetch (LP) or a filter (Coupons). Either way
  // the sheet mounts immediately and fills in, rather than the tap hanging.
  // The lines land in the slice tagged with the receipt and the load, so one
  // that arrives after the sheet has moved on is dropped there.
  useEffect(() => {
    if (!perf.openSaleId) return;
    const t = receipts.find((r) => r.saleId === perf.openSaleId);
    if (!t) return;
    const tag = {
      owner: pageKey,
      gen: store.getState().eventPerf.loadGen,
      saleId: t.saleId,
    };
    loadReceipt(t.saleId, t.day, t.storeid)
      .then((lines) => dispatch(setReceiptLines({ ...tag, lines })))
      .catch(() => dispatch(failReceipt(tag)));
  }, [perf.openSaleId]);

  const openTxn = receipts.find((r) => r.saleId === perf.openSaleId) ?? null;
  const openReceiptState =
    perf.receipt && perf.receipt.saleId === perf.openSaleId
      ? perf.receipt
      : null;

  /** Single-store searches skip the store list, the same rule Sales follows —
   *  a one-row list asks you to confirm something you already said. */
  const multiStore = (cardTotals[0]?.stores ?? 0) > 1;

  /** A single-store search has no list to accordion, so its one card is always
   *  open and carries the page's controls itself. */
  const groupAlwaysOpen = !multiStore;
  const scopeOpen = groupAlwaysOpen || groupOpen;

  // The view key stays "receipts" — that is what the bottom sheet renders, and
  // it is the word for one of these. The TAB names the list, and a list of them
  // is transactions, which is also what the card above counts.
  const DETAIL_TABS: { key: EventView; label: string }[] = [
    { key: "cashiers", label: "Cashiers" },
    { key: "receipts", label: "Transactions" },
  ];

  // Ownership first. The other page's load still running in the slice is not
  // this page's spinner — checking loading first showed LP's progress under
  // Coupon Sales until the claim landed.
  if (mine && perf.loading) {
    return (
      <div className="flex h-[calc(100dvh-3rem)] items-center justify-center bg-bkg px-8 text-center">
        <div>
          <div
            className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-gray-200"
            style={{ borderTopColor: TY_COLOR }}
          />
          <div className="text-[12.5px] text-content/85">
            {perf.loadingMessage || "Loading..."}
          </div>
        </div>
      </div>
    );
  }

  const hasResults = mine && perf.hasSearched && perf.rows.length > 0;

  if (!hasResults || perf.searchOpen) {
    return (
      <div className="h-[calc(100dvh-3rem)] overflow-y-auto bg-bkg">
        <SearchCard
          top
          title={title}
          description={description}
          buttonLabel={buttonLabel}
          singleDate
          onSearch={runSearch}
          loading={mine && perf.loading}
          loadingMessage="Loading..."
          // Opened over a week already loaded, the card needs a way back to it
          // that is not a search — changing the picker alone loads nothing.
          onBack={
            hasResults
              ? () => dispatch(setEventSearchOpen(false))
              : undefined
          }
          notice={
            mine && perf.hasSearched && perf.rows.length === 0
              ? "Nothing found for that search."
              : undefined
          }
        />
      </div>
    );
  }

  const valueOf = (t: EventTotals) =>
    measure === "amount" ? t.amount : t.transactions;
  const baseOf = (t: EventTotals) =>
    measure === "amount" ? t.baselineAmount : t.baselineTransactions;
  const fmt = measure === "amount" ? formatCurrency2 : fmtInt;


  /** The day, when one is picked. It takes the window's place on the header
   *  line rather than sitting beside it — see PerfCardHeader. */
  const dayLabel = shown.day
    ? new Date(`${shown.day}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "numeric",
        day: "numeric",
      })
    : "";

  /** Names the hero figure. The number alone did not say whether it was
   *  dollars or a count, or whether it was the week or the tapped day. */
  const heroCaption = `${measure === "amount" ? "Amount" : "Transactions"} ${
    dayLabel ? "on the selected day" : "this week"
  }`;

  const weekLabel = `${formatDateSimple(weekDates[0])} – ${formatDateSimple(weekDates[6])}`;

  /** The type on screen. The picker lists them all; this is the one chosen. */
  const current = cardTotals[pageIndex] ?? cardTotals[0];

  /** The group's day names the list; a card's names that card. */
  const groupDayLabel = shownGroup.day
    ? new Date(`${shownGroup.day}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "numeric",
        day: "numeric",
      })
    : "";

  const listRows = visibleStores.slice(0, perf.listLimit);
  const listMax = Math.max(
    ...listRows.map((r) =>
      Math.max(
        measure === "amount" ? r.amount : r.transactions,
        r.baseline ?? 0,
      ),
    ),
    1,
  );
  const shownCashiers = cashierRows.slice(0, perf.listLimit);
  const shownReceipts = receipts.slice(0, perf.listLimit);

  /** What the detail view's rows belong to. */
  const detailScope =
    perf.selectedStoreLabel ?? cardTotals[0]?.storeName ?? "All stores";

  /* ── a breakdown is its own screen ──────────────────────────────── */
  if (perf.detailOpen && (scopeOpen || perf.selectedStoreKey)) {
    return (
      <>
        <MobilePerfDetail
          tabs={DETAIL_TABS}
          active={perf.view}
          onTab={(k) => dispatch(setEventView(k))}
          scopeName={detailScope}
          when={`${dayLabel || weekLabel}${perf.lens ? ` · ${perf.lens}` : ""}`}
          backLabel={multiStore ? "Stores" : title}
          onBack={() => dispatch(openEventDetail(false))}
          levelKey={`${perf.view}|${perf.selectedCashierKey ?? ""}`}
        >
          <EventDrillList
            view={perf.view}
            building={detailBuilding}
            measure={measure}
            rows={shownCashiers}
            sortOptions={sortOptions(measure, "cashier")}
            sort={perf.sort.cashiers?.key ?? null}
            sortDir={
              perf.sort.cashiers
                ? eventDirOf(perf.sort.cashiers.key, perf.sort.cashiers.reversed)
                : null
            }
            onSort={(key) =>
              dispatch(setEventSort({ list: "cashiers", sort: key }))
            }
            onSelectCashier={(row) => dispatch(selectEventCashier(row))}
            receipts={shownReceipts}
            query={perf.query}
            onQuery={(q) => dispatch(setEventQuery(q))}
            onOpenReceipt={(id) => dispatch(openReceipt(id))}
            cashierLabel={perf.selectedCashierLabel}
            onClearCashier={() => dispatch(clearEventCashier())}
            remaining={
              perf.view === "receipts"
                ? receipts.length - shownReceipts.length
                : cashierRows.length - shownCashiers.length
            }
            onShowMore={() => dispatch(showMoreEvents())}
          />
        </MobilePerfDetail>

        {openTxn && (
          <BottomSheet onClose={() => dispatch(closeReceipt())}>
            <Receipt
              txn={openTxn}
              receipt={openReceiptState}
              when={openTxn.day ? formatDateSimple(openTxn.day) : ""}
            />
          </BottomSheet>
        )}
      </>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-bkg">
      {/* pb-14 clears the fixed bottom tab bar, which is outside document flow
          and would otherwise hide the last card. */}
      <div
        ref={scroller}
        onScroll={(e) => (listScroll.current = e.currentTarget.scrollTop)}
        className="flex-1 overflow-y-auto pb-14"
      >
        {/* ── the scope card, and the screen's filter ────────────── */}
        {/* The type is chosen from the title rather than swiped to. A carousel
            meant six taps to reach the sixth type and gave no way to see what
            the types were without visiting each one; the picker lists them all
            with their figures, so choosing is one tap from a menu that already
            answers "which is worst". */}
        <div className="px-3 pt-3">
          <section
            className={`overflow-hidden rounded-2xl border bg-custom-white shadow-md transition-colors ${
              scopeOpen ? "border-gray-300" : "border-gray-200"
            }`}
          >
            <PerfCardHeader
              title={perf.lens ?? allLabel}
              label={multiStore ? `${current.stores} stores` : ""}
              when={groupDayLabel || weekLabel}
              onSearch={() => dispatch(setEventSearchOpen(true))}
              onInfo={() => dispatch(setEventInfoOpen(true))}
              // Only offered when there is more than one type to choose from.
              onTitleTap={
                pages.length > 1 ? () => setTypePickerOpen(true) : undefined
              }
              onToggle={
                groupAlwaysOpen
                  ? undefined
                  : () =>
                      dispatch(
                        toggleEventCard({
                          key: GROUP_KEY,
                          label: current.storeName ?? "All stores",
                        }),
                      )
              }
              open={scopeOpen}
            />

            <div className="px-4 pb-4 pt-2">
              <div className="mt-1 text-[11px] font-semibold text-content/85">
                {heroCaption}
              </div>
              <div className="mt-1 font-display text-[31px] font-extrabold leading-none tracking-tight text-content">
                {fmt(valueOf(current))}
              </div>

              {/* No second bar when the comparison period has nothing at this
                  level — LP's baseline knows stores, never people, and a zero
                  would read as "none last time" rather than "not measured". */}
              {baseOf(current) !== null && (
                <div className="mt-3">
                  <PairedBars
                    ty={valueOf(current)}
                    ly={baseOf(current) as number}
                    max={Math.max(valueOf(current), baseOf(current) as number)}
                    labels={["WK", "AVG"]}
                    format={fmt}
                    compact
                  />
                  <p className="mt-1.5 text-[11px] text-content/85">
                    WK {groupDayLabel ? "selected day" : "this week"} · AVG
                    prior 2-wk avg{groupDayLabel ? ", same weekday" : ""}
                  </p>
                </div>
              )}

              <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-100 pt-3">
                {(
                  [
                    ...(measure === "amount"
                      ? [
                          ["Coupons", fmtInt(current.lines)],
                          ["Transactions", fmtInt(current.transactions)],
                        ]
                      : [
                          ["Amount", formatCurrency2(current.amount)],
                          ["Cashiers", fmtInt(current.cashiers)],
                        ]),
                    ["Per txn", formatCurrency2(current.perTransaction)],
                    ["Busiest", cardBusiest[pageIndex] ?? "—"],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-content/85">
                      {k}
                    </span>
                    <span className="font-display text-[15px] font-bold text-content">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 p-3">
          {/* ── the scope card, opened ──────────────────────────── */}
          {/* The carousel above already carries its figures, so opening it adds
              the week and the way down rather than repeating them. */}
          {scopeOpen && (
            <section className="overflow-hidden rounded-2xl border border-gray-300 bg-custom-white shadow-md">
              <div className="px-3.5 pb-1 pt-3">
                <PerfDayChart
                  days={days.map((d) => ({
                    iso: d.iso,
                    label: d.label,
                    ty: d.value,
                    ly: d.baseline,
                  }))}
                  // The DEFERRED day — the chart and the rows it scopes have to
                  // move on the same render.
                  selected={shownGroup.day}
                  onToggle={(iso) => dispatch(toggleEventGroupDay(iso))}
                />
                <div className="mt-1 flex gap-3.5 px-1 text-[12px] text-content/85">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2 w-3.5 rounded-sm"
                      style={{ background: TY_COLOR }}
                    />
                    This week
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2 w-3.5 rounded-sm"
                      style={{ background: "#5a6c84" }}
                    />
                    Prior 2-wk avg
                  </span>
                </div>
                <p className="px-1 pt-1 text-[12px] text-content/85">
                  {shownGroup.day
                    ? "Tap the selected day again for the full week."
                    : multiStore
                      ? "Tap a day to scope the screen to it."
                      : "Tap a day to scope this store to it."}
                </p>
              </div>
              <div className="px-3.5 pb-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => dispatch(openEventDetail(true))}
                  className="flex w-full items-center justify-center gap-1 rounded-lg bg-[#1e2a4a] py-2.5 text-[12.5px] font-bold text-custom-white active:bg-[#2a3a62]"
                >
                  View details
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </section>
          )}

          {/* ── how the list is ordered ─────────────────────────── */}
          {multiStore && (
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
              <MobileSortChips
                options={sortOptions(measure, "store")}
                value={perf.sort.stores?.key ?? null}
                dir={
                  perf.sort.stores
                    ? eventDirOf(perf.sort.stores.key, perf.sort.stores.reversed)
                    : null
                }
                onChange={(key) =>
                  dispatch(setEventSort({ list: "stores", sort: key }))
                }
              />
              <div className="px-3.5 py-2">
                <div className="flex items-center gap-2 rounded-lg bg-bkg px-3">
                  <MagnifyingGlassIcon className="h-4 w-4 flex-none text-content/85" />
                  <input
                    id="event-store-filter"
                    value={storeFilter}
                    onChange={(e) => setStoreFilter(e.target.value)}
                    placeholder="Filter by store"
                    inputMode="search"
                    enterKeyHint="search"
                    aria-label="Filter by store"
                    className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[14px] text-content placeholder:text-content/85"
                    style={{
                      outline: "none",
                      WebkitAppearance: "none",
                      boxShadow: "none",
                    }}
                  />
                  {storeFilter && (
                    <button
                      type="button"
                      onClick={() => setStoreFilter("")}
                      aria-label="Clear filter"
                      className="-mr-1 flex h-7 w-7 flex-none items-center justify-center rounded-full text-content/85 active:bg-custom-white"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ── the stores ──────────────────────────────────────── */}
          {multiStore &&
            (listBuilding ? (
              <section
                className="rounded-2xl border border-gray-200 bg-custom-white px-4 py-10 text-center text-[12.5px] text-content/85 shadow-md"
                style={{ animation: "delayed-fade-in 140ms ease-out 200ms both" }}
              >
                Building the list...
              </section>
            ) : listRows.length === 0 ? (
              <section className="rounded-2xl border border-gray-200 bg-custom-white px-4 py-8 text-center text-[12.5px] text-content/85 shadow-md">
                {storeFilter.trim()
                  ? `No store matches "${storeFilter.trim()}".`
                  : "Nothing recorded for this selection."}
              </section>
            ) : (
              listRows.map((r) => {
                const isOpen = perf.selectedStoreKey === r.key;
                return (
                  <div key={r.key} ref={isOpen ? openCard : undefined}>
                    <MobilePerfCard
                      label={r.label}
                      change={
                        measure === "amount"
                          ? formatCurrency2(r.amount)
                          : fmtInt(r.transactions)
                      }
                      open={isOpen}
                      minimised={!isOpen && perf.selectedStoreKey !== null}
                      onToggle={() =>
                        dispatch(
                          toggleEventCard({ key: r.key, label: r.label }),
                        )
                      }
                      bars={
                        <PairedBars
                          ty={measure === "amount" ? r.amount : r.transactions}
                          ly={r.baseline ?? 0}
                          max={listMax}
                          labels={["WK", "AVG"]}
                          format={fmt}
                          compact
                        />
                      }
                    >
                      {isOpen && storeTotals && (
                        <EventStoreReport
                          days={days}
                          selectedDay={shownCard.day}
                          onToggleDay={(iso) => dispatch(toggleEventDay(iso))}
                          totals={storeTotals}
                          measure={measure}
                          heroCaption={heroCaption}
                          dayLabel={dayLabel}
                          busiest={storeBusiest ?? "—"}
                          onViewDetails={() => dispatch(openEventDetail(true))}
                        />
                      )}
                    </MobilePerfCard>
                  </div>
                );
              })
            ))}

          {multiStore && !listBuilding && visibleStores.length > listRows.length && (
            <button
              type="button"
              onClick={() => dispatch(showMoreEvents())}
              className="rounded-2xl border border-gray-200 bg-custom-white py-3 text-center text-[12px] font-semibold shadow-md active:bg-bkg"
              style={{ color: TY_COLOR }}
            >
              Show {ROWS_PER_PAGE} more
              <span className="text-content/85">
                {" "}
                · {fmtInt(visibleStores.length - listRows.length)} left
              </span>
            </button>
          )}
        </div>
      </div>

      {typePickerOpen && (
        <BottomSheet onClose={() => setTypePickerOpen(false)}>
          <div className="px-4 pb-6 pt-1">
            <h2 className="font-display text-[15px] font-bold text-content">
              Type
            </h2>
            <p className="pb-2 pt-0.5 text-[12px] text-content/85">
              Scopes the whole screen, including the stores below.
            </p>
            {/* Each row carries its own figures, so the choice is made from the
                menu rather than by visiting every type to find out. */}
            {pages.map((lens, i) => {
              const t = cardTotals[i];
              const active = perf.lens === lens;
              return (
                <button
                  key={lens ?? "__all"}
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => {
                    dispatch(setEventLens(lens));
                    setTypePickerOpen(false);
                  }}
                  className={`flex w-full items-baseline gap-3 border-t border-gray-100 px-1 py-3 text-left first:border-t-0 ${
                    active ? "bg-row_selected" : "active:bg-bkg"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
                    {lens ?? allLabel}
                  </span>
                  <span className="flex-none text-[12px] text-content/85">
                    {measure === "amount"
                      ? `${fmtInt(t.transactions)} txns`
                      : formatCurrency2(t.amount)}
                  </span>
                  <span className="flex-none font-display text-[13.5px] font-bold text-content">
                    {fmt(valueOf(t))}
                  </span>
                </button>
              );
            })}
          </div>
        </BottomSheet>
      )}

      {perf.infoOpen && (
        <MobileInfoSheet
          {...info}
          onClose={() => dispatch(setEventInfoOpen(false))}
        />
      )}
    </div>
  );
};

/** A rule with a caption sitting in it, the way a till roll breaks sections. */
const Rule = ({ children }: { children?: React.ReactNode }) =>
  children ? (
    <div className="my-2.5 flex items-center gap-2">
      <span className="h-px flex-1 bg-gray-200" />
      <span className="font-mono text-[11px] font-bold tracking-wider text-content">
        {children}
      </span>
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  ) : (
    <div className="my-2 border-t border-dashed border-gray-300" />
  );

const Total = ({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) => (
  <div className="flex items-baseline gap-3 py-0.5">
    <span
      className={`flex-1 font-mono uppercase tracking-wider ${strong ? "text-[12px] font-bold text-content" : "text-[11px] text-content/85"}`}
    >
      {label}
    </span>
    <span
      className={`flex-none font-mono tabular-nums ${strong ? "text-[14px] font-bold text-content" : "text-[12px] text-content/85"}`}
    >
      {value}
    </span>
  </div>
);

/**
 * One transaction, laid out like the paper it came off.
 *
 * Monospace, centred header, dashed rules, amounts hard right. The point is
 * recognition: someone holding the printed copy should be able to read the two
 * side by side without translating between them. Legibility still wins where
 * the two disagree — 12px rather than a true till roll's 8, and the store and
 * cashier named in full rather than abbreviated.
 */
const Receipt = ({
  txn,
  receipt,
  when,
}: {
  txn: EventReceipt;
  /** Null until the slice has a state for this receipt — read as loading. */
  receipt: EventReceiptState | null;
  when: string;
}) => {
  const status = receipt?.status ?? "loading";
  const lines: ReceiptLine[] = receipt?.lines ?? [];
  const items = lines.filter((l) => l.kind !== "tender");
  const tenders = lines.filter((l) => l.kind === "tender");
  const itemTotal = items.reduce((a, l) => a + l.amount, 0);

  return (
    <>
      <div className="mx-auto w-full max-w-md flex-shrink-0 px-5 pt-1 text-center">
        <div className="font-mono text-[13px] font-bold uppercase tracking-wider text-content">
          {txn.storeName}
        </div>
        <div className="mt-0.5 font-mono text-[11px] text-content/85">
          {[txn.cashierName, txn.terminal ? `Lane ${txn.terminal}` : "", when]
            .filter(Boolean)
            .join("  ·  ")}
        </div>
        <Rule>#{receiptLabel(txn.saleId)}</Rule>
      </div>

      <div className="mx-auto w-full max-w-md overflow-y-auto px-5 pb-6">
        {status === "loading" ? (
          <div className="py-8 text-center font-mono text-[12px] text-content/85">
            Loading receipt...
          </div>
        ) : status === "error" ? (
          // Not "no lines": a fetch that failed says nothing about what was on
          // the receipt, and reading it as empty is the wrong conclusion.
          <div className="py-8 text-center font-mono text-[12px] text-content">
            Couldn't load this receipt. Close it and tap the transaction to try
            again.
          </div>
        ) : lines.length === 0 ? (
          <div className="py-8 text-center font-mono text-[12px] text-content/85">
            No lines came back for this transaction.
          </div>
        ) : (
          <>
            {items.map((l, i) => (
              <div
                // Receipts repeat: two of the same item ring as two lines, and
                // collapsing them would hide exactly the pattern LP looks for.
                key={`${l.description}-${i}`}
                className="flex items-baseline gap-3 py-1.5"
              >
                <span className="min-w-0 flex-1 font-mono text-[12px] uppercase leading-snug text-content">
                  {l.description}
                  {Math.abs(l.qty) !== 1 && l.qty !== 0 && (
                    <span className="mt-0.5 block text-[11px] normal-case text-content/85">
                      {l.qty.toLocaleString("en-US")} @{" "}
                      {formatCurrency2(l.amount / l.qty)}
                    </span>
                  )}
                </span>
                <span className="flex-none font-mono text-[12.5px] font-semibold tabular-nums text-content">
                  {formatCurrency2(l.amount)}
                </span>
              </div>
            ))}

            <Rule />
            <Total label="Items" value={fmtInt(items.length)} />
            <Total label="Total" value={formatCurrency2(itemTotal)} strong />

            {tenders.length > 0 && (
              <>
                <Rule />
                {tenders.map((t, i) => (
                  <Total
                    key={`${t.description}-${i}`}
                    label={t.description}
                    value={formatCurrency2(t.amount)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default EventPerfMobile;
