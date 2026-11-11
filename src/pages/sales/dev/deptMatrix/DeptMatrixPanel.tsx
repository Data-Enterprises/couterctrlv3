// Hooks
import { useMemo } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useSalesCtx } from "../hooks";
import { useDeptMatrix } from "./hooks";

// Redux
import {
  setGroupView,
  setInvestigation,
  setMatrixOpen,
} from "../../../../features/dev/devSalesLedgerSlice";

// Utils
import { applyStoreNumberToName } from "../utils/ledgerUtils";
import { bestIn, flagged, type Cell, type Matrix } from "./utils/deptMatrix";
import { DEPT_BAND, OVER, shade, UNDER } from "./utils";

// Interfaces
import type { MatrixStore } from "./interfaces";

// Components
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";

interface DeptMatrixPanelProps {
  stores: MatrixStore[];
  threshold: number;
  expanded: boolean;
  twStart: string;
  twEnd: string;
  lwStart: string;
  lwEnd: string;
  lyStart: string;
  lyEnd: string;
}

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
const DeptMatrixPanel = ({
  stores,
  threshold,
  expanded,
  twStart,
  twEnd,
  lwStart,
  lwEnd,
  lyStart,
  lyEnd,
}: DeptMatrixPanelProps) => {
  const dispatch = useAppDispatch();
  const { gradingMetric } = useSalesCtx();

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
        // The matrix's columns ARE department numbers, so the counterpart it
        // picked is that same number at the other store. Which is the matrix's
        // own bug, not this call site's: see deptMatrix's `key`.
        compareSubDept: cell.subDept,
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
    <div className="h-full cc-panel shadow-sm">
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
            className="text-custom-white/95 text-[12px] font-semibold px-2.5 py-1 rounded hover:bg-custom-white/10 hover:text-custom-white transition-colors"
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
            <span className="text-custom-white/95 text-[12px]">
              <span className="cc-navy-title">{flaggedCount}</span>{" "}
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
        <div className="flex-1 flex items-center justify-center px-6 text-center text-[13px] text-content/95">
          {problem}
        </div>
      ) : !matrix || matrix.columns.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6 text-center text-[13px] text-content/95">
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
            <div className="text-[12.5px] text-content/95 mt-1.5 leading-relaxed">
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
                    <span className="cc-caps">
                      Store
                    </span>
                  </th>
                  {matrix.columns.map((c) => (
                    <th
                      key={c.subDept}
                      className="sticky top-0 z-10 bg-custom-white border-b border-brand_line_2 border-r border-brand_line px-2 py-1.5 text-center cc-caps w-[74px] max-w-[74px]"
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
                    className="sticky top-0 right-0 z-30 bg-bkg border-b border-brand_line_2 border-l-2 border-l-brand_navy/25 px-2.5 py-1.5 text-center cc-caps min-w-[76px]"
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
                            } ${tone.background ? "" : "hover:bg-fill_soft"}`}
                          >
                            {idx === null ? (
                              <span className="text-content/95">—</span>
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

          <div className="flex-shrink-0 flex items-center gap-4 px-4 py-2 border-t border-brand_line bg-custom-white text-[11.5px] text-content/95">
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
