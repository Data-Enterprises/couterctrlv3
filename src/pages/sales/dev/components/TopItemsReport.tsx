import { useEffect, useMemo, useState } from "react";
import { CTA_SEVERITY_CLASSES } from "../../../../utils/severity";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { cacheTopItemsTy } from "../../../../features/dev/devSalesLedgerSlice";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import CtaStrip, { type CtaTone } from "../../../../components-dev/CtaStrip";
import { Block, Measure } from "./CompareBlocks";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import MultiSelectFilter from "../../../../components-dev/filters/MultiSelectFilter";
import SelectFilter from "../../../../components-dev/filters/SelectFilter";
import TextFilter from "../../../../components-dev/filters/TextFilter";
import { formatCurrency2 } from "../../../../utils";
import {
  getItemDetail,
  getTopItems,
  TOP_ITEMS_FETCH,
  type ItemDetailResponse,
  type TopItemPricePoint,
  type TopItemRow,
  type TopItemsResponse,
} from "../../../../api/topItems";
import { amountOf, avgPrice, weighed } from "../shared/topItems";
import { severityDotClass } from "../../../../utils/severity";
import {
  amountTextOf,
  compareTopItems,
  compareTotals,
  deptsPresent,
  divergenceByDept,
  divergenceSigned,
  filterCompared,
  sortCompared,
  type ComparedTopItem,
  type CompareFilter,
  type CompareSort,
} from "../shared/topItemsCompare";

/**
 * Two stores' top 200, side by side.
 *
 * The Top 200 tab when a counterpart is chosen, the way Sub depts becomes
 * `DeptReport`. The single-store tab is untouched and still answers the
 * question the page was opened with.
 *
 * **Everything here is reused rather than invented.** The back button and
 * headline, the split bar, the CtaStrip that lays its detail OVER the list,
 * and the list-plus-rail split are all already on this screen. A comparison
 * that looks like the other comparison is one the reader has already learnt.
 *
 * **What a row may claim** is the whole design, and it is in
 * `topItemsCompare.ts`: these are two top-200s, so a one-sided row means
 * "not in their top 200", never "they do not carry it". The rail asks
 * `item_detail` for the absent side and reports what comes back — which is
 * still a SALES answer: "sold none this week", not "off their shelf".
 */

const money = (v: number) => formatCurrency2(v);

/** Points, signed, two places. */
const pts = (v: number) => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2);

const pct = (v: number | null) => (v === null ? "—" : `${v.toFixed(2)}%`);

/** Informational. Nothing in the outline is a verdict on either store, so it
 *  takes the neutral tone rather than borrowing a severity colour. */
const OUTLINE_TONE: CtaTone = {
  border: "border-brand_navy/25",
  bg: "bg-bkg",
  hoverBg: "hover:bg-brand_navy/5",
  text: "text-content",
};

/** One store's week, as this tab needs it. */
interface Side {
  rows: TopItemRow[];
  points: TopItemPricePoint[];
}

interface Props {
  openStoreName: string;
  openStoreId: number;
  compareStoreId: number;
  compareStoreName: string;
  twStart: string;
  twEnd: string;
  onBack: () => void;
}

/** Ahead or behind. No threshold: there is no third state to grade into
 *  when the only question is which of two stores sells more of a thing. */
const toneOf = (signed: number): "healthy" | "critical" =>
  signed >= 0 ? "healthy" : "critical";

const TONE_PILL: Record<"healthy" | "critical", string> = {
  healthy: "bg-severity_healthy_bg text-severity_healthy_text",
  critical: "bg-severity_critical_bg text-severity_critical_text",
};

