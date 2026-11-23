// Hooks
import { useMemo, useState } from "react";
import { useTriStateSort } from "../../../../../../utils/useTriStateSort";
import { useAbsentDetail, useCompareSides } from "./hooks";

// Utils
import {
  compareDeptOptions,
  compareTopItems,
  compareTotals,
  compareUpcs,
  divergenceByDept,
  metricSigned,
  filterCompared,
  sortCompared,
  type CompareFilter,
  type CompareMetric,
} from "./utils/topItemsCompare";

// Components
import LoadingIndicator from "../../../../../../components/loading/LoadingIndicator";
import UpcContextMenu from "../../../../../../components/UpcContextMenu";
import CompareFilters from "./components/CompareFilters";
import CompareHeadline from "./components/CompareHeadline";
import CompareLegend from "./components/CompareLegend";
import Row from "./components/Row";
import Rail from "./components/Rail";

interface Top200CompareProps {
  openStoreName: string;
  openStoreId: number;
  compareStoreId: number;
  compareStoreName: string;
  twStart: string;
  twEnd: string;
  onBack: () => void;
}

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
const Top200Compare = ({
  openStoreName,
  openStoreId,
  compareStoreId,
  compareStoreName,
  twStart,
  twEnd,
  onBack,
}: Top200CompareProps) => {
  const { mine, theirs, loading } = useCompareSides(
    openStoreId,
    compareStoreId,
    twStart,
    twEnd,
  );

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

  const rows = useMemo(
    () => (mine && theirs ? compareTopItems(mine.rows, theirs.rows) : []),
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

  const deptOpts = useMemo(
    () => compareDeptOptions(rows, filter, text),
    [rows, filter, text],
  );

  const selected = useMemo(
    () => shown.find((r) => r.code === picked) ?? shown[0] ?? null,
    [shown, picked],
  );

  const upcs = useMemo(() => compareUpcs(shown, metric), [shown, metric]);

  const { absent, absentLoading } = useAbsentDetail(
    selected,
    openStoreId,
    compareStoreId,
    twStart,
    twEnd,
  );

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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <CompareHeadline
        openStoreName={openStoreName}
        compareStoreName={compareStoreName}
        totals={totals}
        itemCount={rows.length}
        byDept={byDept}
        onBack={onBack}
      />

      <CompareFilters
        openStoreName={openStoreName}
        compareStoreName={compareStoreName}
        totals={totals}
        itemCount={rows.length}
        text={text}
        setText={setText}
        filter={filter}
        setFilter={setFilter}
        deptOpts={deptOpts}
        depts={depts}
        setDepts={setDepts}
        metric={metric}
        setMetric={setMetric}
      />

      {/* List and rail — the split this tab already has */}
      <div className="flex-1 min-h-0 flex">
        <div className="w-[471px] flex-shrink-0 border-r border-line_hair flex flex-col min-h-0">
          <CompareLegend
            compareStoreName={compareStoreName}
            metric={metric}
            sort={sort}
            onSort={handleSort}
          />

          <div
            data-help="top200-compare-list"
            className="cc-scroll"
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
          allUpcs={upcs.all}
          severityUpcs={upcs.bySeverity}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
};

export default Top200Compare;
