import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { setInvestigation } from "../../../../features/dev/devSalesLedgerSlice";
import { useDeptInvestigation } from "./hooks/useDeptInvestigation";
import { SUPPLY_LOOKBACK_DAYS, supplyWindow } from "./utils/investigationData";
import {
  CAUSE_LABEL,
  CAUSE_OWNER,
  CAUSE_TONE,
  type Cause,
  type ItemVerdict,
} from "./utils/deptInvestigation";
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import SortHeader from "../../../../components-dev/SortHeader";
import PageInfoButton from "../../../../components-dev/PageInfoButton";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import ColFilter from "../../../../components-dev/filters/ColFilterPopover";
import { colInputStyle } from "../../../../components-dev/filters/colFilterStyles";
import UpcContextMenu from "../../../../components-dev/UpcContextMenu";
import ItemEvidence from "./components/ItemEvidence";
import Bar from "./components/Bar";
import Waves from "./components/Waves";
import TabSkeleton from "./components/TabSkeleton";
import HoldsPanel from "./components/HoldsPanel";
import SupplyPanel from "./components/SupplyPanel";
import ActPanel from "./components/ActPanel";
import {
  desksOf,
  holdsUp,
  spreadOf,
  supplyOf,
  vitalsOf,
  type Desk,
} from "./utils/investigationSteps";
import {
  CAUSE_ORDER,
  cash,
  PAGE_ROWS,
  STAGE_NOTE,
  SUGGESTED,
  usDate,
} from "./utils";
import {
  COLUMNS,
  CSV_HEADERS,
  csvRow,
  label,
  ruleOf,
  sortValue,
  tintOf,
} from "./utils/columns";
import type { Col, FilterKind } from "./types";
import { rowsToCsv, downloadCsv } from "../../../../utils/csvExport";
import { useTriStateSort } from "../../../../utils/useTriStateSort";
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";

/**
 * Why this store is behind that one, in this department.
 *
 * The page's full-width state. It is reached from a row of the sub-department
 * comparison, and it takes the whole page rather than a panel because the
 * question has outgrown one: by this point the reader is four steps in, and a
 * fifth panel inside a panel is how a drill-down becomes unusable.
 *
 * Everything on screen is `shared/deptInvestigation`'s arithmetic. Nothing is
 * computed here.
 *
 * It fills in three waves — see `useDeptInvestigation`. The grid is readable
 * as soon as sales land; each item's cause sharpens behind it. That is stated
 * on screen rather than hidden, because a cause that changes while somebody
 * is reading it needs to say why.
 */

interface Props {
  gradingMetric: GradingMetric;
  twStart: string;
  twEnd: string;
  lwStart: string;
  lwEnd: string;
  lyStart: string;
  lyEnd: string;
}

