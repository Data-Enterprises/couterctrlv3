import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import {
  setInvestigation,
  type InvestigationTarget,
} from "../../../../features/dev/devSalesLedgerSlice";
import { useDeptInvestigation, type Stage } from "../hooks/useDeptInvestigation";
import {
  SUPPLY_LOOKBACK_DAYS,
  supplyWindow,
} from "../shared/investigationData";
import type { Cause, ItemVerdict, Summary } from "../shared/deptInvestigation";
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import SortHeader from "../../../../components-dev/SortHeader";
import ColFilter from "../../../../components-dev/filters/ColFilterPopover";
import { colInputStyle } from "../../../../components-dev/filters/colFilterStyles";
import UpcContextMenu from "../../../../components-dev/UpcContextMenu";
import ItemEvidence from "./ItemEvidence";
import {
  desksOf,
  holdsUp,
  spreadOf,
  supplyOf,
  supplySays,
  vitalsOf,
  OWNER_LABEL,
  type Desk,
  type Holds,
  type Spread,
  type Supply,
  type SupplyRecord,
  type Vitals as VitalsShape,
} from "../shared/investigationSteps";
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

type Col =
  | "mine" | "theirs" | "gap"
  | "mineLw" | "theirsLw" | "mineLy" | "theirsLy"
  | "mineUnits" | "theirsUnits"
  | "mineCost" | "theirsCost" | "costPenalty" | "marginDiff"
  | "price" | "sellThrough" | "ordered" | "received";

/**
 * How many rows are drawn.
 *
 * A department is hundreds of items and the table is one DOM node per cell,
 * so the whole of Soft Drinks is forty thousand of them. The list is ordered
 * by the biggest difference, which means the tail is the part nobody scrolls
 * to — and the cause chips above narrow the set when somebody does want it.
 * The footer says how many were left out rather than pretending this is all
 * of them.
 */
const ROW_CAP = 300;

const CAUSE_LABEL: Record<Cause, string> = {
  "never-ordered": "Never ordered",
  "not-received": "Didn't arrive",
  cost: "Costing more",
  "not-moving": "Not moving",
  "price-mix": "Price / mix",
  ahead: "We're ahead",
  unclassified: "No cause found",
};

/** Who owns the fix. The whole reason the causes are named separately is that
 *  they go to three different people. */
const CAUSE_OWNER: Record<Cause, string> = {
  "never-ordered": "buyer",
  "not-received": "vendor",
  cost: "buying terms",
  "not-moving": "merchandising",
  "price-mix": "same units, less money",
  ahead: "ours to keep",
  unclassified: "worth a look",
};

/**
 * One tone per cause, worn everywhere that cause appears.
 *
 * The same shape Item Actions uses for its piles: the chip carries its colour
 * all the time, and selecting it adds a ring in its own tone rather than
 * swapping the fill for a generic highlight. A chip that only colours itself
 * once you click it cannot be scanned, which is the whole job of the row.
 *
 * Six distinct hues rather than three greys, because these go to six
 * different people. `GapBreakdown` paints the same causes in the same
 * order — a cause that is violet here and grey in the treemap is two
 * findings as far as a reader is concerned.
 */
const CAUSE_TONE: Record<Cause, { chip: string; ring: string }> = {
  "never-ordered": {
    chip: "bg-severity_critical_bg text-severity_critical_text",
    ring: "ring-severity_critical_text/40",
  },
  "not-received": {
    chip: "bg-severity_watch_bg text-severity_watch_text",
    ring: "ring-severity_watch_text/40",
  },
  // Violet, the tone Item Actions gives anything that is settled with a
  // vendor rather than on the shelf. Buying terms are exactly that.
  cost: { chip: "bg-violet-50 text-violet-900", ring: "ring-violet-900/40" },
  "not-moving": { chip: "bg-blue-50 text-blue-900", ring: "ring-blue-900/40" },
  "price-mix": { chip: "bg-cyan-50 text-cyan-900", ring: "ring-cyan-900/40" },
  ahead: {
    chip: "bg-delta_positive_bg text-delta_positive_text",
    ring: "ring-delta_positive_text/40",
  },
  // Grey is the honest colour for "we could not say". Giving it a hue would
  // put it on the same footing as the five findings that mean something.
  unclassified: { chip: "bg-gray-100 text-content/85", ring: "ring-content/30" },
};

/** What is still outstanding, and what the screen cannot say yet because of
 *  it. A cause that sharpens as data lands has to explain itself. */
const STAGE_NOTE: Record<Stage, string | null> = {
  sales: "Loading this department's items…",
  orders: "Reading orders — until they land, nothing can be called never ordered.",
  receipts:
    "Reading deliveries — until they land, a vendor's miss cannot be told from a merchandising one.",
  done: null,
  failed: null,
};

/* ------------------------------------------------------------------ */
/* One card at a time                                                  */
/* ------------------------------------------------------------------ */

export interface Slide {
  label: string;
  /** Printed in the tab. A zero is worth saying — an empty deliveries list
   *  is the finding, not a missing section. */
  count?: number;
  body: ReactNode;
}

/**
 * Several cards in one card's space.
 *
 * Three supporting cards stacked down a column made the page a scroll, and
 * the third was never read. They are peers — three ways of asking the same
 * question — so they share one frame and the reader picks. Named tabs
 * rather than dots alone, because a dot does not say what it hides.
 *
 * It is a scroll container, so a trackpad swipe works and the tabs stay
 * honest about where it ended up.
 */
const Carousel = ({ slides }: { slides: Slide[] }) => {
  const track = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const n = Math.max(0, Math.min(slides.length - 1, i));
    el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
    setAt(n);
  };

  return (
    <div className="rounded-lg bg-custom-white shadow-md overflow-hidden flex flex-col min-w-0">
      <div className="flex items-center gap-0.5 px-2 pt-1.5 border-b border-brand_navy/15">
        {slides.map((sl, i) => (
          <button
            key={sl.label}
            onClick={() => go(i)}
            aria-current={i === at}
            className={`relative px-2.5 pt-1.5 pb-2 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${
              i === at ? "text-content" : "text-content/85 hover:text-content"
            }`}
          >
            {sl.label}
            {sl.count !== undefined && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-bkg text-[10px] tabular-nums tracking-normal">
                {sl.count}
              </span>
            )}
            {i === at && (
              <span className="absolute left-1.5 right-1.5 -bottom-px h-0.5 bg-brand_navy" />
            )}
          </button>
        ))}

        <span className="ml-auto flex gap-1 pb-1">
          {[-1, 1].map((step) => (
            <button
              key={step}
              onClick={() => go(at + step)}
              disabled={step < 0 ? at === 0 : at === slides.length - 1}
              aria-label={step < 0 ? "Previous" : "Next"}
              className="w-7 h-7 rounded-md border border-brand_navy/20 text-[12px] text-content hover:bg-bkg disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
            >
              {step < 0 ? "‹" : "›"}
            </button>
          ))}
        </span>
      </div>

      <div
        ref={track}
        onScroll={() => {
          const el = track.current;
          if (el) setAt(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
        className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory overscroll-x-contain"
      >
        {slides.map((sl) => (
          <div
            key={sl.label}
            className="flex-none w-full snap-start px-4 py-3.5 min-w-0"
          >
            {sl.body}
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-1.5 pb-2.5" aria-hidden>
        {slides.map((sl, i) => (
          <span
            key={sl.label}
            className={`h-1.5 rounded-full transition-all ${
              i === at ? "w-4 bg-brand_navy" : "w-1.5 bg-brand_navy/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Waiting                                                             */
/* ------------------------------------------------------------------ */

/**
 * One shimmering bar, the house shape for a figure on its way.
 *
 * Widths are passed rather than random: a random width reshuffles on every
 * render and makes a waiting block flicker.
 */
const Bar = ({ w = "100%", h = 12 }: { w?: string; h?: number }) => (
  <span
    className="block rounded bg-gray-200 animate-pulse"
    style={{ width: w, height: h }}
    aria-hidden
  />
);

/**
 * Which of the three waves are in.
 *
 * The notebook is readable in stages — sales answer the first two tabs and
 * orders and deliveries answer the last two — so a single spinner would be
 * lying in both directions at once. Three lights say which half of the
 * screen is settled and which is still moving.
 */
const Waves = ({ sales, all }: { sales: boolean; all: boolean }) => {
  const lamps = [
    { label: "Sales", lit: sales },
    { label: "Orders", lit: all },
    { label: "Deliveries", lit: all },
  ];
  return (
    <span
      className="hidden lg:flex items-center gap-3 flex-shrink-0"
      role="status"
      aria-label={all ? "All data loaded" : "Loading"}
    >
      {lamps.map((l) => (
        <span key={l.label} className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              l.lit ? "bg-severity_ok_text" : "bg-severity_watch_text animate-pulse"
            }`}
          />
          <span className="text-[11.5px] text-custom-white/85">{l.label}</span>
        </span>
      ))}
    </span>
  );
};

/** Why the screen is holding something back, beside a light that says it is
 *  still working. Shaped like a sentence, not a spinner. */
const LoadNote = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center gap-2.5 rounded-lg bg-custom-white shadow-md px-4 py-2.5">
    <span className="w-2 h-2 rounded-full bg-brand_navy_hover animate-pulse flex-shrink-0" />
    <span className="text-[13px] leading-snug text-content/85">{children}</span>
  </div>
);

const NAME_W = ["78%", "62%", "85%", "55%", "72%", "68%", "90%", "60%"];

/** A card's worth of bars. */
const SkCard = ({ rows = 4 }: { rows?: number }) => (
  <div className="rounded-lg bg-custom-white shadow-md px-5 py-4 flex flex-col gap-2.5">
    <Bar w="46%" h={13} />
    {Array.from({ length: rows }, (_, i) => (
      <Bar key={i} w={NAME_W[i % NAME_W.length]} />
    ))}
  </div>
);

/**
 * The tab, mid-load, drawn in the shape of what is coming.
 *
 * Each says what it is waiting for and why it is not guessing: a tab that
 * showed its figures and then changed them when the next wave landed would
 * be worse than one that waited, because the reader would have acted on the
 * first version.
 */
const TabSkeleton = ({ tab }: { tab: "holds" | "items" | "supply" | "act" }) => (
  <div className="flex-1 min-h-0 overflow-auto thin-scrollbar bg-bkg px-4 py-5">
    <div className="max-w-[1180px] mx-auto flex flex-col gap-4" role="status">
      <LoadNote>
        {tab === "holds" || tab === "items" ? (
          <>
            <span className="font-bold text-content">
              Reading this week&rsquo;s sales for both stores.
            </span>{" "}
            The check appears as soon as they land.
          </>
        ) : (
          <>
            <span className="font-bold text-content">
              Reading orders and deliveries.
            </span>{" "}
            Until they land a vendor&rsquo;s miss cannot be told from a
            merchandising one, so this stays masked rather than changing
            under you.
          </>
        )}
      </LoadNote>

      {tab === "holds" && (
        <>
          <Bar w="64%" h={22} />
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}
          >
            <SkCard rows={3} />
            <SkCard rows={3} />
            <SkCard rows={3} />
          </div>
          <SkCard rows={6} />
        </>
      )}

      {tab === "items" && (
        <>
          <div className="flex gap-2">
            {[110, 150, 140, 130].map((w) => (
              <Bar key={w} w={`${w}px`} h={24} />
            ))}
          </div>
          <SkCard rows={8} />
        </>
      )}

      {tab === "supply" && (
        <>
          <Bar w="58%" h={22} />
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}
          >
            <SkCard rows={5} />
            <SkCard rows={5} />
          </div>
          <SkCard rows={4} />
        </>
      )}

      {tab === "act" && (
        <>
          <Bar w="52%" h={22} />
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}
          >
            <SkCard rows={5} />
            <SkCard rows={4} />
          </div>
        </>
      )}
    </div>
  </div>
);