const TopItemsReport = ({
  openStoreName,
  openStoreId,
  compareStoreId,
  compareStoreName,
  twStart,
  twEnd,
  onBack,
}: Props) => {
  const { url, token } = useAppSelector((s) => s.app);
  const cache = useAppSelector((s) => s.dev.salesLedger.topItemsCache);
  const tyCache = useAppSelector((s) => s.dev.salesLedger.topItemsTyCache);
  const dispatch = useAppDispatch();
  const toast = useToast();

  const [mine, setMine] = useState<Side | null>(null);
  const [theirs, setTheirs] = useState<Side | null>(null);
  const [loading, setLoading] = useState(true);

  /** Both on arrival: "are these two lists the same" is the question the
   *  screen was asked for, and it is answered among the items both stores
   *  carry. The one-sided piles are a click away and counted on their
   *  pills. */
  const [filter, setFilter] = useState<CompareFilter>("both");
  const [sort, setSort] = useState<CompareSort>("divergence");
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [depts, setDepts] = useState<string[]>([]);

  const key = `${openStoreId}__${twStart}__${twEnd}`;
  const theirKey = `${compareStoreId}__${twStart}__${twEnd}`;

  /**
   * Both weeks, from the cache where it has them.
   *
   * Read-only on the slice: `setTopItems` also moves the tab's CURRENT rows,
   * which belong to the open store, so writing the counterpart's week there
   * would leave the single-store tab holding the wrong store's list.
   */
  useEffect(() => {
    let live = true;
    /** The full entry a single-store visit leaves, or this tab's own. */
    const held = (k: string): Side | null => {
      const full = cache[k];
      if (full) return { rows: full.rows, points: full.points };
      const ty = tyCache[k];
      return ty ? { rows: ty.rows, points: ty.points } : null;
    };

    const want = (k: string, storeid: number): Promise<Side> => {
      const hit = held(k);
      if (hit) return Promise.resolve(hit);
      return getTopItems(
        url,
        token,
        storeid,
        twStart,
        twEnd,
        TOP_ITEMS_FETCH,
      ).then((resp) => {
        const j: TopItemsResponse = resp.data;
        if (j.error !== 0) throw new Error(j.msg || "Could not read top items");
        const side = { rows: j.items ?? [], points: j.price_points ?? [] };
        // Kept, so leaving for Hourly and coming back is free. Written to
        // the TY store, never the shared one: a partial entry there would
        // leave the single-store tab with no vs LW or vs LY.
        dispatch(cacheTopItemsTy({ key: k, ...side }));
        return side;
      });
    };

    setLoading(true);
    Promise.all([want(key, openStoreId), want(theirKey, compareStoreId)])
      .then(([a, b]) => {
        if (!live) return;
        setMine(a);
        setTheirs(b);
      })
      .catch((e: Error) => live && toast.error(e.message))
      .finally(() => live && setLoading(false));

    return () => {
      live = false;
    };
    // `cache` deliberately out of the deps: a hit is taken when the pair
    // changes, and a later eviction must not refetch a week already on
    // screen.
  }, [key, theirKey]);

  const rows = useMemo(
    () =>
      mine && theirs ? compareTopItems(mine.rows, theirs.rows) : [],
    [mine, theirs],
  );
  const totals = useMemo(() => compareTotals(rows), [rows]);
  const byDept = useMemo(() => divergenceByDept(rows), [rows]);

  const shown = useMemo(
    () => sortCompared(filterCompared(rows, filter, text, depts), sort),
    [rows, filter, text, depts, sort],
  );

  /**
   * The departments on offer, and which of them the OTHER filters have
   * emptied.
   *
   * An option that would return nothing is marked rather than dropped when it
   * is selected, so a pick never vanishes and leaves the screen blank with
   * nothing to click to undo -- MultiSelectFilter's own rule.
   */
  const deptOpts = useMemo(() => {
    const live = new Set(
      filterCompared(rows, filter, text).map((r) => r.dept),
    );
    return deptsPresent(rows).map((d) => ({
      value: d.dept,
      label: `${d.dept} (${d.count})`,
      unavailable: !live.has(d.dept),
    }));
  }, [rows, filter, text]);

  const selected = useMemo(
    () => shown.find((r) => r.code === picked) ?? shown[0] ?? null,
    [shown, picked],
  );

  /**
   * For a one-sided row, what the other store actually did with it.
   *
   * Only then: on a row both stores list, both figures are already in hand
   * and a call would answer a question nobody has. Fired on selection the
   * way the single-store tab fires its own, so there is nothing to press.
   */
  const [absent, setAbsent] = useState<ItemDetailResponse | null>(null);
  const [absentLoading, setAbsentLoading] = useState(false);

  useEffect(() => {
    if (!selected || selected.only === null) {
      setAbsent(null);
      return;
    }
    const askStore =
      selected.only === "mine" ? compareStoreId : openStoreId;
    let live = true;
    setAbsent(null);
    setAbsentLoading(true);
    getItemDetail(url, token, askStore, selected.code, twStart, twEnd, 0)
      .then((resp) => {
        const j: ItemDetailResponse = resp.data;
        if (!live || j.error !== 0) return;
        setAbsent(j);
      })
      .catch(() => undefined)
      .finally(() => live && setAbsentLoading(false));
    return () => {
      live = false;
    };
  }, [selected?.code, selected?.only]);

  /** The widest pair, so every bar is drawn against one scale. */
  const widest = useMemo(
    () => shown.reduce((m, r) => Math.max(m, r.pair), 0),
    [shown],
  );

  if (loading) {
    return (
      <div className="relative h-full">
        <LoadingIndicator message="Reading both stores' top 200" />
      </div>
    );
  }

  const differ = totals.onlyMine + totals.onlyTheirs;
  const pileTotal = Math.max(1, rows.length);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Headline — the shape DeptReport uses, so the two comparisons read
          as one feature rather than two. */}
      <div className="flex-shrink-0 px-4 pt-2.5 pb-3 border-b-2 border-brand_navy/20">
        {/*
          Back and the bar on one row, and no headline sentence.
          It read "202 of 301 differ", where 301 was the UNION of the two
          lists -- a number nobody asked for, and one that cannot be "of 200"
          because the list holds items from both stores. The bar's own three
          labels say it exactly: 99 in both, 101 only at one, 101 only at the
          other, and 99 + 101 is each store's 200. The counterpart is named
          inside its own segment, so the "vs store" line went with it.
        */}
        <div className="flex items-stretch gap-2.5">
          <button
            onClick={onBack}
            title="Back to all stores"
            className="flex-shrink-0 px-2.5 inline-flex items-center gap-1.5 rounded-md border border-brand_navy/25 text-[12px] font-bold text-content hover:bg-bkg transition-colors"
          >
            <span className="text-[14px] leading-none">{"‹"}</span>
            Back
          </button>

          <span
            data-help="top200-piles"
            className="flex-1 flex h-[30px] rounded-md overflow-hidden bg-bkg text-[12px] font-semibold"
          >
            <span
              className="flex items-center px-2.5 text-custom-white whitespace-nowrap overflow-hidden bg-brand_navy"
              style={{ width: `${Math.max(12, (totals.both / pileTotal) * 100)}%` }}
            >
              <span className="truncate">
                {totals.both} in both · {money(totals.sharedMineSales)}
              </span>
            </span>
            {/* The two remainders are TINTS with dark text, not translucent
                navy with white. White on a translucent navy over a light track is
                a grey-on-grey that cannot be read -- the fill was chosen to
                echo the row bars and the text was never checked against it.
                Three weights: solid, a quarter, a tenth. */}
            {totals.onlyMine > 0 && (
              <span
                className="flex items-center px-2.5 text-content whitespace-nowrap overflow-hidden bg-store_compare_tint"
                style={{
                  width: `${Math.max(10, (totals.onlyMine / pileTotal) * 100)}%`,
                }}
              >
                <span className="truncate">
                  {totals.onlyMine} only {openStoreName}
                </span>
              </span>
            )}
            {totals.onlyTheirs > 0 && (
              <span className="flex items-center px-2.5 flex-1 text-custom-white whitespace-nowrap overflow-hidden bg-store_compare">
                <span className="truncate">
                  {totals.onlyTheirs} only {compareStoreName}
                </span>
              </span>
            )}
          </span>
        </div>

        {/* The anchor lives on a wrapper: CtaStrip takes no `data-help` and
            would drop it, leaving the help panel pointing at nothing. */}
        {byDept.length > 0 && (
          <div data-help="top200-outline" className="mt-2.5">
          <CtaStrip
            tone={OUTLINE_TONE}
            className="rounded-md border"
            label={
              <>
                The difference sits in{" "}
                <b>{byDept.slice(0, 3).map((d) => d.dept).join(", ")}</b>
              </>
            }
            trailing={`${differ} items`}
            detail={
              <span className="flex flex-col gap-2 text-[13px] leading-snug max-h-[45vh] overflow-y-auto">
                <span>
                  Of the {differ} items in one list and not the other, by
                  department:
                </span>
                <span className="flex flex-col gap-0.5">
                  {byDept.map((d) => (
                    <span key={d.dept}>
                      <span className="font-semibold tabular-nums">
                        {d.count}
                      </span>{" "}
                      {d.dept}
                    </span>
                  ))}
                </span>
                <span>
                  Counted over one-sided rows only. An item both stores carry
                  is not where they differ in stocking, however far apart the
                  two sizes are.
                </span>
              </span>
            }
          />
          </div>
        )}
      </div>

      {/* Filters */}
      <div
        data-help="top200-compare-filters"
        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-gray-100"
      >
        {/* The house search, not a hand-rolled one: SelectFilter is a fixed
            24px and this was a rounded-lg at py-1.5 with no border, so the
            row never sat on one line. */}
        <TextFilter
          value={text}
          onChange={setText}
          placeholder="Item or code"
          className="w-[200px] flex-none"
        />

        {/*
          Dropdowns, not pills. A pile's label carries a store name, so three
          of them side by side ran to most of the row and truncated to
          "Only 015 - IGA HODGENVILL…" -- the part that tells two stores
          apart being the part that got cut. One control, four choices, and
          the chosen one reads in full.

          "" is the all-items value on purpose: SelectFilter adds its own
          clear row only when no option already holds "", and a second way to
          say the same thing is two answers to one question.
        */}
        <SelectFilter
          options={[
            { value: "both", label: `In both (${totals.both})` },
            {
              value: "mine",
              label: `Only ${openStoreName} (${totals.onlyMine})`,
            },
            {
              value: "theirs",
              label: `Only ${compareStoreName} (${totals.onlyTheirs})`,
            },
          ]}
          value={filter === "all" ? "" : filter}
          onChange={(v) => setFilter((v || "all") as CompareFilter)}
          placeholder={`All items (${rows.length})`}
          className="w-[210px] flex-none"
        />

        <MultiSelectFilter
          options={deptOpts}
          values={depts}
          onChange={setDepts}
          placeholder="All departments"
          noun="departments"
          className="w-[170px] flex-none"
        />

        {/* No "Sort" label: the two choices name themselves, and the word
            was the only text on the row that was not a control.
            `plain`, because this always holds a value — the active ring says
            "narrowing a list", which a sort never does. */}
        <SelectFilter
          plain
          options={[
            { value: "", label: "Share gap" },
            { value: "sales", label: "Sales" },
          ]}
          value={sort === "sales" ? "sales" : ""}
          onChange={(v) => setSort(v === "sales" ? "sales" : "divergence")}
          placeholder="Share gap"
          className="w-[110px] flex-none"
        />
      </div>

      {/* List and rail — the split this tab already has */}
      <div className="flex-1 min-h-0 flex">
        <div className="w-[471px] flex-shrink-0 border-r border-gray-100 flex flex-col min-h-0">
          {/* The ledger's own dots, so the two halves of the page grade in
              one language: ahead, behind, and behind past the threshold. */}
          <div className="flex-shrink-0 flex items-center gap-3 px-3.5 py-1.5 border-b border-brand_line_2 bg-brand_paper flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-content">
              <span className={`w-2.5 h-2.5 rounded-sm ${severityDotClass.healthy}`} />
              ahead
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-content">
              <span className={`w-2.5 h-2.5 rounded-sm ${severityDotClass.critical}`} />
              behind
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-content">
              <span className="w-2.5 h-2.5 rounded-sm bg-store_compare" />
              {compareStoreName}
            </span>
          </div>

          <div
            data-help="top200-compare-list"
            className="flex-1 min-h-0 overflow-y-auto thin-scrollbar"
          >
            {shown.map((r) => (
              <Row
                key={r.code}
                row={r}
                widest={widest}
                selected={selected?.code === r.code}
                onPick={() => setPicked(r.code)}
              />
            ))}
            {shown.length === 0 && (
              <p className="px-4 py-6 text-[12px] text-content text-center">
                Nothing matches that.
              </p>
            )}
          </div>
        </div>

        <Rail
          row={selected}
          openStoreName={openStoreName}
          compareStoreName={compareStoreName}
          minePoints={mine?.points ?? []}
          theirsPoints={theirs?.points ?? []}
          absent={absent}
          absentLoading={absentLoading}
        />
      </div>
    </div>
  );
};

