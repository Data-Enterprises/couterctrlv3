import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "../../../../hooks";
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
  onBack,
}: Props) => {
  const { url, token } = useAppSelector((s) => s.app);
  const cache = useAppSelector((s) => s.dev.salesLedger.topItemsCache);
  const toast = useToast();

  const [mine, setMine] = useState<Side | null>(null);
  const [theirs, setTheirs] = useState<Side | null>(null);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<CompareFilter>("all");
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
    const held = (k: string): Side | null => {
      const entry = cache[k];
      return entry ? { rows: entry.rows, points: entry.points } : null;
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
        return { rows: j.items ?? [], points: j.price_points ?? [] };
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
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            title="Back to all stores"
            className="flex-shrink-0 h-6 px-2 inline-flex items-center gap-1 rounded-md border border-brand_navy/25 text-[12px] font-bold text-content hover:bg-bkg transition-colors"
          >
            <span className="text-[13px] leading-none">{"‹"}</span>
            Back
          </button>

          <p className="min-w-0 flex-1 text-[16.5px] font-bold leading-snug text-content truncate">
            <span className="tabular-nums">{differ}</span> of {rows.length}{" "}
            differ
          </p>

          <span className="flex-shrink-0 text-[11.5px] text-content truncate max-w-[220px]">
            vs {compareStoreName}
          </span>
        </div>

        {/* The three piles, written where they are drawn. */}
        <span className="flex h-6 rounded-md overflow-hidden bg-bkg mt-2.5 text-[11.5px] font-semibold">
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
              className="flex items-center px-2.5 text-custom-white whitespace-nowrap overflow-hidden bg-brand_navy/55"
              style={{
                width: `${Math.max(10, (totals.onlyMine / pileTotal) * 100)}%`,
              }}
            >
              <span className="truncate">{totals.onlyMine} only here</span>
            </span>
          )}
          {totals.onlyTheirs > 0 && (
            <span className="flex items-center px-2.5 flex-1 text-content whitespace-nowrap overflow-hidden bg-brand_line_2/60">
              <span className="truncate">
                {totals.onlyTheirs} only at {compareStoreName}
              </span>
            </span>
          )}
        </span>

        {byDept.length > 0 && (
          <CtaStrip
            tone={OUTLINE_TONE}
            className="mt-1.5 rounded-md border"
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
        )}
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 border-b border-gray-100">
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
            ["mine", `Only here ${totals.onlyMine}`],
            ["theirs", `Only there ${totals.onlyTheirs}`],
          ] as [CompareFilter, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter((f) => (f === id ? "all" : id))}
            className={`flex-none rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
              filter === id ? PILL_ON : PILL_IDLE
            }`}
          >
            {label}
          </button>
        ))}

        <span className="flex-1" />

        {(
          [
            ["divergence", "Difference"],
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
          <div className="flex-shrink-0 flex items-center gap-3 px-3.5 py-1.5 border-b border-gray-100 bg-brand_paper flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-content">
              <span className="w-2.5 h-2.5 rounded-sm bg-delta_positive_mid" />
              {openStoreName} ahead
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-content">
              <span className="w-2.5 h-2.5 rounded-sm bg-delta_negative_text" />
              behind
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-content">
              <span className="w-2.5 h-2.5 rounded-sm bg-brand_navy/55" />
              {compareStoreName}
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
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
  const ahead = signed >= 0;
  const minePct = row.pair > 0 ? (row.mineSales / row.pair) * 100 : 0;
  const theirsPct = row.pair > 0 ? (row.theirsSales / row.pair) * 100 : 0;

  return (
    <button
      onClick={onPick}
      className={`w-full text-left px-3.5 py-2 border-b transition-colors ${
        selected
          ? // Always the pair: the tint alone reads as a stripe rather than
            // a selection, which is why the audit asks for both.
            "bg-row_selected border-row_selected_border"
          : row.only
            ? "border-gray-100 bg-brand_paper hover:bg-bkg"
            : "border-gray-100 hover:bg-bkg"
      }`}
    >
      <span className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1 text-[13px] font-semibold text-content truncate">
          {row.description}
        </span>
        <span className="flex-none text-[11px] text-content">{row.dept}</span>
        <span
          className={`flex-none tabular-nums text-[11.5px] font-bold px-1.5 py-px rounded ${
            ahead
              ? "bg-delta_positive_bg text-delta_positive_text"
              : "bg-delta_negative_bg text-delta_negative_text"
          }`}
          title={
            row.shareGap === null
              ? "At least this far apart — the other store's share is unknown"
              : "Difference in share of each store's top 200"
          }
        >
          {row.shareGap === null ? "≥ " : ""}
          {pts(signed)}
        </span>
      </span>

      <span className="block mt-1.5 h-[13px] rounded bg-bkg overflow-hidden flex">
        <span className="h-full flex" style={{ width: `${(row.pair / Math.max(1, widest)) * 100}%` }}>
          <span
            className={ahead ? "bg-delta_positive_mid" : "bg-delta_negative_text"}
            style={{ width: `${minePct}%` }}
          />
          <span className="bg-brand_navy/55" style={{ width: `${theirsPct}%` }} />
        </span>
        {row.only !== null && (
          <span
            className="w-4 flex-none border-l border-brand_line_2"
            style={{
              background:
                "repeating-linear-gradient(135deg, rgb(var(--color-brand-line-2)) 0 4px, rgb(var(--color-bkg)) 4px 8px)",
            }}
            title="Not in the other store's top 200"
          />
        )}
      </span>

      <span className="block mt-1.5 tabular-nums text-[11px] text-content">
        {row.mine
          ? `${money(row.mineSales)} · ${pct(row.mineShare)}`
          : "—"}
        {"   |   "}
        {row.theirs
          ? `${money(row.theirsSales)} · ${pct(row.theirsShare)}`
          : "not in top 200"}
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
  if (!row) {
    return (
      <div className="flex-1 min-w-0 flex items-center justify-center px-4">
        <p className="text-[12px] text-content text-center">
          Pick an item to compare it.
        </p>
      </div>
    );
  }

  const lines = priceLines(row.code, minePoints, theirsPoints);
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
      <div className="flex-shrink-0 px-3.5 py-2.5 border-b border-gray-100">
        <p className="text-[13.5px] font-bold text-content leading-snug">
          {row.description}
        </p>
        <p className="tabular-nums text-[11px] text-content mt-px">
          {row.code} · {row.dept}
          {row.only === null ? " · carried by both" : ""}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-3.5 py-3 flex flex-col gap-3">
        {/* The claim, on a one-sided row. Resolved on selection, no button. */}
        {row.only !== null && (
          <div className="rounded-lg border border-brand_line_2 bg-brand_paper px-3 py-2.5">
            <p className="text-[12.5px] text-content leading-snug">
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
            <p className="text-[11px] text-content leading-snug mt-1.5">
              A sales answer, not a shelf one. A slow mover can be stocked and
              ring nothing in a week.
            </p>
          </div>
        )}

        {row.unitsDisagree && (
          <div className="rounded-lg border border-brand_danger_line bg-brand_danger_bg px-3 py-2.5">
            <p className="text-[12px] text-brand_danger leading-snug">
              These stores ring this code differently — one on the scale, one
              as a pack. The amounts below are not comparable. Sales and share
              still are.
            </p>
          </div>
        )}

        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-content mb-1.5">
            Side by side
          </p>
          <div className="grid grid-cols-[1fr_96px_96px] gap-x-2.5 gap-y-1 text-[12px] text-content">
            <span />
            <span className="text-right font-mono text-[10.5px] uppercase tracking-wider truncate">
              {openStoreName}
            </span>
            <span className="text-right font-mono text-[10.5px] uppercase tracking-wider truncate">
              {compareStoreName}
            </span>

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
            <div className="grid grid-cols-[62px_1fr_1fr] gap-x-2 gap-y-1 text-[11.5px] text-content items-center">
              <span className="font-mono text-[10.5px] uppercase tracking-wider">
                Price
              </span>
              <span className="text-right font-mono text-[10.5px] uppercase tracking-wider truncate">
                {openStoreName}
              </span>
              <span className="text-right font-mono text-[10.5px] uppercase tracking-wider truncate">
                {compareStoreName}
              </span>

              {lines.map((l) => (
                <PriceRow key={l.price} line={l} />
              ))}
            </div>
            <p className="text-[11.5px] text-content leading-snug mt-2">
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
