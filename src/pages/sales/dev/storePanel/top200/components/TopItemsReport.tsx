// Hooks
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../../hooks";
import { useToast } from "../../../../../../components/toasts/hooks/useToast";
import { useTriStateSort } from "../../../../../../utils/useTriStateSort";

// Redux
import { cacheTopItemsTy } from "../../../../../../features/dev/devSalesLedgerSlice";

// API
import {
  getItemDetail,
  getTopItems,
  TOP_ITEMS_FETCH,
  type ItemDetailResponse,
  type TopItemPricePoint,
  type TopItemRow,
  type TopItemsResponse,
} from "../../../../../../api/topItems";

// Utils
import { severityDotClass } from "../../../../../../utils/severity";
import {
  compareTopItems,
  compareTotals,
  deptsPresent,
  divergenceByDept,
  metricSigned,
  filterCompared,
  sortCompared,
  type CompareFilter,
  type CompareMetric,
} from "../utils/topItemsCompare";
import { money } from "../utils";

// Components
import LoadingIndicator from "../../../../../../components-dev/loading/LoadingIndicator";
import CtaStrip, { type CtaTone } from "../../../../../../components-dev/CtaStrip";
import MultiSelectFilter from "../../../../../../components-dev/filters/MultiSelectFilter";
import SelectFilter from "../../../../../../components-dev/filters/SelectFilter";
import TextFilter from "../../../../../../components-dev/filters/TextFilter";
import SortHeader from "../../../../../../components-dev/SortHeader";
import UpcContextMenu from "../../../../../../components-dev/UpcContextMenu";
import Row from "./Row";
import Rail from "./Rail";

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
  /** What a row reports, and what the list is ordered by when nothing
   *  else is. */
  const [metric, setMetric] = useState<CompareMetric>("share");
  /** The house tri-state over that: desc, asc, then back to the list's own
   *  order. A column sort here is a lens, not a new permanent ordering. */
  const { sort, handleSort, applySort } = useTriStateSort<"metric">();
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [depts, setDepts] = useState<string[]>([]);
  /** Right-click anywhere in the list. `upc: ""` means the click landed
   *  between rows, where only the whole-list actions make sense. */
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    upc: string;
  } | null>(null);

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
    () =>
      applySort(
        sortCompared(filterCompared(rows, filter, text, depts), metric),
        (r) => metricSigned(r, metric),
      ),
    // `applySort` is rebuilt each render; the sort state it closes over is
    // what actually changes.
    [rows, filter, text, depts, metric, sort],
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
   * What the menu can copy: the codes on screen, and the same codes split
   * by which way they went.
   *
   * `watch` is empty because this screen grades in two -- ahead or behind --
   * and an empty list is how the menu knows not to offer that line.
   */
  const allUpcs = useMemo(() => shown.map((r) => r.code), [shown]);
  const severityUpcs = useMemo(
    () => ({
      critical: shown
        .filter((r) => metricSigned(r, metric) < 0)
        .map((r) => r.code),
      watch: [],
      healthy: shown
        .filter((r) => metricSigned(r, metric) >= 0)
        .map((r) => r.code),
    }),
    [shown, metric],
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
            {/* Three weights of one colour: solid, a quarter, a tenth, all
                with dark text on the two tints. The piles are COUNTS of
                items, not the stores themselves -- the row bars are where a
                store wears its own colour. */}
            {totals.onlyMine > 0 && (
              <span
                className="flex items-center px-2.5 text-content whitespace-nowrap overflow-hidden bg-brand_navy/25"
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
              <span className="flex items-center px-2.5 flex-1 text-content whitespace-nowrap overflow-hidden bg-brand_navy/15">
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

        {/* What a row REPORTS, not how the list is ordered -- the order
            follows it. `plain`, because this always holds a value: the
            active ring says "narrowing a list", which a choice of unit
            never does. */}
        <SelectFilter
          plain
          options={[
            { value: "", label: "Share gap" },
            { value: "sales", label: "Sales gap" },
          ]}
          value={metric === "sales" ? "sales" : ""}
          onChange={(v) => setMetric(v === "sales" ? "sales" : "share")}
          placeholder="Share gap"
          className="w-[120px] flex-none"
        />
      </div>

      {/* List and rail — the split this tab already has */}
      <div className="flex-1 min-h-0 flex">
        <div className="w-[471px] flex-shrink-0 border-r border-gray-100 flex flex-col min-h-0">
          {/* The ledger's own dots, so the two halves of the page grade in
              one language: ahead, behind, and behind past the threshold. */}
          <div className="flex-shrink-0 flex items-center gap-3 px-3.5 py-1.5 border-b border-brand_line_2 bg-brand_paper flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-content">
              <span className={`w-2.5 h-2.5 rounded-full ${severityDotClass.healthy}`} />
              ahead
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-content">
              <span className={`w-2.5 h-2.5 rounded-full ${severityDotClass.critical}`} />
              behind
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-content">
              <span className="w-2.5 h-2.5 rounded-full bg-brand_navy/15 border border-brand_navy/25" />
              {compareStoreName}
            </span>

            <span className="flex-1" />

            {/* Sorts by whatever the row is reporting, so the control and
                the figure beside it can never name different things. */}
            <SortHeader
              col="metric"
              label={metric === "sales" ? "Sales gap" : "Share gap"}
              sort={sort}
              onSort={handleSort}
              className="text-[11px] font-semibold text-content"
            />
          </div>

          <div
            data-help="top200-compare-list"
            className="flex-1 min-h-0 overflow-y-auto thin-scrollbar"
            onContextMenu={(e) => {
              e.preventDefault();
              setCtxMenu({ x: e.clientX, y: e.clientY, upc: "" });
            }}
          >
            {shown.map((r) => (
              <Row
                key={r.code}
                row={r}
                widest={widest}
                metric={metric}
                selected={selected?.code === r.code}
                onPick={() => setPicked(r.code)}
                onContext={(x, y) => setCtxMenu({ x, y, upc: r.code })}
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
          metric={metric}
          openStoreName={openStoreName}
          compareStoreName={compareStoreName}
          minePoints={mine?.points ?? []}
          theirsPoints={theirs?.points ?? []}
          absent={absent}
          absentLoading={absentLoading}
        />
      </div>

      {ctxMenu && (
        <UpcContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          upc={ctxMenu.upc}
          allUpcs={allUpcs}
          severityUpcs={severityUpcs}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
};

export default TopItemsReport;
