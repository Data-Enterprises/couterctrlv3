import { useMemo } from "react";
import { useAppDispatch } from "../../../../hooks";
import {
  setGroupView,
  setInvestigation,
  setMatrixOpen,
} from "../../../../features/dev/devSalesLedgerSlice";
import { useDeptMatrix, type MatrixStore } from "../hooks/useDeptMatrix";
import { bestIn, flagged, type Cell, type Matrix } from "../shared/deptMatrix";
import { applyStoreNumberToName } from "../shared/ledgerUtils";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";

/**
 * Where to look.
 *
 * Every store against every department, indexed so 100 is the contribution
 * that store usually makes. A grid of dollars cannot be read across columns —
 * Grocery dwarfs Hot Deli everywhere, so the biggest figures are always in the
 * same place and nothing stands out. Indexing puts every department on one
 * scale, and the eye goes straight to the cells that are far from 100.
 *
 * All of the arithmetic is in `shared/deptMatrix`. Nothing is computed here.
 *
 * Clicking a cell opens the investigation for that store and department,
 * against whoever is doing that department best — "here is who to copy" is a
 * more useful screen than "here is somebody roughly as bad as you".
 */

/** Distance from 100, in five steps a side. The over-100 ramp is the app's
 *  own heat ramp from `heatColor`; the under-100 ramp is its mirror in the
 *  severity red, because being under is a problem and being over usually is
 *  not — a single symmetric ramp would claim they are the same thing. */
const UNDER: Array<[string, string]> = [
  ["#f2dede", "#8e1010"],
  ["#e3bcbc", "#7a0d0d"],
  ["#cf8f8f", "#f4f7f8"],
  ["#a83c3c", "#f4f7f8"],
  ["#931010", "#f4f7f8"],
];

const OVER: Array<[string, string]> = [
  ["#e6f1fb", "#185fa5"],
  ["#b5d4f4", "#0c447c"],
  ["#85b7eb", "#0c447c"],
  ["#378add", "#f4f7f8"],
  ["#185fa5", "#f4f7f8"],
];

const STEP = 9;

/**
 * How much wider a department's band is than a store's.
 *
 * The page threshold is calibrated for a store's whole week. One department
 * inside one store swings far harder — a slow Tuesday in Hot Deli moves it
 * 20 points and means nothing — so grading a department on the store's number
 * paints half the grid. At ±9 this grid flagged 134 of 288 cells, which is
 * not a shortlist, it is wallpaper.
 *
 * The same reasoning, and the same factor, as `compareForView` widening its
 * bands for a single day: a thinner baseline needs a wider band before it is
 * saying anything.
 */
const DEPT_BAND = 2;

const shade = (index: number | null, band: number) => {
  if (index === null) return { background: "", color: "" };
  const d = index - 100;
  if (Math.abs(d) <= band) return { background: "", color: "" };
  const step = Math.min(4, Math.floor((Math.abs(d) - band) / STEP));
  const [bg, fg] = d < 0 ? UNDER[step] : OVER[step];
  return { background: bg, color: fg };
};

interface Props {
  /** The searched stores, straight off the ledger rows — no second call to
   *  find out who is in the group, and co-located stores are already split by
   *  number there. */
  stores: MatrixStore[];
  gradingMetric: GradingMetric;
  /** The page's own threshold, widened by DEPT_BAND. One control still
   *  governs the ledger's dots and this grid, and an index IS a percentage
   *  of expected, so the two are the same unit — a department simply needs
   *  more of it before it is worth a look. */
  threshold: number;
  /** Full width, or the right panel. The same view either way — only the
   *  room changes, and so does what the header offers. */
  expanded: boolean;
  twStart: string;
  twEnd: string;
  lwStart: string;
  lwEnd: string;
  lyStart: string;
  lyEnd: string;
}