/**
 * The piles the department's own shape points at.
 *
 * The report works out whether a gap is volume or price before anybody opens
 * this screen, and that reading says which causes are worth looking at first.
 * It MARKS them and does not apply them: a department can be entirely volume
 * and have no item flagged never-ordered, and landing somebody on an empty
 * grid would hide that disagreement instead of showing it.
 */
const SUGGESTED: Record<string, Cause[]> = {
  ringing: ["never-ordered"],
  orders: ["never-ordered", "not-received"],
  price: ["price-mix"],
  mix: ["price-mix"],
};

const CAUSE_ORDER: Cause[] = [
  "never-ordered",
  "not-received",
  "cost",
  "not-moving",
  "price-mix",
  "unclassified",
  "ahead",
];


/* ------------------------------------------------------------------ */
/* The columns                                                         */
/* ------------------------------------------------------------------ */

type Fmt = (v: number) => string;

type FilterKind = "item" | "upc" | "vendor" | "cause";

interface ColumnDef {
  key: string;
  /** A column that can be narrowed. The popover lives in the heading, which
   *  is where this app puts column filters everywhere else. */
  filter?: FilterKind;
  /** Whose figure this is. Eight of the columns belong to one store or the
   *  other and read identically without it — the tint is what stops somebody
   *  comparing 015 LW against 015 LY and thinking they have compared the
   *  stores. */
  of?: "open" | "compare";
  /** `{mine}` and `{theirs}` are filled with the two store numbers, so a
   *  heading names the store rather than leaving the reader to remember
   *  which side of the comparison it is. */
  label: string;
  width: number;
  right?: boolean;
  sort?: Col;
  render: (r: ItemVerdict, fmt: Fmt) => ReactNode;
  /**
   * This column's total, across the FILTERED set rather than the 300 rows
   * drawn. A footer that summed only what fits would be wrong by whatever
   * the cap left out, and nothing on screen would say so.
   *
   * Columns with no total leave it off: a per-unit cost and a ratio cannot
   * be added across items, and a blended figure over a case of soda and a
   * candy bar is a number that looks right and means nothing.
   */
  foot?: (rows: ItemVerdict[], fmt: Fmt) => ReactNode;
}

/** Tints, not solids: 11px mono has to stay readable on top of them. The
 *  heading takes the solid as a top rule, which is what groups the columns
 *  without a second header row. */
const tintOf = (c: ColumnDef) =>
  c.of === "open"
    ? "bg-store_open_tint"
    : c.of === "compare"
      ? "bg-store_compare_tint"
      : "";

const ruleOf = (c: ColumnDef) =>
  c.of === "open"
    ? "border-t-2 border-t-store_open"
    : c.of === "compare"
      ? "border-t-2 border-t-store_compare"
      : "border-t-2 border-t-transparent";

const label = (c: ColumnDef, t: InvestigationTarget) =>
  c.label.replace("{mine}", t.storeNumber).replace("{theirs}", t.compareStoreNumber);

/** A ratio reads as a multiple, which is how somebody says it out loud —
 *  "we did two fifths of their units". Null stays a dash: there is no ratio
 *  to a store that sold none, and 0 would read as a result. */
const mult = (v: number | null) => (v === null ? "—" : `${v.toFixed(2)}×`);

/**
 * Always money, never the page's metric.
 *
 * The sales columns follow the Sales/Quantity toggle, and in quantity mode
 * `fmt` renders a unit count. Cost and margin are dollars either way — see
 * `mineSales` in the shared math — so they format themselves and ignore the
 * formatter the column is handed.
 */
const cash = (v: number) => formatCurrency2(v);

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

const sum = (rows: ItemVerdict[], pick: (r: ItemVerdict) => number | null) =>
  rows.reduce((a, r) => a + (pick(r) ?? 0), 0);

/** A plain total, in whatever the page's metric is. */
const money =
  (pick: (r: ItemVerdict) => number | null) =>
  (rows: ItemVerdict[], fmt: Fmt) =>
    fmt(sum(rows, pick));

/** A total that carries direction, in the same pill its column's cells use. */
const signedWith =
  (pick: (r: ItemVerdict) => number | null, force?: Fmt) =>
  (rows: ItemVerdict[], fmt: Fmt) => {
    const v = sum(rows, pick);
    const show = force ?? fmt;
    return (
      <span
        className={`inline-block px-1.5 py-0.5 rounded font-bold ${
          v === 0
            ? "bg-gray-100 text-content/85"
            : v > 0
              ? "bg-delta_positive_bg text-delta_positive_text"
              : "bg-delta_negative_bg text-delta_negative_text"
        }`}
      >
        {v >= 0 ? "+" : "−"}{show(Math.abs(v))}
      </span>
    );
  };

const signed = (pick: (r: ItemVerdict) => number | null) => signedWith(pick);
/** The money columns, which do not follow the page's metric. */
const signedCash = (pick: (r: ItemVerdict) => number | null) =>
  signedWith(pick, (v) => formatCurrency2(v));

/** A count, which is a count whichever metric the page is in. */
const counted =
  (pick: (r: ItemVerdict) => number) => (rows: ItemVerdict[]) =>
    sum(rows, pick).toLocaleString("en-US");

const sortValue = (r: ItemVerdict, col: Col): number | null => {
  switch (col) {
    case "mine": return r.mineTy;
    case "theirs": return r.theirsTy;
    case "gap": return r.gap;
    case "mineLw": return r.mineLw;
    case "theirsLw": return r.theirsLw;
    case "mineLy": return r.mineLy;
    case "theirsLy": return r.theirsLy;
    case "mineUnits": return r.mineUnits;
    case "theirsUnits": return r.theirsUnits;
    case "mineCost": return r.margins.minePerUnit;
    case "theirsCost": return r.margins.theirsPerUnit;
    case "costPenalty": return r.margins.costPenalty;
    case "marginDiff": return r.margins.diff;
    case "price": return r.ratios.price;
    case "sellThrough": return r.ratios.sellThrough;
    case "ordered": return r.orderedQty;
    case "received": return r.receivedUnits;
  }
};

