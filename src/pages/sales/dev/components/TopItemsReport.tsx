import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { cacheTopItemsTy } from "../../../../features/dev/devSalesLedgerSlice";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import CtaStrip, { type CtaTone } from "../../../../components-dev/CtaStrip";
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
import { avgPrice } from "../shared/topItems";
import {
  gradeSeverity,
  pillClass,
  severityDotClass,
} from "../../../../utils/severity";
import {
  amountTextOf,
  compareTopItems,
  compareTotals,
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

/** The rail header's dress, per grade. Background and hairline only -- the
 *  text stays `content`, because a severity text colour on a product name
 *  would grade the NAME rather than the figure. */
const SEV_HEAD: Record<
  "critical" | "watch" | "healthy",
  { bg: string; border: string }
> = {
  critical: {
    bg: "bg-severity_critical_bg",
    border: "border-severity_critical_text/25",
  },
  watch: {
    bg: "bg-severity_watch_bg",
    border: "border-severity_watch_text/25",
  },
  healthy: {
    bg: "bg-severity_healthy_bg",
    border: "border-severity_healthy_text/25",
  },
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
  /** The page's item threshold, in points. Graded the way Sub Dept Margins
   *  grades margin points: anything ahead is healthy, behind but inside the
   *  threshold is watch, past it is critical. */
  threshold: number;
  onBack: () => void;
}

const PILL_IDLE =
  "border-brand_navy/75 bg-custom-white text-content hover:border-brand_navy/50";
const PILL_ON =
  "border-filter_active_border bg-filter_active text-content ring-2 ring-filter_active_border/30";

const TopItemsReport = ({
  openStoreName,
  openStoreId,
  compareStoreId,
  compareStoreName,
  twStart,
  twEnd,
  threshold,
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
    () => sortCompared(filterCompared(rows, filter, text), sort),
    [rows, filter, text, sort],
  );

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
            {totals.onlyMine > 0 && (
              <span
                className="flex items-center px-2.5 text-custom-white whitespace-nowrap overflow-hidden bg-brand_navy/62"
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
              <span className="flex items-center px-2.5 flex-1 text-content whitespace-nowrap overflow-hidden bg-brand_line_2/60">
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
        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 border-b border-gray-100"
      >
        <div className="flex w-[200px] flex-none items-center gap-2 rounded-lg bg-bkg px-3">
          <label htmlFor="top200-find" className="sr-only">
            Find an item
          </label>
          <input
            id="top200-find"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Item, code or department"
            inputMode="search"
            className="min-w-0 flex-1 border-0 bg-transparent py-1.5 text-[12px] text-content placeholder:text-brand_placeholder"
            style={{ outline: "none", boxShadow: "none" }}
          />
        </div>

        {(
          [
            ["both", `Both ${totals.both}`],
            ["mine", `Only ${openStoreName} ${totals.onlyMine}`],
            ["theirs", `Only ${compareStoreName} ${totals.onlyTheirs}`],
          ] as [CompareFilter, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter((f) => (f === id ? "all" : id))}
            className={`flex-none max-w-[180px] truncate rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
              filter === id ? PILL_ON : PILL_IDLE
            }`}
          >
            {label}
          </button>
        ))}

        <span className="flex-1" />

        {(
          [
            ["divergence", "Share gap"],
            ["sales", "Sales"],
          ] as [CompareSort, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={sort === id}
            onClick={() => setSort(id)}
            className={`flex-none rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
              sort === id ? PILL_ON : PILL_IDLE
            }`}
          >
            {label}
          </button>
        ))}
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
              <span className={`w-2.5 h-2.5 rounded-sm ${severityDotClass.watch}`} />
              behind
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-content">
              <span className={`w-2.5 h-2.5 rounded-sm ${severityDotClass.critical}`} />
              behind by over {threshold}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-content">
              <span className="w-2.5 h-2.5 rounded-sm bg-brand_navy/62" />
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
                threshold={threshold}
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
          threshold={threshold}
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
  threshold,
  selected,
  onPick,
}: {
  row: ComparedTopItem;
  widest: number;
  threshold: number;
  selected: boolean;
  onPick: () => void;
}) => {
  const signed = divergenceSigned(row);
  // The ledger's grading, in the ledger's colours: `gradeSeverity` reads a
  // signed figure against the threshold, which is what Sub Dept Margins
  // already does with margin POINTS. Share points grade the same way.
  const sev = gradeSeverity(signed, threshold);
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
          className={`flex-none tabular-nums text-[11.5px] font-bold px-1.5 py-px rounded ${pillClass(
            signed,
            threshold,
          )}`}
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
          <span className="bg-brand_navy/62" style={{ width: `${theirsPct}%` }} />
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
          <span className="w-2 h-2 rounded-sm flex-none bg-brand_navy/62" />
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
  threshold,
  openStoreName,
  compareStoreName,
  minePoints,
  theirsPoints,
  absent,
  absentLoading,
}: {
  row: ComparedTopItem | null;
  threshold: number;
  openStoreName: string;
  compareStoreName: string;
  minePoints: TopItemPricePoint[];
  theirsPoints: TopItemPricePoint[];
  absent: ItemDetailResponse | null;
  absentLoading: boolean;
}) => {
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
  // The same grade the row wears, so the rail and the list never disagree
  // about how this item is doing.
  const sev = gradeSeverity(divergenceSigned(row), threshold);
  const missingName =
    row.only === "mine" ? compareStoreName : openStoreName;
  const sold = absent?.stores?.[0] ?? null;

  const figure = (label: string, a: string, b: string, bold = false) => (
    <>
      <span className={bold ? "font-semibold" : ""}>{label}</span>
      <span className={`text-right tabular-nums ${bold ? "font-bold" : ""}`}>
        {a}
      </span>
      <span className={`text-right tabular-nums ${bold ? "font-bold" : ""}`}>
        {b}
      </span>
    </>
  );

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0">
      {/*
        Tinted by this item's own grade, the way the panel's own title bar is
        tinted by the store's. Not a CtaStrip: a strip's job is to hold detail
        BEHIND a chevron, and nothing here should be behind one -- the claim
        under it is the most important sentence on the screen. So it takes the
        severity dress without the folding.
      */}
      <div
        className={`flex-shrink-0 px-3.5 py-3 border-b ${
          SEV_HEAD[sev].bg
        } ${SEV_HEAD[sev].border}`}
      >
        <div className="flex items-start gap-2.5">
          <span
            className={`mt-1 w-2.5 h-2.5 rounded-sm flex-none ${severityDotClass[sev]}`}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-bold text-content leading-snug">
              {row.description}
            </p>
            <p className="tabular-nums text-[12px] text-content mt-0.5">
              {row.code} · {row.dept}
              {row.only === null ? " · carried by both" : ""}
            </p>
          </div>
          <span
            className={`flex-none tabular-nums text-[12px] font-bold px-2 py-0.5 rounded ${pillClass(
              divergenceSigned(row),
              threshold,
            )}`}
          >
            {row.shareGap === null ? "≥ " : ""}
            {pts(divergenceSigned(row))} pts
          </span>
        </div>
      </div>

      <div
        data-help="top200-compare-rail"
        className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-3.5 py-3 flex flex-col gap-3"
      >
        {/* The claim, on a one-sided row. Resolved on selection, no button. */}
        {row.only !== null && (
          <div className="rounded-lg border border-brand_line_2 bg-brand_paper px-3 py-2.5">
            <p className="text-[13.5px] text-content leading-snug">
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
                <>
                  {" "}
                  — and they sold <b>none of it this week</b>.
                </>
              )}
            </p>
            <p className="text-[12px] text-content leading-snug mt-2">
              A sales answer, not a shelf one. A slow mover can be stocked and
              ring nothing in a week.
            </p>
          </div>
        )}

        {row.unitsDisagree && (
          <div className="rounded-lg border border-brand_danger_line bg-brand_danger_bg px-3 py-2.5">
            <p className="text-[12.5px] text-brand_danger leading-snug">
              These stores ring this code differently — one on the scale, one
              as a pack. The amounts below are not comparable. Sales and share
              still are.
            </p>
          </div>
        )}

        {/* "Comparison" sits ON the header row with the two store names
            rather than above it, and each name carries its bar swatch so the
            rail and the list agree about which store is which. The columns
            are 132px: at 96 a store name clipped to "002 - IGA IRV…". */}
        <div>
          <div className="grid grid-cols-[1fr_132px_132px] gap-x-3 gap-y-1.5 text-[13.5px] text-content items-baseline">
            <span className="font-mono text-[11px] uppercase tracking-wider">
              Comparison
            </span>
            <span className="text-right text-[11.5px] font-bold inline-flex items-center justify-end gap-1.5 truncate">
              <span className={`w-2 h-2 rounded-sm flex-none ${severityDotClass[sev]}`} />
              <span className="truncate">{openStoreName}</span>
            </span>
            <span className="text-right text-[11.5px] font-bold inline-flex items-center justify-end gap-1.5 truncate">
              <span className="w-2 h-2 rounded-sm flex-none bg-brand_navy/62" />
              <span className="truncate">{compareStoreName}</span>
            </span>

            <span className="col-span-3 h-px bg-brand_line my-0.5" />

            {figure(
              "Sales",
              row.mine ? money(row.mineSales) : "—",
              row.theirs ? money(row.theirsSales) : "—",
              true,
            )}
            {figure(
              "Amount",
              amountTextOf(row.mine) ?? "—",
              amountTextOf(row.theirs) ?? "—",
            )}
            {figure(
              "Avg price",
              row.mine ? (avgPrice(row.mine)?.toFixed(2) ?? "—") : "—",
              row.theirs ? (avgPrice(row.theirs)?.toFixed(2) ?? "—") : "—",
            )}
            {figure(
              "Margin",
              row.mine?.margin !== null && row.mine !== null
                ? `${row.mine.margin.toFixed(1)}%`
                : "—",
              row.theirs?.margin !== null && row.theirs !== null
                ? `${row.theirs.margin.toFixed(1)}%`
                : "—",
            )}
            {figure(
              "Share of top 200",
              pct(row.mineShare),
              pct(row.theirsShare),
              true,
            )}
          </div>
        </div>

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
                <span className="w-2 h-2 rounded-sm flex-none bg-brand_navy/62" />
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