/**
 * One item.
 *
 * The bar is the department comparison's: the track is this pair against the
 * biggest pair, the fill splits by each store's share OF THE PAIR. The open
 * store's segment is green or red by direction and the counterpart is navy,
 * softened — at full strength it is the heaviest colour in the app and it
 * out-shouts the store the reader actually opened.
 *
 * On a one-sided row the fill is the whole measured bar, because that store
 * has all of it. The unknown is a hatched cap OUTSIDE the bar: drawing it
 * inside would shorten a measured thing to make room for an unmeasured one.
 */
const Row = ({
  row,
  widest,
  selected,
  onPick,
}: {
  row: ComparedTopItem;
  widest: number;
  selected: boolean;
  onPick: () => void;
}) => {
  const signed = divergenceSigned(row);
  // Ahead or behind, in the ledger's own two colours. No threshold: a
  // third band would have to be "close", and nothing on this screen asks
  // how close two stores are -- only which way.
  const sev = toneOf(signed);
  const minePct = row.pair > 0 ? (row.mineSales / row.pair) * 100 : 0;
  const theirsPct = row.pair > 0 ? (row.theirsSales / row.pair) * 100 : 0;

  return (
    <button
      onClick={onPick}
      // A heavier rule and more room: at border-gray-100 and py-2 the rows
      // ran together into one grey block and the bars read as a texture
      // rather than as figures.
      className={`w-full text-left px-3.5 py-2.5 border-b transition-colors ${
        selected
          ? // Always the pair: the tint alone reads as a stripe rather than
            // a selection, which is why the audit asks for both.
            "bg-row_selected border-row_selected_border"
          : row.only
            ? "border-brand_line_2 bg-brand_paper hover:bg-bkg"
            : "border-brand_line_2 hover:bg-bkg"
      }`}
    >
      <span className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-content truncate">
          {row.description}
        </span>
        <span className="flex-none text-[11px] text-content">{row.dept}</span>
        <span
          className={`flex-none tabular-nums text-[11.5px] font-bold px-1.5 py-px rounded ${TONE_PILL[sev]}`}
          title={
            row.shareGap === null
              ? `At least ${pts(signed)} points apart — this item is outside the other store's top 200, so their share is unknown`
              : `This store takes ${pct(
                  row.mineShare,
                )} of its top 200 on this item against ${pct(
                  row.theirsShare,
                )} at the other — ${pts(signed)} points apart. Not the sales difference: share, so the two stores compare whatever their size.`
          }
        >
          {row.shareGap === null ? "≥ " : ""}
          {pts(signed)} pts
        </span>
      </span>

      <span className="block mt-1.5 h-[9px] rounded-sm bg-bkg overflow-hidden flex">
        <span className="h-full flex" style={{ width: `${(row.pair / Math.max(1, widest)) * 100}%` }}>
          {/* delta_positive_TEXT, not _mid. `delta_positive_mid` is a CSS
              variable that was never added to the Tailwind config, so the
              class produced nothing and every "ahead" segment rendered
              invisible — only the counterpart's navy showed. */}
          <span
            className={severityDotClass[sev]}
            style={{ width: `${minePct}%` }}
          />
          <span className="bg-store_compare" style={{ width: `${theirsPct}%` }} />
        </span>
        {row.only !== null && (
          <span
            className="w-3.5 flex-none border-l border-brand_line_2"
            style={{
              background:
                "repeating-linear-gradient(135deg, rgb(var(--color-brand-line-2)) 0 4px, rgb(var(--color-bkg)) 4px 8px)",
            }}
            title="Not in the other store's top 200"
          />
        )}
      </span>

      {/* A swatch against each figure, tying it to its own half of the bar.
          The two used to sit either side of a "|", which left the reader
          working out which number belonged to which store. */}
      <span className="flex items-center gap-3.5 mt-2">
        <span className="inline-flex items-center gap-1.5 min-w-0">
          <span
            className={`w-2 h-2 rounded-sm flex-none ${severityDotClass[sev]}`}
          />
          <span className="tabular-nums text-[12px] font-semibold text-content whitespace-nowrap">
            {row.mine
              ? `${money(row.mineSales)} · ${pct(row.mineShare)}`
              : "not in top 200"}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-sm flex-none bg-store_compare" />
          <span className="tabular-nums text-[12px] font-semibold text-content whitespace-nowrap">
            {row.theirs
              ? `${money(row.theirsSales)} · ${pct(row.theirsShare)}`
              : "not in top 200"}
          </span>
        </span>
      </span>
    </button>
  );
};