const DeptMatrixPanel = ({
  stores,
  gradingMetric,
  threshold,
  expanded,
  twStart,
  twEnd,
  lwStart,
  lwEnd,
  lyStart,
  lyEnd,
}: Props) => {
  const dispatch = useAppDispatch();

  const args = useMemo(
    () => ({
      stores,
      tw: { start: twStart, end: twEnd },
      lw: { start: lwStart, end: lwEnd },
      ly: { start: lyStart, end: lyEnd },
      metric: gradingMetric,
      enabled: true,
    }),
    [stores, gradingMetric, twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd],
  );

  const { matrix, loading, answered, asked, problem } = useDeptMatrix(args);

  const band = threshold * DEPT_BAND;

  const close = () => dispatch(setMatrixOpen(false));

  const open = (m: Matrix, cell: Cell, deptName: string) => {
    const store = m.rows.find(
      (r) => r.storeid === cell.storeid && r.storeNumber === cell.storeNumber,
    );
    const against = bestIn(m, cell.subDept, cell);
    if (!store || !against) return;
    dispatch(
      setInvestigation({
        storeid: store.storeid,
        storeNumber: store.storeNumber,
        storeName: applyStoreNumberToName(store.storeName, store.storeNumber, []),
        compareStoreid: against.storeid,
        compareStoreNumber: against.storeNumber,
        compareStoreName: applyStoreNumberToName(
          against.storeName,
          against.storeNumber,
          [],
        ),
        subDept: cell.subDept,
        subDeptName: deptName,
      }),
    );
  };

  const flaggedCount = useMemo(() => {
    if (!matrix) return 0;
    return matrix.rows.reduce(
      (a, r) =>
        a +
        matrix.columns.filter((c) => flagged(r.cells.get(c.subDept)?.index ?? null, band))
          .length,
      0,
    );
  }, [matrix, band]);

  const cellCount = (matrix?.rows.length ?? 0) * (matrix?.columns.length ?? 0);
  const soloStore = (matrix?.rows.length ?? 0) < 2;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-custom-white rounded-xl shadow-sm">
      <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2.5 bg-brand_navy">
        {expanded ? (
          <button
            onClick={close}
            className="text-custom-white text-[12.5px] font-semibold hover:underline mr-2"
          >
            ‹ Back to the ledger
          </button>
        ) : (
          <button
            onClick={() => dispatch(setGroupView("stores"))}
            className="text-custom-white/85 text-[12px] font-semibold px-2.5 py-1 rounded hover:bg-custom-white/10 hover:text-custom-white transition-colors"
          >
            By store
          </button>
        )}
        <span
          className={
            expanded
              ? "text-custom-white text-[12.5px] font-semibold"
              : "text-custom-white text-[12px] font-semibold px-2.5 py-1 rounded bg-custom-white/15"
          }
        >
          By department
        </span>

        <span className="ml-auto flex items-center gap-3 flex-shrink-0">
          {!loading && matrix && !soloStore && (
            <span className="text-custom-white/85 text-[12px]">
              <span className="font-semibold text-custom-white">{flaggedCount}</span>{" "}
              of {cellCount} past ±{band}
            </span>
          )}
          {!expanded && (
            <button
              onClick={() => dispatch(setMatrixOpen(true))}
              title="Take the whole page"
              className="text-custom-white text-[11.5px] font-semibold px-2 py-1 rounded border border-custom-white/30 hover:bg-custom-white/10 transition-colors"
            >
              Expand ⤢
            </button>
          )}
        </span>
      </div>

      {loading ? (
        <div className="relative flex-1">
          <LoadingIndicator message="Reading every department" />
        </div>
      ) : problem ? (
        <div className="flex-1 flex items-center justify-center px-6 text-center text-[13px] text-content/85">
          {problem}
        </div>
      ) : !matrix || matrix.columns.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6 text-center text-[13px] text-content/85">
          Nothing sold in this window.
        </div>
      ) : soloStore ? (
        /* A lone store IS the group, so its usual share is all of it and
           every cell comes out at exactly 100. Saying so beats drawing a
           grid of hundreds that looks like a bug. */
        <div className="flex-1 flex items-center justify-center px-8 text-center">
          <div className="max-w-[46ch]">
            <div className="text-[13.5px] font-semibold text-content">
              This needs more than one store
            </div>
            <div className="text-[12.5px] text-content/85 mt-1.5 leading-relaxed">
              The index measures a store against the share of the group it
              usually holds. With one store that share is all of it, so every
              cell would read 100. Search a group to use this.
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
            <table className="border-collapse font-mono text-[11px] w-max">
              <thead>
                <tr>
                  <th className="sticky top-0 left-0 z-30 bg-bkg border-b border-brand_line_2 border-r border-brand_line px-2.5 py-1.5 text-left min-w-[190px]">
                    <span className="uppercase tracking-wide text-content/85 font-semibold">
                      Store
                    </span>
                  </th>
                  {matrix.columns.map((c) => (
                    <th
                      key={c.subDept}
                      className="sticky top-0 z-10 bg-custom-white border-b border-brand_line_2 border-r border-brand_line px-2 py-1.5 text-center font-semibold uppercase tracking-wide text-content/85 w-[74px] max-w-[74px]"
                      title={c.name}
                    >
                      {/* Twenty departments do not fit across a panel, and
                          "Taxable Grocery" is not worth 140px of it. The
                          column is sized for its figures; the full name is
                          on the title and in the cell tooltips. */}
                      <span className="block truncate">{c.name}</span>
                    </th>
                  ))}
                  {/* Not "Store" twice: this is the store across every
                      department it can be measured in, which is a different
                      figure from the name on the left. The shadow is what
                      makes it read as sitting OVER the columns it covers
                      rather than cutting one in half. */}
                  <th
                    className="sticky top-0 right-0 z-30 bg-bkg border-b border-brand_line_2 border-l-2 border-l-brand_navy/25 px-2.5 py-1.5 text-center font-semibold uppercase tracking-wide text-content/85 min-w-[76px]"
                    style={{ boxShadow: "-6px 0 8px -6px rgb(var(--color-brand-navy) / 0.25)" }}
                    title="This store across every department it can be measured in"
                  >
                    All
                  </th>
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map((r) => (
                  <tr key={`${r.storeid}__${r.storeNumber}`}>
                    <td className="sticky left-0 z-10 bg-custom-white border-r border-brand_line border-b border-brand_line px-2.5 py-1.5 whitespace-nowrap font-semibold">
                      {applyStoreNumberToName(r.storeName, r.storeNumber, [])}
                    </td>

                    {matrix.columns.map((c) => {
                      const cell = r.cells.get(c.subDept);
                      const idx = cell?.index ?? null;
                      const on = flagged(idx, band);
                      const tone = shade(idx, band);
                      return (
                        <td
                          key={c.subDept}
                          className="border-r border-b border-brand_line p-0 text-center w-[74px] max-w-[74px]"
                        >
                          <button
                            type="button"
                            disabled={!cell}
                            onClick={() => cell && open(matrix, cell, c.name)}
                            title={
                              cell && idx !== null
                                ? `${r.storeName} · ${c.name} · index ${idx} · measured on ${cell.basis}`
                                : `${r.storeName} · ${c.name} · nothing to measure against`
                            }
                            style={tone.background ? tone : undefined}
                            className={`w-full h-full px-2 py-1.5 font-mono text-[11px] tabular-nums transition-colors disabled:cursor-default ${
                              on ? "font-bold" : "font-medium text-content"
                            } ${tone.background ? "" : "hover:bg-gray-50"}`}
                          >
                            {idx === null ? (
                              <span className="text-content/85">—</span>
                            ) : (
                              idx
                            )}
                          </button>
                        </td>
                      );
                    })}

                    <td
                      className="sticky right-0 z-10 bg-custom-white border-l-2 border-l-brand_navy/25 border-b border-brand_line px-2.5 py-1.5 text-center tabular-nums font-bold"
                      style={{
                        boxShadow: "-6px 0 8px -6px rgb(var(--color-brand-navy) / 0.25)",
                        ...(flagged(r.index, band)
                          ? { color: (r.index ?? 100) < 100 ? "#8e1010" : "#185fa5" }
                          : {}),
                      }}
                    >
                      {r.index ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex-shrink-0 flex items-center gap-4 px-4 py-2 border-t border-brand_line bg-custom-white text-[11.5px] text-content/85">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: UNDER[3][0] }} />
              Under its usual share
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border border-brand_line_2 bg-custom-white" />
              Within ±{band}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: OVER[3][0] }} />
              Over it
            </span>
            {answered < asked && (
              <span className="font-semibold text-severity_watch_text">
                {answered} of {asked} stores answered
              </span>
            )}
            {matrix.blanks > 0 && (
              <span title="No last year or last week covering the week, so there is nothing to measure these against">
                {matrix.blanks} blank
              </span>
            )}
            <span className="ml-auto">Click a cell to open its investigation</span>
          </div>
        </>
      )}
    </div>
  );
};

export default DeptMatrixPanel;
