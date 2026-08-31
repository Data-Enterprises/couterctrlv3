import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import SearchCard from "../../../components/SearchCard";
import BottomSheet from "../../../components/BottomSheet";
import { formatCurrency2, formatDateSimple } from "../../../utils";
import type { JsonError } from "../../../interfaces";
import {
  claimEventPerf,
  clearEventCashier,
  clearEventStore,
  closeReceipt,
  openReceipt,
  ROWS_PER_PAGE,
  selectEventCashier,
  selectEventStore,
  setEventData,
  setEventHasSearched,
  setEventLens,
  setEventLoading,
  setEventQuery,
  setEventView,
  showMoreEvents,
  toggleEventDay,
  type EventRow,
  type EventView,
} from "../../../features/eventPerfSlice";
import {
  buildEventDays,
  buildGroupRows,
  buildLensCards,
  buildReceipts,
  busiestDay,
  receiptLabel,
  type EventReceipt,
  type EventScope,
  type EventTotals,
} from "./eventPerfData";
import type { ReceiptLine } from "./receiptTypes";
import PairedBars from "../../sales/mobile/perf/PairedBars";
import PerfDayChart from "../../sales/mobile/perf/PerfDayChart";
import { LY_COLOR, TY_COLOR } from "../../sales/mobile/perf/perfColors";

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
}