/**
 * The same columns, as a file.
 *
 * Raw numbers, not the screen's formatted strings: "$1,870.68" is text to a
 * spreadsheet and will not sum. Dates and names come through as they read.
 *
 * It exports what is FILTERED, not what is drawn — the 300-row cap is a
 * rendering limit, and a file that quietly stopped at the same place would be
 * wrong in a way nobody could see.
 */
const CSV_HEADERS = [
  "item", "upc", "vendor", "cause", "cause_owner",
  "mine_ty", "theirs_ty", "difference",
  "mine_lw", "theirs_lw", "mine_ly", "theirs_ly",
  "mine_units", "theirs_units",
  "mine_cogs", "theirs_cogs", "mine_cost_per_unit", "theirs_cost_per_unit",
  "cost_gap", "mine_margin", "theirs_margin", "margin_difference",
  "units_ratio", "dollars_ratio", "price_ratio", "sell_through",
  "ordered_qty", "received_units",
];

const csvRow = (r: ItemVerdict) => [
  r.description, r.productCode, r.vendorName,
  CAUSE_LABEL[r.cause], CAUSE_OWNER[r.cause],
  r.mineTy, r.theirsTy, r.gap,
  r.mineLw, r.theirsLw, r.mineLy, r.theirsLy,
  r.mineUnits, r.theirsUnits,
  r.mineCogs, r.theirsCogs, r.margins.minePerUnit, r.margins.theirsPerUnit,
  r.margins.costPenalty, r.margins.mine, r.margins.theirs, r.margins.diff,
  r.ratios.units, r.ratios.dollars, r.ratios.price, r.ratios.sellThrough,
  r.orderedQty, r.receivedUnits,
];

const COLUMNS: ColumnDef[] = [
  {
    key: "item", label: "Item", width: 250, filter: "item",
    render: (r) => <span className="font-semibold">{r.description}</span>,
    foot: (rows) => (
      <span className="uppercase tracking-wide">
        Totals · {rows.length.toLocaleString("en-US")}{" "}
        {rows.length === 1 ? "item" : "items"}
      </span>
    ),
  },
  { key: "upc", label: "UPC", width: 120, filter: "upc", render: (r) => r.productCode },
  {
    key: "vendor", label: "Vendor", width: 150, filter: "vendor",
    render: (r) => r.vendorName || <span className="text-content/85">—</span>,
  },
  {
    key: "cause", label: "Cause", width: 118, filter: "cause",
    render: (r) => (
      <span
        className={`inline-block px-1.5 py-0.5 rounded font-semibold ${CAUSE_TONE[r.cause].chip}`}
        title={CAUSE_OWNER[r.cause]}
      >
        {CAUSE_LABEL[r.cause]}
      </span>
    ),
  },
  {
    key: "mineTy", of: "open", label: "{mine} TY", width: 92, right: true, sort: "mine",
    foot: money((r) => r.mineTy),
    render: (r, fmt) => <span className="font-semibold">{fmt(r.mineTy)}</span>,
  },
  {
    key: "theirsTy", of: "compare", label: "{theirs} TY", width: 92, right: true, sort: "theirs",
    foot: money((r) => r.theirsTy),
    render: (r, fmt) => fmt(r.theirsTy),
  },
  {
    key: "marginDiff", label: "Margin diff", width: 104, right: true,
    sort: "marginDiff", foot: signedCash((r) => r.margins.diff),
    // Direction only, through the delta tokens. Margin is NOT graded: two
    // stores are not a baseline for each other, so there is no threshold
    // this could be measured against — green is up, red is down, nothing
    // more is being claimed.
    render: (r) => (
      <span
        className={`inline-block px-1.5 py-0.5 rounded font-semibold ${
          r.margins.diff === 0
            ? "bg-gray-100 text-content/85"
            : r.margins.diff > 0
              ? "bg-delta_positive_bg text-delta_positive_text"
              : "bg-delta_negative_bg text-delta_negative_text"
        }`}
      >
        {r.margins.diff >= 0 ? "+" : "−"}{cash(Math.abs(r.margins.diff))}
      </span>
    ),
  },
  {
    key: "gap", label: "Difference", width: 104, right: true, sort: "gap",
    foot: signed((r) => r.gap),
    // The ledger's pill, sized for a dense row: the comparison styling is
    // the same everywhere on this page, and a graded figure that changes
    // shape per grid is one a reader has to re-learn.
    render: (r, fmt) => (
      <span
        className={`inline-block px-1.5 py-0.5 rounded font-semibold ${
          r.gap === 0
            ? "bg-gray-100 text-content/85"
            : r.gap > 0
              ? "bg-delta_positive_bg text-delta_positive_text"
              : "bg-delta_negative_bg text-delta_negative_text"
        }`}
      >
        {r.gap >= 0 ? "+" : "−"}{fmt(Math.abs(r.gap))}
      </span>
    ),
  },
  { key: "mineLw", of: "open", label: "{mine} LW", width: 90, right: true, sort: "mineLw", render: (r, fmt) => fmt(r.mineLw), foot: money((r) => r.mineLw) },
  { key: "theirsLw", of: "compare", label: "{theirs} LW", width: 90, right: true, sort: "theirsLw", render: (r, fmt) => fmt(r.theirsLw), foot: money((r) => r.theirsLw) },
  { key: "mineLy", of: "open", label: "{mine} LY", width: 90, right: true, sort: "mineLy", render: (r, fmt) => fmt(r.mineLy), foot: money((r) => r.mineLy) },
  { key: "theirsLy", of: "compare", label: "{theirs} LY", width: 90, right: true, sort: "theirsLy", render: (r, fmt) => fmt(r.theirsLy), foot: money((r) => r.theirsLy) },
  {
    key: "mineUnits", of: "open", label: "{mine} units", width: 88, right: true, sort: "mineUnits",
    render: (r) => r.mineUnits.toLocaleString("en-US"),
    foot: counted((r) => r.mineUnits),
  },
  {
    key: "theirsUnits", of: "compare", label: "{theirs} units", width: 88, right: true, sort: "theirsUnits",
    render: (r) => r.theirsUnits.toLocaleString("en-US"),
    foot: counted((r) => r.theirsUnits),
  },
  {
    key: "mineCost", of: "open", label: "{mine} cost/u", width: 92, right: true,
    sort: "mineCost",
    render: (r) =>
      r.margins.minePerUnit === null ? "—" : cash(r.margins.minePerUnit),
  },
  {
    key: "theirsCost", of: "compare", label: "{theirs} cost/u", width: 92,
    right: true, sort: "theirsCost",
    render: (r) =>
      r.margins.theirsPerUnit === null ? "—" : cash(r.margins.theirsPerUnit),
  },
  {
    // What the per-unit difference took on the units WE sold. Money, not a
    // ratio: "$112 on 488 units" is the sentence somebody acts on.
    key: "costPenalty", label: "Cost gap", width: 98, right: true,
    sort: "costPenalty", foot: signedCash((r) => r.margins.costPenalty),
    render: (r) => {
      const v = r.margins.costPenalty;
      if (v === null || Math.abs(v) < 0.005) return "—";
      return (
        <span
          className={`inline-block px-1.5 py-0.5 rounded font-semibold ${
            v > 0
              ? "bg-delta_positive_bg text-delta_positive_text"
              : "bg-delta_negative_bg text-delta_negative_text"
          }`}
        >
          {v >= 0 ? "+" : "−"}{cash(Math.abs(v))}
        </span>
      );
    },
  },
  {
    // Units and dollars moving apart is what names a price problem, so the
    // realised-price ratio earns a column of its own.
    key: "price", label: "Price vs", width: 82, right: true, sort: "price",
    render: (r) => mult(r.ratios.price),
  },
  {
    key: "ordered", label: "Ordered", width: 78, right: true, sort: "ordered",
    foot: counted((r) => r.orderedQty),
    render: (r) =>
      r.orderedQty > 0 ? r.orderedQty.toLocaleString("en-US") : <span className="text-content/85">none</span>,
  },
  {
    key: "received", label: "Received", width: 84, right: true, sort: "received",
    foot: counted((r) => r.receivedUnits),
    render: (r) =>
      r.receivedUnits > 0 ? r.receivedUnits.toLocaleString("en-US") : <span className="text-content/85">none</span>,
  },
  {
    key: "sellThrough", label: "Sell-thru", width: 84, right: true, sort: "sellThrough",
    render: (r) => pct(r.ratios.sellThrough),
  },
];