const DeptInvestigation = ({
  gradingMetric,
  twStart,
  twEnd,
  lwStart,
  lwEnd,
  lyStart,
  lyEnd,
}: Props) => {
  const dispatch = useAppDispatch();
  const target = useAppSelector((state) => state.dev.salesLedger.investigation);
  const { sort, handleSort, applySort } = useTriStateSort<Col>();
  const [only, setOnly] = useState<Cause | null>(null);
  const [itemQ, setItemQ] = useState("");
  const [itemDraft, setItemDraft] = useState("");
  const [upcQ, setUpcQ] = useState("");
  const [upcDraft, setUpcDraft] = useState("");
  const [vendorQ, setVendorQ] = useState("");
  const [ctx, setCtx] = useState<{ x: number; y: number; upc: string } | null>(
    null,
  );
  /** Which item's evidence is open. Held here rather than in the slice: it
   *  belongs to this screen and means nothing once you leave it. */
  const [picked, setPicked] = useState<string | null>(null);
  /**
   * Which step is on screen.
   *
   * Tabs rather than one long scroll: the grid alone is three hundred rows,
   * and a page that puts the hand-off below it leaves the last step
   * reachable only by a shortcut. The three split on the WAVE boundary —
   * "holds" needs sales alone and draws at once, the other two wait — so the
   * structure carries the loading rather than fighting it.
   *
   * The cause filter is shared across them, so moving between steps keeps
   * whatever the reader had narrowed to.
   */
  const [tab, setTab] = useState<"holds" | "items" | "supply" | "act">("holds");

  const isQty = gradingMetric === "qty";
  const fmt = (v: number) =>
    isQty ? formatBigNumber(v, 0) : formatCurrency2(v);

  const args = useMemo(
    () => ({
      mine: {
        storeid: target?.storeid ?? 0,
        storeNumber: target?.storeNumber ?? "",
        name: target?.storeName ?? "",
        subDept: target?.subDept ?? 0,
      },
      theirs: {
        storeid: target?.compareStoreid ?? 0,
        storeNumber: target?.compareStoreNumber ?? "",
        name: target?.compareStoreName ?? "",
        subDept: target?.compareSubDept ?? 0,
      },
      tw: { start: twStart, end: twEnd },
      lw: { start: lwStart, end: lwEnd },
      ly: { start: lyStart, end: lyEnd },
      metric: gradingMetric,
      enabled: target !== null,
    }),
    [target, twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd, gradingMetric],
  );

  const { stage, items, summary, problem, sales, orders, receipts } =
    useDeptInvestigation(args);

  /* `stage` names the wave still OUTSTANDING. Sales answer the first two
     tabs; the last two need orders and deliveries as well, and a failure
     stops the waiting rather than hanging on it. */
  const salesIn = stage !== "sales";
  const allIn = stage === "done" || stage === "failed";

  /** Every vendor in the department, so the vendor filter is a list to pick
   *  from rather than a spelling to guess at. */
  const vendors = useMemo(
    () =>
      [...new Set(items.map((i) => i.vendorName).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [items],
  );

  const shown = useMemo(() => {
    const item = itemQ.trim().toLowerCase();
    const upc = upcQ.trim().toLowerCase();
    return items.filter(
      (i) =>
        (!only || i.cause === only) &&
        (!item || i.description.toLowerCase().includes(item)) &&
        (!upc || i.productCode.toLowerCase().includes(upc)) &&
        (!vendorQ || i.vendorName === vendorQ),
    );
  }, [items, only, itemQ, upcQ, vendorQ]);

  const pickedItem = useMemo(
    () => items.find((i) => i.productCode === picked) ?? null,
    [items, picked],
  );

  /**
   * An item chosen anywhere else lands on the page that holds it.
   *
   * The Summary tab's list and the hand-off's lists both pick an item and
   * switch to the grid. Without this the grid stays on page one and the
   * selected row is somewhere the reader cannot see, which reads as the
   * click having done nothing.
   */
  /**
   * Click, shift-click, ctrl-click — the three a grid is expected to answer.
   *
   * Shift measures from the anchor through the SORTED list rather than the
   * page, so a range that crosses a page boundary is still a range; what is
   * off-screen is still selected and still copies.
   */
  const pickRow = (
    e: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
    code: string,
  ) => {
    const add = e.ctrlKey || e.metaKey;
    if (e.shiftKey && anchor.current) {
      const a = sorted.findIndex((r) => r.productCode === anchor.current);
      const b = sorted.findIndex((r) => r.productCode === code);
      if (a >= 0 && b >= 0) {
        const span = sorted
          .slice(Math.min(a, b), Math.max(a, b) + 1)
          .map((r) => r.productCode);
        setChosen(new Set(add ? [...chosen, ...span] : span));
        return;
      }
    }
    anchor.current = code;
    if (add) {
      const next = new Set(chosen);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      setChosen(next);
      return;
    }

    /* A plain click opens the item. Shift and ctrl are what build a
       selection to copy, and they never open anything — so picking out
       nine rows does not throw the panel open nine times.

       Clicking the row that is already open closes it again, which is also
       the way back to nothing selected. */
    const only = chosen.size === 1 && chosen.has(code);
    setChosen(only ? new Set() : new Set([code]));
    if (only) setPicked(null);
    else show(code);
  };

  /** Picked out, either by the selection or by the rail. */
  const isOn = (code: string) => picked === code || chosen.has(code);

  const show = (code: string) => {
    const i = sorted.findIndex((r) => r.productCode === code);
    if (i >= 0) setPage(Math.floor(i / PAGE_ROWS));
    setPicked(code);
  };

  /* The three steps the grid does not answer. All three are arithmetic over
     items already in hand, so changing tab asks for nothing. */
  const holds = useMemo(
    () => holdsUp(items, target?.focus ?? "unknown"),
    [items, target?.focus],
  );
  const spread = useMemo(() => spreadOf(items), [items]);
  const vitals = useMemo(() => vitalsOf(items), [items]);
  const supply = useMemo(
    () => supplyOf(orders, receipts, items),
    [orders, receipts, items],
  );
  const desks = useMemo(() => desksOf(items, cash), [items]);

  /**
   * The last item the rail showed, kept through the close.
   *
   * The rail slides out over 200ms, and unmounting its contents on the frame
   * the selection clears would empty the panel before it has finished moving
   * — the slide would be of a blank box. Written during render deliberately:
   * an effect would run a frame late, which is exactly the frame that shows.
   */
  const lastEvidence = useRef<ItemVerdict | null>(null);
  if (pickedItem) lastEvidence.current = pickedItem;
  const evidence = pickedItem ?? lastEvidence.current;

  const filterActive = (k: FilterKind) =>
    k === "item"
      ? !!itemQ
      : k === "upc"
        ? !!upcQ
        : k === "vendor"
          ? !!vendorQ
          : only !== null;

  /** Text filters commit on Apply; the two pickers have already committed by
   *  the time the button is reachable, so Apply just closes the popover. */
  const applyFilter = (k: FilterKind) => {
    if (k === "item") setItemQ(itemDraft);
    if (k === "upc") setUpcQ(upcDraft);
  };

  const clearFilter = (k: FilterKind) => {
    if (k === "item") {
      setItemQ("");
      setItemDraft("");
    }
    if (k === "upc") {
      setUpcQ("");
      setUpcDraft("");
    }
    if (k === "vendor") setVendorQ("");
    if (k === "cause") setOnly(null);
  };

  /** One desk's list, named for who it is going to. The whole-grid export
   *  in the header is a different file and says so. */
  const exportDesk = (d: Desk) => {
    if (!target) return;
    const name = [
      target.storeNumber,
      target.subDeptName.replace(/[^A-Za-z0-9]+/g, "-"),
      CAUSE_LABEL[d.cause].replace(/[^A-Za-z0-9]+/g, "-"),
      twEnd,
    ].join("_");
    downloadCsv(rowsToCsv(CSV_HEADERS, d.items.map(csvRow)), `${name}.csv`);
  };

  /** Everything the filters left, not the 300 that are drawn. */
  const exportCsv = () => {
    if (!target) return;
    const name = [
      "investigation",
      target.storeNumber,
      target.subDeptName.replace(/[^A-Za-z0-9]+/g, "-"),
      twEnd,
    ].join("_");
    downloadCsv(rowsToCsv(CSV_HEADERS, sorted.map(csvRow)), `${name}.csv`);
  };

  /**
   * Copying by CAUSE rather than by severity.
   *
   * The shared menu offers critical/watch/healthy out of the box, which are
   * threshold grades and mean nothing here. Causes are what somebody acts on:
   * the never-ordered list goes to a buyer and the didn't-arrive list goes to
   * a vendor, so those are the two lists worth having on a clipboard.
   *
   * Over the FILTERED set, so what gets copied is what is on screen.
   */
  const copyActions = CAUSE_ORDER.filter((c) => c !== "ahead")
    .map((c) => ({
      cause: c,
      upcs: shown.filter((i) => i.cause === c).map((i) => i.productCode),
    }))
    .filter((g) => g.upcs.length > 0)
    .map((g) => ({
      label: `Copy ${CAUSE_LABEL[g.cause].toLowerCase()} UPCs · ${g.upcs.length}`,
      onClick: () => navigator.clipboard.writeText(g.upcs.join(", ")),
    }));
  /** Which page of the grid is showing, from 0. */
  const [page, setPage] = useState(0);

  /** Codes the Supply tab is narrowed to, carried over from the grid. */
  const [supplyUpcs, setSupplyUpcs] = useState("");

  /**
   * Rows picked out, by product code.
   *
   * The grid is a spreadsheet to everybody who uses one, and the thing they
   * try first is dragging across rows to take them somewhere else. Click
   * selects, shift extends, ctrl adds, and the copy keys put it on the
   * clipboard as tab-separated text — which is what a spreadsheet pastes.
   *
   * Opening the evidence moves to a double click for the same reason: a
   * single click on a spreadsheet row selects it, and a panel that opened
   * on the way to selecting three rows would be in the way three times.
   */
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  /** Where a shift-range measures from. */
  const anchor = useRef<string | null>(null);

  const sorted = applySort(shown, (row, col) => sortValue(row, col));
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_ROWS));
  /* Clamped rather than reset: a filter that shortens the list below the
     current page should land on the last one, not throw the reader back to
     the first. */
  const at_ = Math.min(page, pages - 1);

  /**
   * The page numbers worth printing: the first, the last, and a few either
   * side of where you are, with gaps for the rest.
   *
   * Two hundred pages of buttons is not navigation. `null` is a gap.
   */
  const pageWindow: (number | null)[] = (() => {
    if (pages <= 7) return [...Array(pages).keys()];
    const near = new Set([0, pages - 1, at_, at_ - 1, at_ + 1]);
    const out: (number | null)[] = [];
    for (let p = 0; p < pages; p += 1) {
      if (near.has(p)) out.push(p);
      else if (out[out.length - 1] !== null) out.push(null);
    }
    return out;
  })();
  const from = at_ * PAGE_ROWS;
  const capped = sorted.slice(from, from + PAGE_ROWS);

  if (!target) return null;

  const supply_ = supplyWindow({ start: twStart, end: twEnd });
  const byCause = new Map(summary.byCause.map((c) => [c.cause, c]));
  /**
   * Sales and margin can point opposite ways, and the headline has to say so.
   *
   * A department can sell more than its counterpart and keep less, because it
   * buys the same goods for more. Reporting only the sales gap calls that a
   * win — which is the thing the cost cause exists to catch, so the sentence
   * at the top cannot go on ignoring it.
   */
  const marginGap = items.reduce((a, i) => a + i.margins.diff, 0);
  const costPenalty = items.reduce(
    (a, i) => a + Math.min(0, i.margins.costPenalty ?? 0),
    0,
  );

  const suggested = SUGGESTED[target.focus ?? ""] ?? [];

  /** Stepping walks the list the GRID is showing, not every item in the
   *  department: arrowing through "never ordered" should not wander out of
   *  it halfway down. It walks the whole filtered list rather than the
   *  page, because a page boundary is a fact about the table and not about
   *  the items — the page follows the rail instead. */
  const at = sorted.findIndex((r) => r.productCode === picked);
  const stepItem = (d: number) => {
    const next = sorted[at + d];
    if (next) setPage(Math.floor((at + d) / PAGE_ROWS));
    if (next) setPicked(next.productCode);
  };

  /**
   * Going back takes as long as it looks like it takes.
   *
   * Unmounting on the click swapped a full page for another full page
   * between two frames, which reads as a jump cut rather than as going
   * back. The notebook plays its exit first and drops itself after, so the
   * ledger arrives into space the notebook has already left.
   */
  const [leaving, setLeaving] = useState(false);
  const close = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => dispatch(setInvestigation(null)), 220);
  };

  /* Escape goes back, the way it does everywhere else that opens over the
     page. Bound to the document because the focus may be anywhere inside
     three hundred rows by the time somebody wants out. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [leaving]);

  /* The way out takes the focus on arrival: it is where a reader who came
     in by keyboard expects to be, and it is the one control on the page
     that is in the same place on every tab. */
  const backRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    backRef.current?.focus({ preventScroll: true });
  }, []);

  /** True for as long as the entrance runs, so it plays once. */
  const [fresh, setFresh] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setFresh(false), 700);
    return () => window.clearTimeout(t);
  }, []);

  /**
   * The bar's own content.
   *
   * Named for what each one IS rather than for the question it answers:
   * three questions in a row read as a quiz, and numbering them 1, 3 and 5
   * left two gaps nobody could account for. The conclusion beneath each name
   * is where the question gets answered.
   *
   * `answer` is a thunk because a tab that is still waiting must not
   * evaluate a conclusion it does not have yet.
   */
  /* The conclusion a tab has reached, in as few words as will carry it.
     These are read four at a time across the top of the page, so a phrase
     that is fine on its own becomes a paragraph here — the tab says what it
     found, and the tab itself says the rest. */
  const TABS = [
    {
      key: "holds" as const,
      title: "Summary",
      needsAll: false,
      answer: () => (holds.verdict === "holds" ? "Holds" : "Doesn’t hold"),
    },
    {
      key: "items" as const,
      title: "Items",
      needsAll: true,
      answer: () => {
        const lead = summary.byCause.find(
          (c) => c.cause !== "ahead" && c.dollars < 0,
        );
        return lead ? CAUSE_LABEL[lead.cause] : "Nothing behind";
      },
    },
    {
      key: "supply" as const,
      title: "Supply",
      needsAll: true,
      answer: () => `${supply.mine.orders} vs ${supply.theirs.orders} orders`,
    },
    {
      key: "act" as const,
      title: "Hand-off",
      needsAll: true,
      answer: () => {
        const owned = desks.filter((d) => d.actionable);
        return owned.length
          ? `${owned.length} ${owned.length === 1 ? "list" : "lists"}`
          : "No lists";
      },
    },
  ];

  return (
    <div
      className={`h-full flex flex-col overflow-hidden bg-custom-white rounded-xl shadow-card-sm ${
        leaving ? "animate-nb-leave" : ""
      }`}
    >
      {/* The chrome arrives before the contents, top down: the header says
          where you are, the tabs say what is here, and the panel fills in
          under them. Arriving all at once read as a page swap. */}
      <div className="flex-shrink-0 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-2.5 bg-brand_navy animate-nb-drop motion-reduce:animate-none">
        {/* Where you came from: the way out, the department, and the week
            it is read over. */}
        <span className="flex items-center gap-2.5 min-w-0 justify-self-start">
          <button
            ref={backRef}
            onClick={close}
            title="Back to the comparison"
            className="flex-shrink-0 text-custom-white text-[12.5px] font-semibold hover:underline rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-custom-white/70"
          >
            ‹ Back
          </button>
          <span className="flex-shrink-0 text-[12.5px] text-custom-white/50">
            |
          </span>
          <span className="text-[12.5px] font-semibold text-custom-white truncate">
            {target.subDeptName}
          </span>
          <span
            data-help="supply-window"
            className="hidden lg:inline flex-shrink-0 text-[12.5px] font-semibold text-custom-white/85 whitespace-nowrap tabular-nums"
          >
            {usDate(twStart)} &ndash; {usDate(twEnd)}
          </span>
        </span>

        {/* What you are reading. The only part that differs between two open
            investigations, so it takes the middle -- and the only part in
            bold, where the rest of the bar is semibold. */}
        <span className="flex items-center gap-2 min-w-0 justify-self-center text-[13px]">
          <span className="w-2.5 h-2.5 rounded-full bg-store_open flex-shrink-0" />
          <span className="font-bold text-custom-white truncate">
            {target.storeName}
          </span>
          <span className="flex-shrink-0 font-semibold text-custom-white/85">
            vs
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-store_compare flex-shrink-0" />
          <span className="font-bold text-custom-white truncate">
            {target.compareStoreName}
          </span>
        </span>

        <span className="flex items-center gap-3 justify-self-end">
          {/* Only while something is still coming. Three lit lamps said
              nothing, forever, in the busiest strip on the page. */}
          {!allIn && <Waves sales={salesIn} all={allIn} />}
          <button
            data-help="export"
            onClick={exportCsv}
            disabled={sorted.length === 0}
            title={
              sorted.length === 0
                ? "Nothing to export yet"
                : "Every filtered row, as a CSV"
            }
            aria-label="Export CSV"
            className="flex-shrink-0 text-custom-white hover:text-custom-white/80 disabled:opacity-40 disabled:hover:text-custom-white transition-colors rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-custom-white/70"
          >
            <ArrowDownTrayIcon className="w-[18px] h-[18px]" />
          </button>
          <PageInfoButton
            page="sales-investigate"
            variant="navy"
            title="How this report works"
          />
        </span>
      </div>

      {/*
        The steps, as tabs.

        One scrolling page would put the hand-off below three hundred rows of
        grid, where only a shortcut reaches it. The three split on the WAVE
        boundary: the first needs sales alone and draws at once, the other
        two wait for orders and deliveries — so a tab that is not ready says
        what it is waiting for rather than showing a figure that will move.

        Each carries its own conclusion once it has one, so the bar is a
        summary of the whole notebook and not just a way to move around it.
      */}
      <div
        data-help="tabs"
        className="flex-shrink-0 grid grid-cols-4 border-b border-brand_navy/15 animate-nb-drop motion-reduce:animate-none"
        style={{ animationDelay: "70ms" }}
      >
        {TABS.map((t) => {
          const waiting = t.needsAll ? !allIn : !salesIn;
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-current={on}
              className={`text-left px-4 py-2 border-b-2 transition-colors min-w-0 ${
                on
                  ? "border-brand_navy bg-custom-white"
                  : "border-transparent hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center gap-2">
                {/* Ready or not, without spending a numeral on it. */}
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    waiting
                      ? "border border-content/40"
                      : on
                        ? "bg-brand_navy"
                        : "bg-content/40"
                  }`}
                />
                <span className="text-[13.5px] font-bold text-content">
                  {t.title}
                </span>
              </span>
              {/* A bar rather than a word. "Waiting on orders" under four
                  tabs at once read as four problems; a bar is plainly a
                  figure that has not arrived. */}
              {waiting ? (
                <span className="block mt-1.5 mb-1 pl-[15px]">
                  <Bar w="72%" h={10} />
                </span>
              ) : (
                <span className="block text-[12px] mt-0.5 truncate text-content/85">
                  {t.answer()}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {problem ? (
        <div className="flex-1 flex items-center justify-center px-6 text-center text-[13px] text-content/85">
          {problem}
        </div>
      ) : (
        /* Once, on arrival. Replaying it on every tab switch would put
           a third of a second between the click and the answer, which
           is the opposite of what the notebook is for. */
        <div
          className={`flex-1 min-h-0 flex flex-col overflow-hidden ${
            fresh ? "animate-nb-rise motion-reduce:animate-none" : ""
          }`}
          style={fresh ? { animationDelay: "130ms" } : undefined}
        >
          {tab === "holds" && !salesIn && <TabSkeleton tab="holds" />}
          {tab === "items" && !salesIn && <TabSkeleton tab="items" />}
          {tab === "supply" && !allIn && <TabSkeleton tab="supply" />}
          {tab === "act" && !allIn && <TabSkeleton tab="act" />}

          {tab === "holds" && salesIn && (
            <HoldsPanel
              holds={holds}
              spread={spread}
              summary={summary}
              them={target.compareStoreName}
              vitals={vitals}
              cash={cash}
              marginGap={marginGap}
              costPenalty={costPenalty}
              onPickItem={(code) => {
                show(code);
                setTab("items");
              }}
              onVendor={(v) => {
                setVendorQ(v);
                setTab("items");
              }}
              onSeeAll={() => {
                setOnly(null);
                setTab("items");
              }}
            />
          )}

          {tab === "supply" && allIn && (
            <SupplyPanel
              supply={supply}
              us={target.storeName}
              them={target.compareStoreName}
              window={supply_}
              cash={cash}
              orders={orders}
              receipts={receipts}
              upcQuery={supplyUpcs}
              onUpcQuery={setSupplyUpcs}
            />
          )}

          {tab === "act" && allIn && (
            <ActPanel
              desks={desks}
              cash={cash}
              onShow={(c) => {
                setOnly(c);
                setTab("items");
              }}
              onExport={exportDesk}
              onPickItem={(code) => {
                show(code);
                setTab("items");
              }}
            />
          )}

          {/* The grid stays MOUNTED behind `hidden` rather than being
              unmounted with the tab. Three hundred rows is too much to
              rebuild on every switch, and keeping it alive preserves the
              scroll position and the active filter — which matters, because
              step 5's "Show in grid" lands the reader in it.

              The Data Export preview's grid: one real table, every cell
              ruled, mono at 11px, a sticky heading row and a sticky row
              number. Dense is the point — a department is hundreds of items
              and an airy list shows eight of them. */}
          <div
            hidden={tab !== "items" || !salesIn}
            className={
              tab === "items" && salesIn
                ? "flex-1 min-h-0 flex flex-col overflow-hidden"
                : ""
            }
          >
            <div
              data-help="causes"
              className="flex-shrink-0 px-4 py-2.5 border-b border-brand_navy/15"
            >
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setOnly(null)}
                  className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border transition-shadow ${
                    only === null
                      ? "bg-filter_active border-filter_active_border text-content ring-2 ring-filter_active_border shadow-card-sm"
                      : "bg-custom-white border-brand_line text-content hover:bg-gray-50"
                  }`}
                >
                  All {items.length} items
                </button>
                {!allIn &&
                  [120, 148, 132].map((w) => (
                    <span key={w} className="py-1">
                      <Bar w={`${w}px`} h={22} />
                    </span>
                  ))}
                {allIn &&
                  CAUSE_ORDER.filter((c) => byCause.has(c)).map((c) => {
                    const t = byCause.get(c);
                    return (
                      <button
                        key={c}
                        onClick={() => setOnly(only === c ? null : c)}
                        title={
                          suggested.includes(c)
                            ? `${CAUSE_OWNER[c]} — where this department's shape points`
                            : CAUSE_OWNER[c]
                        }
                        className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border transition-shadow ${
                          CAUSE_TONE[c].chip
                        } ${
                          suggested.includes(c)
                            ? "border-dashed border-content/40"
                            : "border-transparent"
                        } ${only === c ? `ring-2 shadow-card-sm ${CAUSE_TONE[c].ring}` : ""}`}
                      >
                        {CAUSE_LABEL[c]}
                        <span className="ml-1.5 font-normal tabular-nums">
                          {t?.items} · {fmt(Math.abs(t?.dollars ?? 0))}
                        </span>
                      </button>
                    );
                  })}
              </div>

              {/* The windows do not line up, and the screen says so rather than
                letting the grid imply every column is diagnosed. */}
              <p className="text-[13px] text-content/85 mt-2.5">
                Causes explain this week against {target.compareStoreName}.
                Orders and receipts are read over {SUPPLY_LOOKBACK_DAYS} days (
                {supply_.start} to {supply_.end}) — they cannot account for the
                LW or LY columns.
                {STAGE_NOTE[stage] && (
                  <span className="ml-1.5 font-semibold">
                    {STAGE_NOTE[stage]}
                  </span>
                )}
              </p>
            </div>

            <div className="relative flex-1 min-h-0 flex overflow-hidden">
              {/* The grid and the strip under it are one column of the row; the
              rail is the other. Left as siblings of the rail the pager
              became a SECOND column — the grid shrank to its own width and
              the pager floated in the middle of the space beside it. */}
              <div
                data-help="grid"
                className="flex-1 min-w-0 flex flex-col overflow-hidden"
              >
                <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
                  <table className="border-collapse font-mono text-[11px] w-max">
                    <thead>
                      <tr>
                        <th className="sticky top-0 left-0 z-30 w-[44px] bg-bkg border-b border-brand_line_2 border-r border-brand_line px-2 py-1.5"></th>
                        {COLUMNS.map((c) => (
                          <th
                            key={c.key}
                            style={{ minWidth: c.width }}
                            className={`sticky top-0 z-10 border-b border-brand_line_2 border-r border-brand_line px-2.5 py-1.5 text-left font-semibold whitespace-nowrap ${ruleOf(c)} ${tintOf(c) || "bg-custom-white"}`}
                          >
                            {c.filter ? (
                              <ColFilter
                                label={label(c, target)}
                                labelSize="text-[11px]"
                                active={filterActive(c.filter)}
                                onApply={() =>
                                  applyFilter(c.filter as FilterKind)
                                }
                                onClear={() =>
                                  clearFilter(c.filter as FilterKind)
                                }
                              >
                                {c.filter === "item" && (
                                  <input
                                    autoFocus
                                    style={colInputStyle}
                                    placeholder="Search item…"
                                    value={itemDraft}
                                    onChange={(e) =>
                                      setItemDraft(e.target.value)
                                    }
                                  />
                                )}
                                {c.filter === "upc" && (
                                  <input
                                    autoFocus
                                    style={colInputStyle}
                                    placeholder="Search UPC…"
                                    value={upcDraft}
                                    onChange={(e) =>
                                      setUpcDraft(e.target.value)
                                    }
                                  />
                                )}
                                {/* Vendor and cause are both closed sets, so they
                              are picked rather than typed — a vendor name is
                              not something anyone spells from memory. They
                              apply on change, since there is nothing to
                              finish typing. */}
                                {c.filter === "vendor" && (
                                  <select
                                    style={colInputStyle}
                                    value={vendorQ}
                                    onChange={(e) => setVendorQ(e.target.value)}
                                  >
                                    <option value="">Every vendor</option>
                                    {vendors.map((v) => (
                                      <option key={v} value={v}>
                                        {v}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                {c.filter === "cause" && (
                                  <select
                                    style={colInputStyle}
                                    value={only ?? ""}
                                    onChange={(e) =>
                                      setOnly(
                                        (e.target.value ||
                                          null) as Cause | null,
                                      )
                                    }
                                  >
                                    <option value="">Every cause</option>
                                    {CAUSE_ORDER.filter((x) =>
                                      byCause.has(x),
                                    ).map((x) => (
                                      <option key={x} value={x}>
                                        {CAUSE_LABEL[x]}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </ColFilter>
                            ) : c.sort ? (
                              <SortHeader
                                col={c.sort}
                                label={label(c, target)}
                                sort={sort}
                                onSort={handleSort}
                                className="text-[11px] font-semibold uppercase tracking-wide text-content/85 hover:text-content"
                              />
                            ) : (
                              <span className="uppercase tracking-wide text-content/85">
                                {label(c, target)}
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    {/* No zebra stripe: every cell is ruled, which is what
                  separates the rows here, and the sticky number column is
                  opaque white — a stripe would stop dead under it. */}
                    <tbody>
                      {capped.map((r, i) => (
                        <tr
                          key={r.productCode}
                          onClick={(e) => pickRow(e, r.productCode)}
                          className="cursor-pointer select-none"
                          onContextMenu={(e) => {
                            e.preventDefault();
                            /* Right-clicking outside the selection selects that
                         row first, the way a grid does: otherwise the menu
                         offers to copy nine rows that are nowhere near the
                         one under the cursor. Inside it, the selection
                         stands. */
                            if (!chosen.has(r.productCode)) {
                              anchor.current = r.productCode;
                              setChosen(new Set([r.productCode]));
                            }
                            setCtx({
                              x: e.clientX,
                              y: e.clientY,
                              upc: r.productCode,
                            });
                          }}
                        >
                          {/* The whole row, not just the gutter. The store
                        columns paint their own tint, so a selected row used
                        to show the fill on the index alone and nowhere else
                        — the fill wins over the tint while the row is
                        picked out, and the tints come back when it is not. */}
                          <td
                            className={`sticky left-0 z-10 border-r border-brand_line border-b border-brand_line px-2 py-1.5 text-right ${
                              isOn(r.productCode)
                                ? "bg-row_selected border-row_selected_border border-l-2 font-bold text-content"
                                : "bg-custom-white text-content/85"
                            }`}
                          >
                            {i + 1}
                          </td>
                          {COLUMNS.map((c) => (
                            <td
                              key={c.key}
                              className={`border-r border-b border-brand_line px-2.5 py-1.5 whitespace-nowrap ${c.right ? "text-right" : ""} ${
                                isOn(r.productCode)
                                  ? "bg-row_selected"
                                  : tintOf(c)
                              }`}
                            >
                              {/* Masked until the orders and deliveries are in.
                            Every item reads "not moving" on sales alone,
                            which is a different accusation from the one it
                            will carry a second later — and the reader may
                            have acted on it by then. */}
                              {c.key === "cause" && !allIn ? (
                                <Bar w="88%" h={14} />
                              ) : (
                                c.render(r, fmt)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>

                    {/* Sticky to the bottom of the scroller, so the totals are
                  readable from the first row as well as the last. Over the
                  whole filtered set rather than this page: a total of fifty
                  rows is not a total of anything anybody asked about. */}
                    {capped.length > 0 && (
                      <tfoot>
                        <tr>
                          <td className="sticky bottom-0 left-0 z-30 bg-bkg border-t-2 border-t-brand_line_2 border-r border-brand_line px-2 py-1.5" />
                          {COLUMNS.map((c) => (
                            <td
                              key={c.key}
                              className={`sticky bottom-0 z-20 border-t-2 border-t-brand_line_2 border-r border-brand_line px-2.5 py-1.5 font-bold whitespace-nowrap ${
                                c.right ? "text-right" : ""
                              } ${tintOf(c) || "bg-bkg"}`}
                            >
                              {c.foot ? c.foot(shown, fmt) : null}
                            </td>
                          ))}
                        </tr>
                      </tfoot>
                    )}
                  </table>

                  {capped.length === 0 && stage !== "sales" && (
                    <div className="px-4 py-8 text-center text-[12.5px] text-content/85">
                      Nothing in this department to compare.
                    </div>
                  )}
                </div>

                {/* Outside the scroller, so it stays put while the rows move. The
              totals row above it is over the whole filtered set, not this
              page — which is the figure anybody reading totals wants. */}
                {sorted.length > 0 && (
                  <div className="flex-shrink-0 flex items-center gap-3 flex-wrap px-4 py-2 border-t border-brand_line bg-custom-white text-[12.5px] text-content/85">
                    <span>
                      <span className="font-semibold text-content tabular-nums">
                        {(from + 1).toLocaleString("en-US")}–
                        {Math.min(
                          from + PAGE_ROWS,
                          sorted.length,
                        ).toLocaleString("en-US")}
                      </span>{" "}
                      of {sorted.length.toLocaleString("en-US")}
                      {sorted.length !== items.length &&
                        ` filtered from ${items.length.toLocaleString("en-US")}`}{" "}
                      &middot; ordered by the biggest difference &middot;{" "}
                      {chosen.size > 0 ? (
                        <span className="font-semibold text-content">
                          {chosen.size.toLocaleString("en-US")} selected
                        </span>
                      ) : (
                        "click a row for its evidence"
                      )}
                    </span>

                    {pages > 1 && (
                      <span className="ml-auto flex items-center gap-1">
                        <button
                          onClick={() => setPage(Math.max(0, at_ - 1))}
                          disabled={at_ === 0}
                          className="px-2.5 py-1 rounded-md font-semibold hover:bg-bkg disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
                        >
                          {"‹"} Prev
                        </button>

                        {/* Numbered, in a window around where you are. Prev and
                      Next alone made page 5 of 5 four presses away and gave
                      no sense of how much was behind the page in view. */}
                        {pageWindow.map((p, i) =>
                          p === null ? (
                            <span
                              key={`gap${i}`}
                              className="px-1 text-content/85"
                            >
                              &hellip;
                            </span>
                          ) : (
                            <button
                              key={p}
                              onClick={() => setPage(p)}
                              aria-current={p === at_}
                              className={`min-w-[28px] px-2 py-1 rounded-md font-semibold tabular-nums transition-colors ${
                                p === at_
                                  ? "bg-brand_navy text-custom-white"
                                  : "hover:bg-bkg text-content"
                              }`}
                            >
                              {p + 1}
                            </button>
                          ),
                        )}

                        <button
                          onClick={() => setPage(Math.min(pages - 1, at_ + 1))}
                          disabled={at_ >= pages - 1}
                          className="px-2.5 py-1 rounded-md font-semibold hover:bg-bkg disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
                        >
                          Next {"›"}
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/*
            The rail lays OVER the grid rather than beside it.

            Taking its 520px out of the row reflowed every column underneath
            it, so opening a row moved the row that was opened. Over the top
            nothing behind it shifts, and the columns a reader was reading
            are still where they were when the rail closes.

            It slides in rather than appearing, and carries a shadow heavy
            enough to read as a layer — against a dense grid a plain white
            panel reads as a hole in it.
          */}
              <div
                data-help="evidence"
                className={`absolute top-0 right-0 bottom-0 z-20 w-[520px] shadow-rail transition-transform duration-200 ease-out motion-reduce:transition-none ${
                  pickedItem ? "translate-x-0" : "translate-x-full"
                }`}
                aria-hidden={!pickedItem}
              >
                <div className="w-[520px] h-full border-l-2 border-brand_navy/25">
                  {evidence && target && (
                    <ItemEvidence
                      item={evidence}
                      openStoreName={target.storeName}
                      openStoreNumber={target.storeNumber}
                      compareStoreName={target.compareStoreName}
                      compareStoreNumber={target.compareStoreNumber}
                      mineOrders={orders.mine}
                      theirsOrders={orders.theirs}
                      mineReceipts={receipts.mine}
                      theirsReceipts={receipts.theirs}
                      minePoints={sales?.minePoints ?? []}
                      theirsPoints={sales?.theirsPoints ?? []}
                      supplyReady={stage === "done"}
                      position={{
                        at: Math.max(0, at),
                        of: sorted.length,
                        within: only ? CAUSE_LABEL[only] : null,
                      }}
                      onStep={stepItem}
                      onClose={() => setPicked(null)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {ctx && (
            <UpcContextMenu
              x={ctx.x}
              y={ctx.y}
              upc={ctx.upc}
              allUpcs={shown.map((i) => i.productCode)}
              extraActions={
                /* The selection first, because a reader who has just picked
                   out nine rows is right-clicking about those nine rows.
                   "Ctrl-C" in a status strip is a thing you have to already
                   know; a menu item is a thing you find. */
                chosen.size > 0
                  ? [
                      {
                        /* The question a buyer asks of a never-ordered item
                           is "was it ever on an order at all" — which is
                           two tabs away and, until now, a UPC retyped by
                           hand. */
                        label: `Find ${chosen.size} in orders and receipts`,
                        onClick: () => {
                          setSupplyUpcs([...chosen].join(" "));
                          setTab("supply");
                        },
                      },
                      ...copyActions,
                    ]
                  : copyActions
              }
              onClose={() => setCtx(null)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DeptInvestigation;