/** One price, and what each store did at it. */
interface PriceLine {
  price: number;
  mine: TopItemPricePoint | null;
  theirs: TopItemPricePoint | null;
}

/**
 * The price points, keyed on the PRICE rather than one table per store.
 *
 * Two tables would make the reader align the rows themselves. Keyed on the
 * price they line up, and a blank cell is the finding: the other store never
 * rang it at this. That is the answer to "why is it bigger there" far more
 * often than anything about the shopper.
 */
const priceLines = (
  code: string,
  minePoints: TopItemPricePoint[],
  theirsPoints: TopItemPricePoint[],
): PriceLine[] => {
  const byPrice = new Map<number, PriceLine>();
  const put = (p: TopItemPricePoint, side: "mine" | "theirs") => {
    if (p.product_code !== code) return;
    const held =
      byPrice.get(p.price) ?? { price: p.price, mine: null, theirs: null };
    held[side] = p;
    byPrice.set(p.price, held);
  };
  for (const p of minePoints) put(p, "mine");
  for (const p of theirsPoints) put(p, "theirs");
  return [...byPrice.values()].sort((a, b) => b.price - a.price);
};

const Rail = ({
  row,
  openStoreName,
  compareStoreName,
  minePoints,
  theirsPoints,
  absent,
  absentLoading,
}: {
  row: ComparedTopItem | null;
  openStoreName: string;
  compareStoreName: string;
  minePoints: TopItemPricePoint[];
  theirsPoints: TopItemPricePoint[];
  absent: ItemDetailResponse | null;
  absentLoading: boolean;
}) => {
  /** The strip opens closed, like every other one. */
  const [open, setOpen] = useState(false);

  if (!row) {
    return (
      <div className="flex-1 min-w-0 flex items-center justify-center px-4">
        <p className="text-[13px] text-content text-center">
          Pick an item to compare it.
        </p>
      </div>
    );
  }

  const lines = priceLines(row.code, minePoints, theirsPoints);
  // The same tone the row wears, so the rail and the list never disagree
  // about which way this item goes.
  const sev = toneOf(divergenceSigned(row));
  const cta = CTA_SEVERITY_CLASSES[sev];
  const Mark_ = sev === "critical" ? ExclamationCircleIcon : CheckCircleIcon;
  const missingName =
    row.only === "mine" ? compareStoreName : openStoreName;
  const sold = absent?.stores?.[0] ?? null;


  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0">
      {/*
        Tinted by this item's own grade, the way the panel's own title bar is
        tinted by the store's. Not a CtaStrip: a strip's job is to hold detail
        BEHIND a chevron, and nothing here should be behind one -- the claim
        under it is the most important sentence on the screen. So it takes the
        severity dress without the folding.
      */}
      {/*
        The same strip the department comparison opens with: the name, and the
        finding folded behind it. Over the panel rather than above it, so
        opening and closing never moves the blocks underneath — the reader
        keeps their place in the thing the strip describes.
      */}
      <div className={`relative flex-shrink-0 border-b ${cta.border}`}>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-left transition-colors ${cta.bg} ${cta.hoverBg}`}
        >
          <Mark_ className={`w-4 h-4 flex-shrink-0 ${cta.text}`} />
          <span
            className={`min-w-0 flex-1 truncate text-[14px] font-semibold ${cta.text}`}
          >
            {row.description}
          </span>
          <span
            className={`flex-none tabular-nums text-[12px] font-bold ${cta.text}`}
          >
            {row.shareGap === null ? "≥ " : ""}
            {pts(divergenceSigned(row))} pts
          </span>
          {open ? (
            <ChevronUpIcon className={`w-3.5 h-3.5 flex-shrink-0 ${cta.text}`} />
          ) : (
            <ChevronDownIcon className={`w-3.5 h-3.5 flex-shrink-0 ${cta.text}`} />
          )}
        </button>

        {open && (
          <div
            className={`absolute top-full left-0 right-0 z-20 px-3.5 py-2.5 border-b shadow-lg ${cta.bg} ${cta.border}`}
          >
            <p className={`text-[12.5px] leading-snug ${cta.text}`}>
              <span className="font-bold tabular-nums">{row.code}</span>
              {" · "}
              {row.dept}
              {row.only === null && " · carried by both"}
            </p>

            {row.only !== null && (
              <p className={`text-[12.5px] leading-snug mt-1.5 ${cta.text}`}>
                Not in <b>{missingName}&rsquo;s top 200</b>
                {absentLoading && " — asking…"}
                {!absentLoading && sold && (
                  <>
                    {" "}
                    — and they sold <b>{money(sold.total_sales)}</b> of it this
                    week.
                  </>
                )}
                {!absentLoading && absent && !sold && (
                  <> — and they sold <b>none of it this week</b>.</>
                )}
                {" "}
                A sales answer, not a shelf one: a slow mover can be stocked and
                ring nothing in a week.
              </p>
            )}

            {row.unitsDisagree && (
              <p className={`text-[12.5px] leading-snug mt-1.5 ${cta.text}`}>
                <b>These stores ring this code differently</b> — one on the
                scale, one as a pack. The amounts are not comparable; sales
                and share still are.
              </p>
            )}
          </div>
        )}
      </div>

      <div
        data-help="top200-compare-rail"
        className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-3.5 py-3 flex flex-col"
      >
        <Block title={`This week against ${compareStoreName}`}>
          <div className="flex flex-col gap-2.5">
            <Measure
              title="Sales"
              mine={row.mineSales}
              theirs={row.theirsSales}
              us={openStoreName}
              them={compareStoreName}
              fmt={money}
              better="more"
            />
            {/* Only where both sides count the same thing. Pounds against
                packages is not a comparison, and a bar pair would draw one. */}
            {!row.unitsDisagree && (
              <Measure
                title={row.mine && weighed(row.mine) ? "Weight" : "Units"}
                mine={row.mine ? amountOf(row.mine) : 0}
                theirs={row.theirs ? amountOf(row.theirs) : 0}
                us={openStoreName}
                them={compareStoreName}
                fmt={(v) =>
                  v.toLocaleString(undefined, { maximumFractionDigits: 1 })
                }
                better="more"
              />
            )}
          </div>
        </Block>

        <Block title="Share of each store's top 200">
          <div className="grid grid-cols-[1fr_120px_120px] gap-x-3 gap-y-1.5 text-[13px] text-content items-baseline">
            <span />
            <span className="text-right text-[11.5px] font-bold inline-flex items-center justify-end gap-1.5 truncate">
              <span className={`w-2 h-2 rounded-sm flex-none ${severityDotClass[sev]}`} />
              <span className="truncate">{openStoreName}</span>
            </span>
            <span className="text-right text-[11.5px] font-bold inline-flex items-center justify-end gap-1.5 truncate">
              <span className="w-2 h-2 rounded-sm flex-none bg-store_compare" />
              <span className="truncate">{compareStoreName}</span>
            </span>

            <span className="col-span-3 h-px bg-brand_line my-0.5" />

            <span className="font-semibold">Share</span>
            <span className="text-right tabular-nums font-bold">
              {pct(row.mineShare)}
            </span>
            <span className="text-right tabular-nums font-bold">
              {pct(row.theirsShare)}
            </span>

            <span>Amount</span>
            <span className="text-right tabular-nums">
              {amountTextOf(row.mine) ?? "—"}
            </span>
            <span className="text-right tabular-nums">
              {amountTextOf(row.theirs) ?? "—"}
            </span>

            <span>Avg price</span>
            <span className="text-right tabular-nums">
              {row.mine ? (avgPrice(row.mine)?.toFixed(2) ?? "—") : "—"}
            </span>
            <span className="text-right tabular-nums">
              {row.theirs ? (avgPrice(row.theirs)?.toFixed(2) ?? "—") : "—"}
            </span>

            <span>Margin</span>
            <span className="text-right tabular-nums">
              {row.mine && row.mine.margin !== null
                ? `${row.mine.margin.toFixed(1)}%`
                : "—"}
            </span>
            <span className="text-right tabular-nums">
              {row.theirs && row.theirs.margin !== null
                ? `${row.theirs.margin.toFixed(1)}%`
                : "—"}
            </span>
          </div>
        </Block>

        {lines.length > 0 && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-content mb-1.5">
              What it rang at, and where
            </p>
            <div className="grid grid-cols-[76px_1fr_1fr] gap-x-3 gap-y-1.5 text-[13px] text-content items-baseline">
              <span className="font-mono text-[11px] uppercase tracking-wider">
                Price
              </span>
              <span className="text-right text-[11.5px] font-bold inline-flex items-center justify-end gap-1.5 truncate">
                <span className={`w-2 h-2 rounded-sm flex-none ${severityDotClass[sev]}`} />
                <span className="truncate">{openStoreName}</span>
              </span>
              <span className="text-right text-[11.5px] font-bold inline-flex items-center justify-end gap-1.5 truncate">
                <span className="w-2 h-2 rounded-sm flex-none bg-store_compare" />
                <span className="truncate">{compareStoreName}</span>
              </span>

              <span className="col-span-3 h-px bg-brand_line my-0.5" />

              {lines.map((l) => (
                <PriceRow key={l.price} line={l} />
              ))}
            </div>
            <p className="text-[12.5px] text-content leading-snug mt-2.5">
              Keyed on the price, so the rows line up and a blank cell is the
              finding: the other store never rang it at that.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const side = (p: TopItemPricePoint | null) =>
  p === null
    ? null
    : `${(p.weight > 0 ? p.weight : p.units).toLocaleString(undefined, {
        minimumFractionDigits: p.weight > 0 ? 1 : 0,
        maximumFractionDigits: p.weight > 0 ? 1 : 0,
      })} ${p.weight > 0 ? "lb" : "u"} · ${money(p.net_sales)}`;

const PriceRow = ({ line }: { line: PriceLine }) => (
  <>
    <span className="tabular-nums font-bold">{money(line.price)}</span>
    <span className="text-right tabular-nums">
      {side(line.mine) ?? (
        <span className="text-content">never rang it</span>
      )}
    </span>
    <span className="text-right tabular-nums">
      {side(line.theirs) ?? (
        <span className="text-content">never rang it</span>
      )}
    </span>
  </>
);

export default TopItemsReport;