/* ------------------------------------------------------------------ */
/* Check · does it hold, and where is it                               */
/* ------------------------------------------------------------------ */

/** The department against itself: a standing difference, or something that
 *  broke in the last seven days. Values above the bars, because the labels
 *  below already anchor them and a figure under a bar reads as its caption
 *  rather than as its height. */
const Weeks = ({
  vitals,
  cash,
}: {
  vitals: VitalsShape;
  cash: (v: number) => string;
}) => {
  const tallest = Math.max(1, ...vitals.weeks.map((w) => Math.abs(w.gap)));
  return (
    <div className="grid grid-cols-3 gap-3">
      {vitals.weeks.map((w) => (
        <div key={w.label} className="flex flex-col">
          <div
            className={`text-[12.5px] font-bold tabular-nums text-center whitespace-nowrap ${
              w.gap >= 0 ? "text-delta_positive_text" : "text-delta_negative_text"
            }`}
          >
            {w.gap >= 0 ? "+" : "−"}
            {cash(Math.abs(w.gap))}
          </div>
          <div className="h-[56px] flex items-end justify-center mt-1">
            <span
              className={`block w-full rounded-t-sm ${
                w.gap >= 0 ? "bg-emerald-500" : "bg-red-500"
              }`}
              style={{ height: `${Math.max(3, (Math.abs(w.gap) / tallest) * 56)}px` }}
            />
          </div>
          <div className="h-px bg-brand_navy/15" />
          <div className="text-[12px] font-semibold uppercase tracking-wide text-content/85 text-center whitespace-nowrap mt-1">
            {w.label}
          </div>
        </div>
      ))}
    </div>
  );
};

/** Sales, units and margin on ONE rule, the counterpart at 100, so measures
 *  that disagree are seen to disagree. */
const Index = ({
  vitals,
  them,
  cash,
}: {
  vitals: VitalsShape;
  them: string;
  cash: (v: number) => string;
}) => {
  // Three bars pinned at zero say nothing, in the one case where the reason
  // they are at zero IS the finding.
  if (vitals.index.every((m) => m.mine === 0)) {
    return (
      <p className="text-[13px] leading-relaxed text-content/85">
        This store rang none of it at all, so there is nothing to put on the
        rule. {them} took{" "}
        <span className="font-semibold text-delta_negative_text">
          {cash(vitals.index[0].theirs)}
        </span>
        .
      </p>
    );
  }
  // Two thirds along, so a department running well OVER still has room.
  const RULE = 66.666;
  return (
    <div className="flex flex-col gap-2.5">
      {vitals.index.map((m) => {
        const over = (m.pct ?? 0) >= 100;
        return (
          <div key={m.label} className="flex items-center gap-2.5">
            <span className="w-[52px] flex-shrink-0 text-[12px] font-semibold uppercase tracking-wide text-content/85">
              {m.label}
            </span>
            <span className="relative flex-1 min-w-0 h-2.5 rounded-sm bg-bkg">
              <span
                className={`absolute left-0 top-0 h-2.5 rounded-sm ${
                  over ? "bg-emerald-500" : "bg-red-500"
                }`}
                style={{ width: `${Math.min(100, ((m.pct ?? 0) / 150) * 100)}%` }}
              />
              <span
                className="absolute -top-1 w-px h-[18px] bg-brand_navy/40"
                style={{ left: `${RULE}%` }}
              />
            </span>
            <span
              className={`w-[46px] flex-shrink-0 text-right text-[12.5px] font-bold tabular-nums ${
                over ? "text-delta_positive_text" : "text-delta_negative_text"
              }`}
            >
              {m.pct === null ? "—" : `${Math.round(m.pct)}%`}
            </span>
          </div>
        );
      })}
      <p className="text-[12px] text-content/85 leading-snug">
        The rule is {them} at 100.
      </p>
    </div>
  );
};