const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");

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
}: Props) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const perf = useAppSelector((s) => s.eventPerf);

  const [showSearch, setShowSearch] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptLine[] | null>(null);
  const carousel = useRef<HTMLDivElement>(null);

  /** Whatever is in the slice belongs to this page. Checked in render as well
   *  as cleared in the effect, so the other page's rows never paint for the
   *  frame before the reset lands. */
  const mine = perf.owner === pageKey;
  useEffect(() => {
    if (!mine) dispatch(claimEventPerf(pageKey));
  }, [mine, pageKey]);

  /** The seven dates of the window, so a day with no activity still gets a
   *  column. Parsed at midday: a UTC-parsed ISO date read back in local time
   *  lands a day early, which would shift the whole chart. */
  const weekDates = useMemo(() => {
    const d0 = new Date(`${start}T12:00:00`);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(d0);
      d.setDate(d.getDate() + i);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });
  }, [start]);

  const runSearch = async () => {
    dispatch(setEventLoading({ loading: true, message: "Loading..." }));
    try {
      const result = await load(start, end, (message) =>
        dispatch(setEventLoading({ loading: true, message })),
      );
      dispatch(setEventData(result));
      setShowSearch(false);
    } catch (err) {
      toast.error(`Error loading ${title}: ` + (err as JsonError).message);
      dispatch(setEventHasSearched(true));
    } finally {
      dispatch(setEventLoading({ loading: false }));
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
  const scope: EventScope = useMemo(
    () => ({
      lens: perf.lens,
      day: perf.selectedDay,
      storeKey: perf.selectedStoreKey,
      cashierKey: perf.selectedCashierKey,
    }),
    [
      perf.lens,
      perf.selectedDay,
      perf.selectedStoreKey,
      perf.selectedCashierKey,
    ],
  );
  const shown = useDeferredValue(scope);
  const building = shown !== scope;

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
    () => buildLensCards(perf.rows, perf.baseline, shown, pages),
    [pages, perf.rows, perf.baseline, shown],
  );

  const days = useMemo(
    () => buildEventDays(perf.rows, perf.baseline, shown, weekDates, measure),
    [perf.rows, perf.baseline, shown, weekDates, measure],
  );

  const query = perf.query.trim();
  const deferredQuery = useDeferredValue(query);

  const rows = useMemo(() => {
    if (perf.view === "receipts") return [];
    return buildGroupRows(
      perf.rows,
      perf.baseline,
      shown,
      perf.view === "stores" ? "store" : "cashier",
      measure,
    );
  }, [perf.rows, perf.baseline, shown, perf.view, measure]);

  const receipts = useMemo(() => {
    if (perf.view !== "receipts") return [];
    return buildReceipts(perf.rows, shown, deferredQuery);
  }, [perf.rows, shown, perf.view, deferredQuery]);

  const settle = useRef<number | undefined>(undefined);
  /** True while the lens change came from the user's own finger. */
  const fromSwipe = useRef(false);

  /**
   * Adopt a lens only once the swipe has stopped moving.
   *
   * Reading `scrollLeft` on every scroll event is what made the card bounce:
   * the moment the midpoint was crossed we dispatched, the sync effect below
   * saw a new index and issued its own `scrollTo`, and that fought the
   * browser's snap animation still in flight. Waiting for the scroll to go
   * quiet means exactly one dispatch per gesture, after the snap has landed.
   */
  const onCarouselScroll = () => {
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const el = carousel.current;
      if (!el || el.clientWidth === 0) return;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      if (i < 0 || i >= pages.length || pages[i] === perf.lens) return;
      fromSwipe.current = true;
      dispatch(setEventLens(pages[i]));
    }, 110);
  };

  useEffect(() => () => window.clearTimeout(settle.current), []);

  /** Keep the carousel in step when the lens changes from anywhere else — a
   *  fresh search resets to All, and the arrows below move a card at a time.
   *  A swipe is skipped outright: the browser already put the card where the
   *  user let go of it, and scrolling it again is the bounce. */
  useEffect(() => {
    if (fromSwipe.current) {
      fromSwipe.current = false;
      return;
    }
    const el = carousel.current;
    if (!el || el.clientWidth === 0) return;
    const target = pageIndex * el.clientWidth;
    if (Math.abs(el.scrollLeft - target) > 4)
      el.scrollTo({ left: target, behavior: "smooth" });
  }, [pageIndex]);

  // Opening a receipt may be a fetch (LP) or a filter (Coupons). Either way
  // the sheet mounts immediately and fills in, rather than the tap hanging.
  useEffect(() => {
    if (!perf.openSaleId) {
      setReceipt(null);
      return;
    }
    const t = receipts.find((r) => r.saleId === perf.openSaleId);
    if (!t) return;
    let live = true;
    setReceipt(null);
    loadReceipt(t.saleId, t.day, t.storeid)
      .then((lines) => live && setReceipt(lines))
      .catch(() => live && setReceipt([]));
    return () => {
      live = false;
    };
  }, [perf.openSaleId]);

  const openTxn = receipts.find((r) => r.saleId === perf.openSaleId) ?? null;

  /** Single-store searches skip the store list, the same rule Sales follows —
   *  a one-row list asks you to confirm something you already said. */
  const multiStore = (cardTotals[0]?.stores ?? 0) > 1;
  const VIEWS: { key: EventView; label: string }[] = [
    ...(multiStore ? [{ key: "stores" as const, label: "Stores" }] : []),
    { key: "cashiers", label: "Cashiers" },
    // The view key stays "receipts" — that is what the bottom sheet renders,
    // and it is the word for one of these. The TAB names the list, and a list
    // of them is transactions, which is also what the card above counts.
    { key: "receipts", label: "Transactions" },
  ];

  if (perf.loading) {
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

  if (!mine || !perf.hasSearched || showSearch || perf.rows.length === 0) {
    return (
      <div className="h-[calc(100dvh-3rem)] overflow-y-auto bg-bkg">
        <SearchCard
          top
          title={title}
          description={description}
          buttonLabel={buttonLabel}
          singleDate
          onSearch={runSearch}
          loading={perf.loading}
          loadingMessage="Loading..."
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

  const scopeLabel = [
    perf.selectedCashierLabel ??
      perf.selectedStoreLabel ??
      cardTotals[0]?.storeName ??
      "All stores",
    perf.selectedDay
      ? new Date(`${perf.selectedDay}T12:00:00`).toLocaleDateString("en-US", {
          weekday: "short",
          month: "numeric",
          day: "numeric",
        })
      : "",
  ]
    .filter(Boolean)
    .join(" · ");

  /** Hoisted out of the card map — it is the same answer on every card, and
   *  it was being recomputed once per lens. */
  const busiest = busiestDay(days) ?? "—";

  const listRows = rows.slice(0, perf.listLimit);
  const listMax = Math.max(
    ...listRows.map((r) =>
      Math.max(
        measure === "amount" ? r.amount : r.transactions,
        r.baseline ?? 0,
      ),
    ),
    1,
  );
  const shownReceipts = receipts.slice(0, perf.listLimit);

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-bkg">
      <nav className="flex flex-shrink-0 border-b border-gray-200 bg-custom-white">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => dispatch(setEventView(v.key))}
            aria-current={perf.view === v.key ? "page" : undefined}
            className={`flex-1 border-r border-gray-100 py-3 text-[12.5px] font-semibold last:border-r-0 ${
              perf.view === v.key ? "text-content" : "text-content/85"
            }`}
            style={
              perf.view === v.key
                ? { boxShadow: `inset 0 -2px 0 ${TY_COLOR}` }
                : undefined
            }
          >
            {v.label}
          </button>
        ))}
      </nav>

      {/* pb-14 clears the fixed bottom tab bar, which is outside document flow. */}
      <div className="flex-1 overflow-y-auto pb-14">
        {(perf.selectedStoreKey || perf.selectedCashierKey) && (
          <div className="px-3 pt-3">
            <button
              type="button"
              onClick={() =>
                dispatch(
                  perf.selectedCashierKey
                    ? clearEventCashier()
                    : clearEventStore(),
                )
              }
              className="flex items-center gap-0.5 rounded-lg py-1 pl-0.5 pr-2 text-[12.5px] font-semibold active:bg-row_selected"
              style={{ color: TY_COLOR }}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              {perf.selectedCashierKey
                ? `Back to ${perf.selectedStoreLabel ?? "cashiers"}`
                : "Back to stores"}
            </button>
          </div>
        )}

        {/* ── the lens carousel ─────────────────────────────────── */}
        {/* With one event type the carousel is two cards showing identical
            figures, since "all" and "the only one" are the same set. The
            markup collapses to a single card rather than the page explaining
            a control that cannot do anything. */}
        <div
          ref={carousel}
          onScroll={onCarouselScroll}
          className={`no-scrollbar flex overflow-x-auto overscroll-x-contain pt-3 ${
            pages.length > 1 ? "snap-x snap-mandatory" : ""
          }`}
          style={{ scrollbarWidth: "none" }}
        >
          {pages.map((lens, i) => {
            const t = cardTotals[i];
            const value = valueOf(t);
            const base = baseOf(t);
            return (
              <div
                key={lens ?? "__all"}
                className="w-full flex-none snap-center px-3"
              >
                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
                  <div className="flex items-baseline gap-2 px-4 pt-3">
                    <span className="min-w-0 truncate font-display text-[14px] font-bold text-content">
                      {lens ?? allLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSearch(true)}
                      className="ml-auto flex flex-none items-center gap-1 rounded-md px-1 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-content/85 active:bg-bkg"
                    >
                      {formatDateSimple(weekDates[0])} –{" "}
                      {formatDateSimple(weekDates[6])}
                      <ChevronDownIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="px-4 pb-4 pt-3">
                    <div className="truncate font-mono text-[10px] uppercase tracking-wider text-content/85">
                      {scopeLabel}
                    </div>
                    <div className="mt-1.5 font-display text-[31px] font-extrabold leading-none tracking-tight tabular-nums text-content">
                      {fmt(value)}
                    </div>

                    {/* No second bar when the comparison period has nothing at
                        this level — LP's baseline knows stores, never people,
                        and a zero would read as "none last time" rather than
                        "not measured". */}
                    {base !== null && (
                      <div className="mt-3">
                        <PairedBars
                          ty={value}
                          ly={base}
                          max={Math.max(value, base)}
                          labels={["WK", "AVG"]}
                          format={fmt}
                          compact
                        />
                      </div>
                    )}

                    <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-100 pt-3">
                      {(
                        [
                          measure === "amount"
                            ? ["Lines", fmtInt(t.lines)]
                            : ["Amount", formatCurrency2(t.amount)],
                          ["Transactions", fmtInt(t.transactions)],
                          ["Per txn", formatCurrency2(t.perTransaction)],
                          ["Busiest", busiest],
                        ] as [string, string][]
                      ).map(([k, v]) => (
                        <div key={k} className="flex flex-col">
                          <span className="font-mono text-[9.5px] uppercase tracking-wider text-content/85">
                            {k}
                          </span>
                          <span className="font-display text-[15px] font-bold tabular-nums text-content">
                            {v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            );
          })}
        </div>

        {/* Position, and what is on either side of it. Dots alone say there is
            more without saying what — and naming the neighbours turns the
            arrows into a way to step through types without swiping. */}
        {pages.length > 1 && (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 pt-2">
            <button
              type="button"
              disabled={pageIndex === 0}
              onClick={() => dispatch(setEventLens(pages[pageIndex - 1]))}
              className="flex min-w-0 items-center gap-0.5 justify-self-start rounded-md py-1 pr-1 text-[11px] font-semibold text-content/85 disabled:invisible active:bg-row_selected"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5 flex-none" />
              <span className="truncate">
                {pages[pageIndex - 1] ?? allLabel}
              </span>
            </button>

            <div className="flex items-center gap-1.5">
              {pages.map((lens, i) => (
                <span
                  key={lens ?? "__all"}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === pageIndex ? 14 : 6,
                    background: i === pageIndex ? TY_COLOR : "#5a6c84",
                    opacity: i === pageIndex ? 1 : 0.32,
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              disabled={pageIndex >= pages.length - 1}
              onClick={() => dispatch(setEventLens(pages[pageIndex + 1]))}
              className="flex min-w-0 items-center gap-0.5 justify-self-end rounded-md py-1 pl-1 text-[11px] font-semibold text-content/85 disabled:invisible active:bg-row_selected"
            >
              <span className="truncate">
                {pages[pageIndex + 1] ?? allLabel}
              </span>
              <ChevronRightIcon className="h-3.5 w-3.5 flex-none" />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3 p-3">
          {/* ── the week ─────────────────────────────────────────── */}
          {/* Sales' own chart component, not a lookalike. It carries the
              behaviour the hand-rolled version was missing: the unselected
              days drop back rather than the selected one gaining a ring, so
              the week's shape survives while you read one day of it. */}
          {perf.view !== "receipts" && (
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white px-3 pb-3 pt-3 shadow-md">
              <PerfDayChart
                days={days.map((d) => ({
                  iso: d.iso,
                  label: d.label,
                  ty: d.value,
                  ly: d.baseline,
                }))}
                selected={perf.selectedDay}
                onToggle={(iso) => dispatch(toggleEventDay(iso))}
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
                    style={{ background: LY_COLOR }}
                  />
                  Weekly average
                </span>
              </div>
              <p className="px-1 pt-1.5 text-[12px] text-content/85">
                {perf.selectedDay
                  ? "Tap the selected day again for the full week."
                  : "Tap a day to scope the screen to it."}
              </p>
            </section>
          )}

          {/* ── find a receipt ───────────────────────────────────── */}
          {perf.view === "receipts" && (
            <section className="rounded-2xl border border-gray-200 bg-custom-white p-3 shadow-md">
              <input
                value={perf.query}
                onChange={(e) => dispatch(setEventQuery(e.target.value))}
                placeholder="Sale ID, cashier or lane"
                inputMode="search"
                className="w-full rounded-lg border-0 bg-bkg px-3 py-2.5 text-[14px] text-content placeholder:text-content/85"
                style={{
                  outline: "none",
                  WebkitAppearance: "none",
                  boxShadow: "none",
                }}
              />
            </section>
          )}

          {/* ── the list ─────────────────────────────────────────── */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
            {building ? (
              <div
                className="flex items-center justify-center gap-2 px-4 py-10 text-[12.5px] text-content/85"
                style={{
                  animation: "delayed-fade-in 140ms ease-out 200ms both",
                }}
              >
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200"
                  style={{ borderTopColor: TY_COLOR }}
                />
                Building the list...
              </div>
            ) : perf.view === "receipts" ? (
              shownReceipts.length === 0 ? (
                <Empty query={query} />
              ) : (
                shownReceipts.map((t) => (
                  <button
                    key={t.saleId}
                    type="button"
                    onClick={() => dispatch(openReceipt(t.saleId))}
                    className="block w-full border-t border-gray-100 px-3.5 py-3 text-left first:border-t-0 active:bg-bkg"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
                        #{receiptLabel(t.saleId)}
                      </span>
                      <span className="flex-none font-display text-[13px] font-bold tabular-nums text-content">
                        {formatCurrency2(t.amount)}
                      </span>
                      <ChevronRightIcon className="h-4 w-4 flex-none text-content/85" />
                    </div>
                    {/* Who, then when, then where. The person is what someone
                        is following; the lane matters once they have one. */}
                    <div className="mt-0.5 truncate text-[11px] tabular-nums text-content/85">
                      {[
                        t.cashierName,
                        t.day ? formatDateSimple(t.day) : "",
                        t.terminal ? `lane ${t.terminal}` : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </button>
                ))
              )
            ) : listRows.length === 0 ? (
              <Empty query="" />
            ) : (
              listRows.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() =>
                    dispatch(
                      perf.view === "stores"
                        ? selectEventStore({ key: r.key, label: r.label })
                        : selectEventCashier({ key: r.key, label: r.label }),
                    )
                  }
                  className="block w-full border-t border-gray-100 px-3.5 py-3 text-left first:border-t-0 active:bg-bkg"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
                      {r.label}
                    </span>
                    <span className="flex-none font-display text-[13px] font-bold tabular-nums text-content">
                      {measure === "amount"
                        ? formatCurrency2(r.amount)
                        : fmtInt(r.transactions)}
                    </span>
                    <ChevronRightIcon className="h-4 w-4 flex-none text-content/85" />
                  </div>
                  <div className="mt-0.5 truncate text-[11px] tabular-nums text-content/85">
                    {[
                      measure === "amount"
                        ? `${fmtInt(r.transactions)} transactions`
                        : formatCurrency2(r.amount),
                      r.sub,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  <div className="mt-2">
                    <PairedBars
                      ty={measure === "amount" ? r.amount : r.transactions}
                      ly={r.baseline ?? 0}
                      max={listMax}
                      labels={["WK", "AVG"]}
                      format={fmt}
                      compact
                    />
                  </div>
                </button>
              ))
            )}

            {!building &&
              (perf.view === "receipts"
                ? receipts.length > shownReceipts.length
                : rows.length > listRows.length) && (
                <button
                  type="button"
                  onClick={() => dispatch(showMoreEvents())}
                  className="block w-full border-t border-gray-100 py-3 text-center text-[12px] font-semibold active:bg-bkg"
                  style={{ color: TY_COLOR }}
                >
                  Show {ROWS_PER_PAGE} more
                  <span className="text-content/85">
                    {" "}
                    ·{" "}
                    {fmtInt(
                      (perf.view === "receipts"
                        ? receipts.length
                        : rows.length) -
                        (perf.view === "receipts"
                          ? shownReceipts.length
                          : listRows.length),
                    )}{" "}
                    left
                  </span>
                </button>
              )}
          </section>
        </div>
      </div>

      {openTxn && (
        <BottomSheet onClose={() => dispatch(closeReceipt())}>
          <Receipt
            txn={openTxn}
            lines={receipt}
            when={openTxn.day ? formatDateSimple(openTxn.day) : ""}
          />
        </BottomSheet>
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
  lines,
  when,
}: {
  txn: EventReceipt;
  lines: ReceiptLine[] | null;
  when: string;
}) => {
  const items = (lines ?? []).filter((l) => l.kind !== "tender");
  const tenders = (lines ?? []).filter((l) => l.kind === "tender");
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
        {lines === null ? (
          <div className="py-8 text-center font-mono text-[12px] text-content/85">
            Loading receipt...
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

const Empty = ({ query }: { query: string }) => (
  <div className="px-4 py-8 text-center text-[12.5px] text-content/85">
    {query
      ? `Nothing matches "${query}".`
      : "Nothing recorded for this selection."}
  </div>
);

export default EventPerfMobile;