const HoldsPanel = ({
  holds,
  spread,
  summary,
  them,
  vitals,
  cash,
  marginGap,
  costPenalty,
  onPickItem,
  onVendor,
  onSeeAll,
}: {
  holds: Holds;
  spread: Spread;
  summary: Summary;
  them: string;
  vitals: VitalsShape;
  cash: (v: number) => string;
  /** Sales and margin can point opposite ways, and nothing else on the
   *  screen would say so. Both come off the sales wave, so this belongs in
   *  the step that draws first. */
  marginGap: number;
  costPenalty: number;
  onPickItem: (code: string) => void;
  onVendor: (vendor: string) => void;
  onSeeAll: () => void;
}) => {
  const buckets = [
    { label: `Rang at ${them}, not here`, b: holds.onlyTheirs, tone: "bg-red-500" },
    { label: "Rang at both, less here", b: holds.bothLess, tone: "bg-red-500" },
    { label: "Rang at both, more here", b: holds.bothMore, tone: "bg-emerald-500" },
  ];
  const moved = buckets.reduce((t, x) => t + Math.abs(x.b.dollars), 0);
  /** The one row with money in it leads. Three rows where two are zero makes
   *  the reader find the finding; the figure IS the finding. */
  const lead = [...buckets].sort(
    (a, b) => Math.abs(b.b.dollars) - Math.abs(a.b.dollars),
  )[0];

  const shortfall = spread.ranked.reduce((t, i) => t - i.gap, 0);
  const top = spread.ranked.slice(0, 10);
  const widest = Math.abs(top[0]?.gap ?? 1);
  const vendors = spread.byVendor.slice(0, 6);
  const widestVendor = Math.max(1, Math.abs(vendors[0]?.dollars ?? 0));


  return (
    <div className="flex-1 min-h-0 overflow-auto thin-scrollbar bg-bkg px-4 py-5">
      <div className="max-w-[1180px] mx-auto flex flex-col gap-5">

        {/* Three ways of asking the same question, so they are peers and
            share one frame. Across a row they were three cards none of them
            was wide enough for; down a rail the third went unread. */}
        <Carousel
          slides={[
            {
              label: "Week by week",
              body: (
                <>
                  <p className="text-[12px] text-content/85 leading-snug mb-2.5">
                    Against itself: a standing difference, or something that
                    broke this week.
                  </p>
                  <Weeks vitals={vitals} cash={cash} />
                </>
              ),
            },
            {
              label: `Against ${them}`,
              body: (
                <>
                  <p className="text-[12px] text-content/85 leading-snug mb-2.5">
                    One rule for all three, so measures that disagree are seen
                    to.
                  </p>
                  <Index vitals={vitals} them={them} cash={cash} />
                </>
              ),
            },
            ...(vendors.length > 0
              ? [
                  {
                    label: "Who supplies it",
                    count: vendors.length,
                    body: (
                      <>
                        <p className="text-[12px] text-content/85 leading-snug mb-2.5">
                          The shortfall by vendor. Pick one to narrow the
                          items.
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {vendors.map((v) => (
                            <button
                              key={v.vendorName}
                              onClick={() => onVendor(v.vendorName)}
                              className="flex items-center gap-2.5 text-left rounded px-1 py-0.5 hover:bg-bkg transition-colors"
                            >
                              <span className="w-[120px] flex-shrink-0 truncate text-[12.5px] text-content">
                                {v.vendorName}
                              </span>
                              <span className="flex-1 min-w-0 h-2 rounded-sm bg-bkg">
                                <span
                                  className="block h-2 rounded-sm bg-red-500"
                                  style={{
                                    width: `${(Math.abs(v.dollars) / widestVendor) * 100}%`,
                                  }}
                                />
                              </span>
                              <span className="w-[80px] flex-shrink-0 text-right text-[12.5px] font-bold tabular-nums text-delta_negative_text">
                                {"−"}
                                {cash(Math.abs(v.dollars))}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    ),
                  },
                ]
              : []),
          ]}
        />

        <div className="rounded-lg bg-custom-white shadow-md px-5 py-4">
          <div className="flex flex-col gap-4 min-w-0 max-w-[840px]">
            <p className="text-[20px] font-semibold leading-snug text-content">
              <span
                className={
                  holds.verdict === "holds"
                    ? "text-delta_positive_text"
                    : "text-severity_watch_text"
                }
              >
                {holds.verdict === "holds" ? "It holds." : "Not as the report put it."}
              </span>{" "}
              {holds.says}
            </p>

            <div className="flex items-baseline gap-3 flex-wrap">
              <span
                className={`text-[34px] font-bold tabular-nums leading-none ${
                  lead.b.dollars >= 0
                    ? "text-delta_positive_text"
                    : "text-delta_negative_text"
                }`}
              >
                {lead.b.dollars >= 0 ? "+" : "−"}
                {cash(Math.abs(lead.b.dollars))}
              </span>
              <span className="text-[13.5px] text-content/85 min-w-0">
                <span className="font-semibold text-content">
                  {lead.b.items.toLocaleString("en-US")} items
                </span>{" "}
                {lead.label.toLowerCase()}
              </span>
            </div>

            {moved > 0 && (
              <span className="flex h-2 rounded-sm overflow-hidden bg-bkg">
                {buckets.map((x) => (
                  <span
                    key={x.label}
                    className={`block h-2 ${x.tone}`}
                    style={{ width: `${(Math.abs(x.b.dollars) / moved) * 100}%` }}
                    title={`${x.label} · ${cash(Math.abs(x.b.dollars))}`}
                  />
                ))}
              </span>
            )}

            <div className="flex flex-col">
              {buckets.map((x) => (
                <div
                  key={x.label}
                  className="flex items-baseline gap-2.5 py-1.5 border-b border-brand_navy/15 last:border-b-0"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 self-center ${
                      x.b.items === 0 ? "bg-bkg" : x.tone
                    }`}
                  />
                  <span className="text-[13px] text-content/85 min-w-0">
                    {x.label}
                  </span>
                  <span className="ml-auto text-[12.5px] text-content/85 tabular-nums whitespace-nowrap">
                    {x.b.items.toLocaleString("en-US")} items
                  </span>
                  <span
                    className={`w-[96px] text-right text-[13px] font-bold tabular-nums whitespace-nowrap ${
                      x.b.items === 0
                        ? "text-content/85"
                        : x.b.dollars >= 0
                          ? "text-delta_positive_text"
                          : "text-delta_negative_text"
                    }`}
                  >
                    {x.b.dollars >= 0 ? "+" : "−"}
                    {cash(Math.abs(x.b.dollars))}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[12.5px] text-content/85 leading-relaxed">
              Sales only, so this is settled before any cause is named — and
              before anything can change under you.
            </p>

            {summary.gap >= 0 && marginGap < 0 && (
              <p className="text-[13px] leading-relaxed rounded-md bg-severity_watch_bg text-severity_watch_text px-3 py-2">
                <span className="font-bold">Ahead on sales, behind on margin.</span>{" "}
                This department took {cash(summary.gap)} more and kept{" "}
                {cash(Math.abs(marginGap))} less, because it buys the same goods
                for more.
              </p>
            )}
            {costPenalty < 0 && summary.gap < 0 && (
              <p className="text-[12.5px] text-content/85 leading-relaxed">
                Buying the same goods for more took another{" "}
                <span className="font-semibold text-content">
                  {cash(Math.abs(costPenalty))}
                </span>{" "}
                of margin on top of the sales gap.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-custom-white shadow-md px-5 py-4">
          <div className="flex flex-col gap-4 min-w-0">
            <p className="text-[20px] font-semibold leading-snug text-content max-w-[840px]">
              {spread.says}
            </p>

            <span className="flex h-2 rounded-sm overflow-hidden bg-bkg">
              <span
                className="block h-2 bg-red-500"
                style={{ width: `${Math.max(4, spread.topTenShare * 100)}%` }}
              />
            </span>

            <div className="flex flex-col">
              {top.map((i, ix) => (
                <div key={i.productCode}>
                  <button
                    onClick={() => onPickItem(i.productCode)}
                    className="w-full grid gap-3 items-center px-1.5 py-1.5 border-b border-brand_navy/15 hover:bg-bkg rounded text-left"
                    style={{ gridTemplateColumns: "22px minmax(0,1fr) 120px 96px" }}
                  >
                    <span className="text-[12px] text-content/85 tabular-nums">
                      {ix + 1}
                    </span>
                    <span className="min-w-0 truncate text-[12.5px] font-mono text-content">
                      {i.description}
                    </span>
                    <span className="h-2 rounded-sm bg-bkg">
                      <span
                        className="block h-2 rounded-sm bg-red-500"
                        style={{ width: `${(Math.abs(i.gap) / widest) * 100}%` }}
                      />
                    </span>
                    <span className="text-right text-[12.5px] font-bold tabular-nums text-delta_negative_text">
                      {"−"}
                      {cash(Math.abs(i.gap))}
                    </span>
                  </button>
                  {/* The conclusion drawn in the list it is about, rather
                      than only stated above it. */}
                  {spread.toHalf > 0 && ix === spread.toHalf - 1 && (
                    <div className="flex items-center gap-2 py-1">
                      <span className="h-px flex-1 bg-delta_negative_text/40" />
                      <span className="text-[11.5px] font-bold uppercase tracking-wide text-delta_negative_text whitespace-nowrap">
                        half the shortfall
                      </span>
                      <span className="h-px flex-1 bg-delta_negative_text/40" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* The list is the ten biggest; the way to the rest belongs
                beside the sentence that says so, not three tabs away. */}
            <div className="flex items-center gap-4 flex-wrap">
              <p className="text-[12.5px] text-content/85 leading-relaxed">
                {spread.ranked.length.toLocaleString("en-US")} items behind ·
                ordered by the biggest difference · click one for its evidence
                · {cash(shortfall)} in all
              </p>
              <button
                onClick={onSeeAll}
                className="ml-auto flex-shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-md border border-brand_navy/25 text-content hover:bg-bkg transition-colors whitespace-nowrap"
              >
                See every item &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Supply · the orders and the invoices themselves                     */
/* ------------------------------------------------------------------ */

/** Sep 24, from an ISO date that may or may not carry a time behind it. */
const onDay = (d: string) =>
  new Date(d.slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

/**
 * Both stores' orders, or both stores' invoices, on one dated list.
 *
 * Interleaved rather than split into two columns, because the finding is
 * usually a date: four orders there and one here reads straight down, where
 * two separate lists have to be held side by side and counted.
 *
 * It scrolls at a fixed height. A busy department can run to sixty invoices
 * and the panel should not grow to sixty rows tall.
 */
const Ledger = ({
  note,
  rows,
  rightLabel,
  right,
  us,
  them,
  empty,
}: {
  note: string;
  rows: SupplyRecord[];
  rightLabel: string;
  right: (r: SupplyRecord) => string;
  us: string;
  them: string;
  empty: string;
}) => {
  const n = (v: number) => Math.round(v).toLocaleString("en-US");
  const head =
    "text-[12px] font-bold uppercase tracking-wide text-content/85";

  return (
    <>
      <p className="text-[12px] text-content/85 leading-snug mb-2.5">{note}</p>

      {rows.length === 0 ? (
        <p className="text-[13px] text-content/85 leading-relaxed">{empty}</p>
      ) : (
        <>
          <div className="flex items-center gap-3 pb-1.5 border-b border-brand_navy/15">
            <span className={`${head} w-[58px]`}>Date</span>
            <span className={`${head} w-[76px]`}>#</span>
            <span className={`${head} w-[150px] truncate`}>Store</span>
            <span className={`${head} flex-1 min-w-0 truncate`}>Vendor</span>
            <span className={`${head} w-[46px] text-right`}>Lines</span>
            <span className={`${head} w-[64px] text-right`}>Units</span>
            <span className={`${head} w-[92px] text-right truncate`}>
              {rightLabel}
            </span>
          </div>

          <div className="max-h-[310px] overflow-auto thin-scrollbar">
            {rows.map((r) => (
              <div
                key={`${r.mine ? "m" : "t"}-${r.id}`}
                className="flex items-center gap-3 py-1.5 text-[12.5px] border-b border-brand_navy/15 last:border-b-0"
              >
                <span className="w-[58px] text-content/85 whitespace-nowrap">
                  {onDay(r.date)}
                </span>
                <span className="w-[76px] tabular-nums text-content truncate">
                  {r.id}
                </span>
                <span className="w-[150px] flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      r.mine ? "bg-store_open" : "bg-store_compare"
                    }`}
                  />
                  <span
                    className={`truncate ${
                      r.mine ? "font-semibold text-content" : "text-content/85"
                    }`}
                  >
                    {r.mine ? us : them}
                  </span>
                </span>
                <span className="flex-1 min-w-0 truncate text-content/85">
                  {r.vendor}
                </span>
                <span className="w-[46px] text-right tabular-nums text-content/85">
                  {r.lines}
                </span>
                {/* A negative here is a return, and it should look like one. */}
                <span
                  className={`w-[64px] text-right tabular-nums whitespace-nowrap ${
                    r.units < 0 ? "text-delta_negative_text" : "text-content"
                  }`}
                >
                  {n(r.units)}
                </span>
                <span className="w-[92px] text-right tabular-nums text-content/85 whitespace-nowrap truncate">
                  {right(r)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};

/**
 * Every order and every delivery, on the window they were read over.
 *
 * Two counts side by side cannot show that one store placed a single order
 * of nine thousand units while the other placed three totalling a few
 * hundred — nor that a lane is empty, which is the strongest way to say
 * nothing arrived. Dot area follows units, so the big order looks big.
 */
const Timeline = ({
  orders,
  deliveries,
  window,
  us,
  them,
}: {
  orders: SupplyRecord[];
  deliveries: SupplyRecord[];
  window: { start: string; end: string };
  us: string;
  them: string;
}) => {
  const day = (d: string) => Date.parse(d.slice(0, 10) + "T12:00:00");
  const from = day(window.start);
  const span = Math.max(1, day(window.end) - from);
  const at = (d: string) =>
    Math.min(100, Math.max(0, ((day(d) - from) / span) * 100));
  /* Area, not width: a 9,000-unit order beside a 2-unit one would be
     invisible on a linear scale and absurd on a square one. */
  const size = (units: number) =>
    Math.max(9, Math.min(28, 8 + Math.sqrt(Math.abs(units)) * 0.25));

  const lanes = [
    { label: us, tone: "bg-store_open", rows: orders.filter((o) => o.mine) },
    { label: them, tone: "bg-store_compare", rows: orders.filter((o) => !o.mine) },
    { label: "Delivered", tone: "", rows: deliveries },
  ];

  const ticks = [0, 25, 50, 75, 100];
  const tickDay = (p: number) =>
    new Date(from + (span * p) / 100).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  return (
    <div className="flex flex-col gap-1">
      {lanes.map((lane) => (
        <div key={lane.label} className="flex items-center gap-3">
          <span className="w-[108px] flex-shrink-0 truncate text-[11.5px] font-semibold text-content/85">
            {lane.label}
          </span>
          <span className="relative flex-1 min-w-0 h-11 border-b border-dashed border-brand_navy/20">
            {lane.rows.length === 0 ? (
              <span className="absolute inset-0 flex items-center text-[12px] italic text-content/85">
                Nothing
              </span>
            ) : (
              lane.rows.map((r) => (
                <span
                  key={`${r.mine ? "m" : "t"}-${r.id}`}
                  title={`${r.vendor} · ${Math.round(r.units).toLocaleString("en-US")} units`}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${at(r.date)}%` }}
                >
                  <span
                    className={`block rounded-full ${
                      lane.tone || (r.mine ? "bg-store_open" : "bg-store_compare")
                    }`}
                    style={{ width: size(r.units), height: size(r.units) }}
                  />
                </span>
              ))
            )}
          </span>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <span className="w-[108px] flex-shrink-0" />
        <span className="relative flex-1 min-w-0 h-4">
          {ticks.map((p) => (
            <span
              key={p}
              className="absolute -translate-x-1/2 text-[11px] text-content/85 whitespace-nowrap"
              style={{ left: `${p}%` }}
            >
              {tickDay(p)}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
};

/**
 * What each store ordered, and what actually turned up.
 *
 * Everywhere else the notebook takes its own word for a cause: an item is
 * labelled never-ordered and the reader is asked to believe there is no
 * order. This is the orders and the invoices, both stores side by side, so
 * the label can be checked rather than trusted.
 */
const SupplyPanel = ({
  supply,
  them,
  us,
  window,
  cash,
}: {
  supply: Supply;
  them: string;
  us: string;
  window: { start: string; end: string };
  cash: (v: number) => string;
}) => {
  const n = (v: number) => Math.round(v).toLocaleString("en-US");
  const says = supplySays(supply, us, them);

  // Every vendor either store took a delivery from, biggest first.
  const names = [
    ...new Set([
      ...supply.mine.vendors.map((v) => v.name),
      ...supply.theirs.vendors.map((v) => v.name),
    ]),
  ];
  const rows = names
    .map((name) => ({
      name,
      mine: supply.mine.vendors.find((v) => v.name === name) ?? null,
      theirs: supply.theirs.vendors.find((v) => v.name === name) ?? null,
    }))
    .sort(
      (a, b) =>
        (b.theirs?.units ?? 0) + (b.mine?.units ?? 0) -
        ((a.theirs?.units ?? 0) + (a.mine?.units ?? 0)),
    );

  return (
    <div className="flex-1 min-h-0 overflow-auto thin-scrollbar bg-bkg px-4 py-5">
      <div className="max-w-[1180px] mx-auto flex flex-col gap-5">

        {/* The tab opens with its finding, like every other one. It used to
            open with two cards of counts and leave the reader to subtract. */}
        <p className="text-[20px] font-semibold leading-snug text-content max-w-[840px]">
          {says.lead}
        </p>
        {says.tail && (
          <p className="text-[13px] leading-relaxed text-content/85 max-w-[840px] -mt-3">
            {says.tail}
          </p>
        )}

        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))" }}>
          <div className="rounded-lg bg-custom-white shadow-md px-4 py-3.5 min-w-0">
            <div className="text-[12px] font-bold uppercase tracking-wide text-content/85">
              Over the window
            </div>
            <p className="text-[12px] text-content/85 leading-snug mt-1 mb-3">
              Dot size is units ordered. An empty lane means nothing arrived.
            </p>
            <Timeline
              orders={supply.orders}
              deliveries={supply.deliveries}
              window={window}
              us={us}
              them={them}
            />
          </div>

          {/* One column each, so "359 against 8,934" is read rather than
              worked out from two cards facing away from each other. */}
          <div className="rounded-lg bg-custom-white shadow-md px-4 py-3.5 min-w-0">
            <div className="text-[12px] font-bold uppercase tracking-wide text-content/85">
              Side by side
            </div>
            <div
              className="grid gap-x-3 mt-2.5 text-[13px]"
              style={{ gridTemplateColumns: "minmax(0,1fr) 108px 108px" }}
            >
              <span className="pb-1.5 border-b border-brand_navy/15" />
              <span className="flex items-center justify-end gap-1.5 pb-1.5 border-b border-brand_navy/15 text-[11.5px] font-bold uppercase tracking-wide text-content/85 truncate">
                <span className="w-2 h-2 rounded-sm bg-store_open flex-shrink-0" />
                {us}
              </span>
              <span className="flex items-center justify-end gap-1.5 pb-1.5 border-b border-brand_navy/15 text-[11.5px] font-bold uppercase tracking-wide text-content/85 truncate">
                <span className="w-2 h-2 rounded-sm bg-store_compare flex-shrink-0" />
                {them}
              </span>

              {[
                { label: "Orders placed", m: supply.mine.orders, t: supply.theirs.orders, fmt: n },
                { label: "Lines on them", m: supply.mine.orderLines, t: supply.theirs.orderLines, fmt: n },
                { label: "Units ordered", m: supply.mine.orderedUnits, t: supply.theirs.orderedUnits, fmt: n },
                { label: "Deliveries", m: supply.mine.deliveries, t: supply.theirs.deliveries, fmt: n },
                { label: "Units received", m: supply.mine.receivedUnits, t: supply.theirs.receivedUnits, fmt: n },
                { label: "Cost received", m: supply.mine.receivedCost, t: supply.theirs.receivedCost, fmt: cash },
              ].map((row) => (
                <Fragment key={row.label}>
                  <span className="py-1.5 border-b border-brand_navy/15 text-content/85 truncate">
                    {row.label}
                  </span>
                  {/* A zero is muted rather than bold: nothing is not a
                      figure, and three bold noughts read as data. */}
                  <span
                    className={`text-right tabular-nums py-1.5 border-b border-brand_navy/15 ${
                      row.m === 0 ? "text-content/85" : "font-bold text-content"
                    }`}
                  >
                    {row.fmt(row.m)}
                  </span>
                  <span
                    className={`text-right tabular-nums py-1.5 border-b border-brand_navy/15 ${
                      row.t === 0 ? "text-content/85" : "font-semibold text-content"
                    }`}
                  >
                    {row.fmt(row.t)}
                  </span>
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* A supplier they buy from and we do not is a buying decision, not
            an accident — and it is the one thing in here somebody can act on
            without opening a single item. */}
        {supply.onlyTheirs.length > 0 && (
          <div className="rounded-lg bg-severity_watch_bg px-5 py-4">
            <p className="text-[14px] leading-relaxed text-severity_watch_text">
              <span className="font-bold">
                {supply.onlyTheirs.length === 1
                  ? "One vendor delivers to them and not here"
                  : `${supply.onlyTheirs.length} vendors deliver to them and not here`}
                :
              </span>{" "}
              {supply.onlyTheirs.join(", ")}.
            </p>
          </div>
        )}

        {/* Three answers to one question, so they share one frame rather
            than running down the page in three cards of their own. The
            counts are in the tabs because a zero is the finding here: no
            deliveries at all is the thing worth reading, not a section that
            looks missing. */}
        <Carousel
          slides={[
            {
              label: "Orders",
              count: supply.orders.length,
              body: (
                <Ledger
                  note={`Every order carrying an item from this department, newest first. ${us} and ${them} on one list.`}
                  rows={supply.orders}
                  rightLabel="Status"
                  right={(r) => r.status ?? "—"}
                  us={us}
                  them={them}
                  empty="Neither store placed an order in this department over the window. That is the finding, not a gap in the data."
                />
              ),
            },
            {
              label: "Deliveries",
              count: supply.deliveries.length,
              body: (
                <Ledger
                  note="Every invoice that carried an item from this department. An invoice that carried none of it is not listed."
                  rows={supply.deliveries}
                  rightLabel="Cost"
                  right={(r) => cash(r.cost)}
                  us={us}
                  them={them}
                  empty="Neither store took a delivery in this department over the window."
                />
              ),
            },
            {
              label: "Who delivered",
              count: rows.length,
              body: (
                <>
                  <p className="text-[12px] text-content/85 leading-snug mb-2.5">
                    Units received in this department over the window, by
                    vendor.
                  </p>

                  {rows.length === 0 ? (
                    <p className="text-[13px] text-content/85 leading-relaxed">
                      Neither store took a delivery in this department over the
                      window.
                    </p>
                  ) : (
                    <div
                      className="grid gap-x-4 gap-y-0 text-[12.5px]"
                      style={{ gridTemplateColumns: "minmax(0,1fr) 92px 92px 92px" }}
                    >
                      <span className="text-[12px] font-bold uppercase tracking-wide text-content/85 pb-1.5 border-b border-brand_navy/15">
                        Vendor
                      </span>
                      <span className="text-[12px] font-bold uppercase tracking-wide text-content/85 text-right pb-1.5 border-b border-brand_navy/15 truncate">
                        Here
                      </span>
                      <span className="text-[12px] font-bold uppercase tracking-wide text-content/85 text-right pb-1.5 border-b border-brand_navy/15 truncate">
                        There
                      </span>
                      <span className="text-[12px] font-bold uppercase tracking-wide text-content/85 text-right pb-1.5 border-b border-brand_navy/15">
                        Cost here
                      </span>

                      {rows.map((r) => (
                        <Fragment key={r.name}>
                          <span className="min-w-0 truncate py-1.5 border-b border-brand_navy/15 text-content">
                            {r.name}
                          </span>
                          <span
                            className={`text-right tabular-nums py-1.5 border-b border-brand_navy/15 ${
                              r.mine
                                ? "font-semibold text-content"
                                : "text-delta_negative_text"
                            }`}
                          >
                            {r.mine ? n(r.mine.units) : "none"}
                          </span>
                          <span className="text-right tabular-nums py-1.5 border-b border-brand_navy/15 text-content/85">
                            {r.theirs ? n(r.theirs.units) : "none"}
                          </span>
                          <span className="text-right tabular-nums py-1.5 border-b border-brand_navy/15 text-content/85">
                            {r.mine ? cash(r.mine.cost) : "—"}
                          </span>
                        </Fragment>
                      ))}
                    </div>
                  )}
                </>
              ),
            },
          ]}
        />

        <p className="text-[12.5px] text-content/85 leading-relaxed max-w-[840px]">
          Read over {SUPPLY_LOOKBACK_DAYS} days ({window.start} to{" "}
          {window.end}), which does not line up with the sales week. It can
          account for this week and says nothing about last week or last year.
          A return is taken back off what arrived, because a return is not a
          delivery.
        </p>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Step 5 · who fixes it                                               */
/* ------------------------------------------------------------------ */

const ActPanel = ({
  desks,
  cash,
  onShow,
  onExport,
  onPickItem,
}: {
  desks: Desk[];
  cash: (v: number) => string;
  onShow: (c: Cause) => void;
  onExport: (d: Desk) => void;
  onPickItem: (code: string) => void;
}) => {
  const owned = desks.filter((d) => d.actionable);
  const quiet = desks.filter((d) => !d.actionable);

  return (
    <div className="flex-1 min-h-0 overflow-auto thin-scrollbar px-4 py-4">
      <div className="max-w-[920px] mx-auto flex flex-col gap-4">
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
          {owned.map((d) => (
            <div
              key={d.cause}
              className="flex flex-col gap-2.5 rounded-lg bg-bkg shadow-sm p-4"
            >
              <span className="text-[12px] font-bold uppercase tracking-wide text-content/85">
                {CAUSE_LABEL[d.cause]} ·{" "}
                <span className="text-delta_negative_text">
                  {cash(Math.abs(d.dollars))}
                </span>
              </span>
              <span className="text-[15px] font-bold text-content">
                {"→"} {OWNER_LABEL[d.owner as "buyer" | "vendor" | "price"]}
              </span>
              <p className="text-[13px] leading-relaxed text-content/85">{d.says}</p>

              <ul className="flex flex-col gap-1">
                {d.items.slice(0, 4).map((i) => (
                  <li key={i.productCode} className="flex items-baseline gap-2">
                    <button
                      onClick={() => onPickItem(i.productCode)}
                      className="min-w-0 truncate text-left text-[12px] font-mono text-brand_navy_hover hover:underline"
                    >
                      {i.description}
                    </button>
                    <span className="ml-auto text-[12px] tabular-nums text-delta_negative_text whitespace-nowrap">
                      {"−"}{formatCurrency2(Math.abs(i.gap))}
                    </span>
                  </li>
                ))}
                {d.items.length > 4 && (
                  <li className="text-[12px] text-content/85">
                    + {(d.items.length - 4).toLocaleString("en-US")} more
                  </li>
                )}
              </ul>

              <div className="flex flex-wrap gap-2 mt-auto pt-1">
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      d.items.map((i) => i.productCode).join(", "),
                    )
                  }
                  className="px-3 py-1.5 rounded-md bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[12px] font-bold transition-colors"
                >
                  Copy UPCs
                </button>
                <button
                  onClick={() => onExport(d)}
                  className="px-3 py-1.5 rounded-md bg-custom-white text-[12px] font-bold text-content hover:bg-brand_navy/5 transition-colors"
                >
                  Export
                </button>
                <button
                  onClick={() => onShow(d.cause)}
                  className="px-3 py-1.5 rounded-md bg-custom-white text-[12px] font-bold text-content hover:bg-brand_navy/5 transition-colors"
                >
                  Show in grid
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Stated, and handed to nobody. A shortfall that quietly vanishes
            from the hand-off is one somebody finds again later and trusts
            less for having been dropped. */}
        {quiet.map((d) => (
          <p
            key={d.cause}
            className="text-[13px] leading-relaxed text-content/85 border-l-2 border-brand_navy/15 pl-3"
          >
            <span className="font-semibold text-content">
              {CAUSE_LABEL[d.cause]} · {cash(Math.abs(d.dollars))}
            </span>{" "}
            {d.says} It goes on no list, because nothing here names anything to
            act on.
          </p>
        ))}
      </div>
    </div>
  );
};

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
  const [ctx, setCtx] = useState<{ x: number; y: number; upc: string } | null>(null);
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
  const fmt = (v: number) => (isQty ? formatBigNumber(v, 0) : formatCurrency2(v));

  const args = useMemo(
    () => ({
      mine: {
        storeid: target?.storeid ?? 0,
        storeNumber: target?.storeNumber ?? "",
        name: target?.storeName ?? "",
      },
      theirs: {
        storeid: target?.compareStoreid ?? 0,
        storeNumber: target?.compareStoreNumber ?? "",
        name: target?.compareStoreName ?? "",
      },
      subDept: target?.subDept ?? 0,
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
    k === "item" ? !!itemQ
      : k === "upc" ? !!upcQ
        : k === "vendor" ? !!vendorQ
          : only !== null;

  /** Text filters commit on Apply; the two pickers have already committed by
   *  the time the button is reachable, so Apply just closes the popover. */
  const applyFilter = (k: FilterKind) => {
    if (k === "item") setItemQ(itemDraft);
    if (k === "upc") setUpcQ(upcDraft);
  };

  const clearFilter = (k: FilterKind) => {
    if (k === "item") { setItemQ(""); setItemDraft(""); }
    if (k === "upc") { setUpcQ(""); setUpcDraft(""); }
    if (k === "vendor") setVendorQ("");
    if (k === "cause") setOnly(null);
  };

  const filtered = only !== null || !!itemQ || !!upcQ || !!vendorQ;

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
    .map((c) => ({ cause: c, upcs: shown.filter((i) => i.cause === c).map((i) => i.productCode) }))
    .filter((g) => g.upcs.length > 0)
    .map((g) => ({
      label: `Copy ${CAUSE_LABEL[g.cause].toLowerCase()} UPCs · ${g.upcs.length}`,
      onClick: () => navigator.clipboard.writeText(g.upcs.join(", ")),
    }));
  const clearAll = () => {
    setOnly(null);
    setItemQ(""); setItemDraft("");
    setUpcQ(""); setUpcDraft("");
    setVendorQ("");
  };

  const sorted = applySort(shown, (row, col) => sortValue(row, col));
  const capped = sorted.slice(0, ROW_CAP);

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
   *  it halfway down. */
  const at = capped.findIndex((r) => r.productCode === picked);
  const stepItem = (d: number) => {
    const next = capped[at + d];
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
  const TABS = [
    {
      key: "holds" as const,
      title: "Check",
      needsAll: false,
      answer: () =>
        holds.verdict === "holds" ? "It holds" : "The items say otherwise",
    },
    {
      key: "items" as const,
      title: "Items",
      needsAll: true,
      answer: () => {
        const lead = summary.byCause.find((c) => c.cause !== "ahead" && c.dollars < 0);
        return lead
          ? `${CAUSE_LABEL[lead.cause]} · ${cash(Math.abs(lead.dollars))}`
          : "Nothing behind";
      },
    },
    {
      key: "supply" as const,
      title: "Supply",
      needsAll: true,
      answer: () =>
        `${supply.mine.orders} ${supply.mine.orders === 1 ? "order" : "orders"} here, ${supply.theirs.orders} there`,
    },
    {
      key: "act" as const,
      title: "Hand-off",
      needsAll: true,
      answer: () => {
        const owned = desks.filter((d) => d.actionable);
        return owned.length
          ? `${owned.length} ${owned.length === 1 ? "list" : "lists"} to hand out`
          : "Nothing to hand out";
      },
    },
  ];

  return (
    <div
      className={`h-full flex flex-col overflow-hidden bg-custom-white rounded-xl shadow-sm ${
        leaving ? "animate-nb-leave" : ""
      }`}
    >

      {/* The chrome arrives before the contents, top down: the header says
          where you are, the tabs say what is here, and the panel fills in
          under them. Arriving all at once read as a page swap. */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 bg-brand_navy animate-nb-drop motion-reduce:animate-none">
        <button
          ref={backRef}
          onClick={close}
          className="text-custom-white text-[12.5px] font-semibold hover:underline rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-custom-white/70"
        >
          ‹ Back to the comparison
        </button>
        <span className="text-custom-white/85 text-[12.5px] truncate flex items-center gap-1.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-sm bg-store_open flex-shrink-0" />
          <span className="font-semibold text-custom-white">{target.storeName}</span>
          <span className="truncate">
            {" · "}{target.subDeptName}{" · "}week ending {twEnd}{" · against"}
          </span>
          <span className="w-2.5 h-2.5 rounded-sm bg-store_compare flex-shrink-0" />
          <span className="font-semibold text-custom-white">{target.compareStoreName}</span>
        </span>
        <Waves sales={salesIn} all={allIn} />
        <button
          onClick={exportCsv}
          disabled={sorted.length === 0}
          title="Every filtered row, as a CSV"
          className="ml-auto flex-shrink-0 text-custom-white text-[12px] font-semibold px-2.5 py-1 rounded border border-custom-white/30 hover:bg-custom-white/10 disabled:opacity-40 transition-colors"
        >
          Export CSV
        </button>
        <span
          className={`flex-shrink-0 text-[13px] font-semibold px-2.5 py-1 rounded ${
            summary.gap < 0
              ? "bg-delta_negative_bg text-delta_negative_text"
              : "bg-delta_positive_bg text-delta_positive_text"
          }`}
        >
          {summary.gap >= 0 ? "+" : "−"}
          {fmt(Math.abs(summary.gap))}
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
                setPicked(code);
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
                setPicked(code);
                setTab("items");
              }}
            />
          )}

          {/* The grid stays MOUNTED behind `hidden` rather than being
              unmounted with the tab. Three hundred rows is too much to
              rebuild on every switch, and keeping it alive preserves the
              scroll position and the active filter — which matters, because
              step 5's "Show in grid" lands the reader in it.

              The Sales Export preview's grid: one real table, every cell
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
          <div className="flex-shrink-0 px-4 py-2.5 border-b border-brand_navy/15">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setOnly(null)}
                className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border transition-shadow ${
                  only === null
                    ? "bg-filter_active border-filter_active_border text-content ring-2 ring-filter_active_border shadow-sm"
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
                    } ${only === c ? `ring-2 shadow-sm ${CAUSE_TONE[c].ring}` : ""}`}
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
              Orders and deliveries are read over {SUPPLY_LOOKBACK_DAYS} days
              ({supply_.start} to {supply_.end}) — they cannot account for
              the LW or LY columns.
              {STAGE_NOTE[stage] && (
                <span className="ml-1.5 font-semibold">{STAGE_NOTE[stage]}</span>
              )}
            </p>
          </div>

          <div className="flex-1 min-h-0 flex overflow-hidden">
          <div className="flex-1 min-w-0 overflow-auto thin-scrollbar">
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
                          onApply={() => applyFilter(c.filter as FilterKind)}
                          onClear={() => clearFilter(c.filter as FilterKind)}
                        >
                          {c.filter === "item" && (
                            <input
                              autoFocus
                              style={colInputStyle}
                              placeholder="Search item…"
                              value={itemDraft}
                              onChange={(e) => setItemDraft(e.target.value)}
                            />
                          )}
                          {c.filter === "upc" && (
                            <input
                              autoFocus
                              style={colInputStyle}
                              placeholder="Search UPC…"
                              value={upcDraft}
                              onChange={(e) => setUpcDraft(e.target.value)}
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
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                          )}
                          {c.filter === "cause" && (
                            <select
                              style={colInputStyle}
                              value={only ?? ""}
                              onChange={(e) =>
                                setOnly((e.target.value || null) as Cause | null)
                              }
                            >
                              <option value="">Every cause</option>
                              {CAUSE_ORDER.filter((x) => byCause.has(x)).map((x) => (
                                <option key={x} value={x}>{CAUSE_LABEL[x]}</option>
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
                    onClick={() =>
                      setPicked((p) => (p === r.productCode ? null : r.productCode))
                    }
                    className="cursor-pointer"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setCtx({ x: e.clientX, y: e.clientY, upc: r.productCode });
                    }}
                  >
                    {/* Selection shows on the gutter, not on the row: every
                        other cell paints its own background — the two store
                        tints especially — so a row-level fill would appear on
                        half the row and look broken. The house pair, where it
                        can be seen. */}
                    <td
                      className={`sticky left-0 z-10 border-r border-brand_line border-b border-brand_line px-2 py-1.5 text-right ${
                        picked === r.productCode
                          ? "bg-row_selected border-row_selected_border border-l-2 font-bold text-content"
                          : "bg-custom-white text-content/85"
                      }`}
                    >
                      {i + 1}
                    </td>
                    {COLUMNS.map((c) => (
                      <td
                        key={c.key}
                        className={`border-r border-b border-brand_line px-2.5 py-1.5 whitespace-nowrap ${c.right ? "text-right" : ""} ${tintOf(c)}`}
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
                  readable from row 1 as well as row 300. Over the filtered
                  set — the count in the first cell says how many that is,
                  which is the number the cap can disagree with. */}
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

          {/*
            The rail moves instead of appearing.

            Clicking a row used to shove 520px of grid sideways in a single
            frame, which is a jolt in the one place the reader is trying to
            hold their position — the row they just clicked. The width is
            what animates; the contents keep their own 520px and are clipped,
            so nothing inside reflows on the way in or out.
          */}
          <div
            className={`flex-shrink-0 overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none ${
              pickedItem ? "w-[520px]" : "w-0"
            }`}
          >
           <div className="w-[520px] h-full">
            {evidence && target && (
            <ItemEvidence
              item={evidence}
              openStoreName={target.storeName}
              compareStoreName={target.compareStoreName}
              mineOrders={orders.mine}
              theirsOrders={orders.theirs}
              mineReceipts={receipts.mine}
              theirsReceipts={receipts.theirs}
              minePoints={sales?.minePoints ?? []}
              theirsPoints={sales?.theirsPoints ?? []}
              supplyReady={stage === "done"}
              position={{
                at: Math.max(0, at),
                of: capped.length,
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

          <div
            hidden={tab !== "items"}
            className="flex-shrink-0 flex items-center gap-3 px-4 py-2 border-t border-brand_line bg-custom-white text-[13.5px] text-content/85"
          >
            <span>
              {shown.length > ROW_CAP ? (
                <>
                  Showing the {ROW_CAP} biggest differences of {shown.length}.
                  Narrow it with a heading filter — what is left out is the
                  tail, and nothing in it is larger than the last row here.
                </>
              ) : (
                <>
                  {shown.length} {shown.length === 1 ? "item" : "items"}
                  {filtered ? ` of ${items.length}` : ""} · ordered by the
                  biggest difference · click one for its evidence
                </>
              )}
            </span>
            {filtered && (
              <button
                onClick={clearAll}
                className="flex-shrink-0 font-semibold text-brand_navy_hover hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {ctx && (
            <UpcContextMenu
              x={ctx.x}
              y={ctx.y}
              upc={ctx.upc}
              allUpcs={shown.map((i) => i.productCode)}
              extraActions={copyActions}
              onClose={() => setCtx(null)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DeptInvestigation;
