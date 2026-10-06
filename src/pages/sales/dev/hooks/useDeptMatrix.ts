import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "../../../../hooks";
import { getSubs } from "../../../../api/sales";
import { buildMatrix, type Matrix } from "../shared/deptMatrix";
import type { SubSale, SubSalesJsonResp } from "../../../../interfaces";
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";

/**
 * Every store against every department, fetched.
 *
 * Three calls — this week, last week, last year — and each one returns the
 * WHOLE group in a single response, because `subs/sub_sales` takes the group
 * as its search value. That is the reason this screen is affordable at all:
 * the per-store alternative is three calls a store.
 *
 * Department totals only. Item rows for every store in every department would
 * be hundreds of calls, which is why the matrix narrows to a store and a
 * department and the investigation does the rest.
 */

export interface Args {
  useGroups: number;
  searchValue: number;
  singleStore: number;
  tw: { start: string; end: string };
  lw: { start: string; end: string };
  ly: { start: string; end: string };
  metric: GradingMetric;
  enabled: boolean;
}

export interface MatrixState {
  matrix: Matrix | null;
  loading: boolean;
  problem: string | null;
}

export const useDeptMatrix = (args: Args): MatrixState => {
  const { url, token } = useAppSelector((state) => ({
    url: state.app.url,
    token: state.app.token,
  }));

  const [rows, setRows] = useState<{ tw: SubSale[]; lw: SubSale[]; ly: SubSale[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // Primitives, not the window objects: the caller rebuilds those every
  // render, and an effect watching them would refetch the group on every
  // keystroke anywhere on the page.
  const { useGroups, searchValue, singleStore, metric, enabled } = args;
  const { start: twStart, end: twEnd } = args.tw;
  const { start: lwStart, end: lwEnd } = args.lw;
  const { start: lyStart, end: lyEnd } = args.ly;

  useEffect(() => {
    if (!enabled || !searchValue) return;

    let live = true;
    setLoading(true);
    setProblem(null);

    const ask = (start: string, end: string) =>
      getSubs(url, token, start, end, useGroups, searchValue, singleStore);

    // Only this week is allowed to fail the screen. A missing comparison
    // period costs cells their basis, which the grid already draws as blank
    // and counts in its footer — a thinner answer, not a wrong one.
    const safe = (start: string, end: string) =>
      ask(start, end).then(
        (r) => ((r.data as SubSalesJsonResp).error === 0 ? (r.data.subs ?? []) : []),
        () => [] as SubSale[],
      );

    Promise.all([
      ask(twStart, twEnd),
      safe(lwStart, lwEnd),
      safe(lyStart, lyEnd),
    ])
      .then(([twResp, lwRows, lyRows]) => {
        if (!live) return;
        const j = twResp.data as SubSalesJsonResp;
        if (j.error !== 0) {
          setProblem("The departments could not be loaded for this search.");
          setRows(null);
          return;
        }
        setRows({ tw: j.subs ?? [], lw: lwRows, ly: lyRows });
      })
      .catch(() => {
        if (live) {
          setProblem("The departments could not be loaded for this search.");
          setRows(null);
        }
      })
      .finally(() => live && setLoading(false));

    return () => {
      live = false;
    };
  }, [
    url, token, useGroups, searchValue, singleStore, enabled,
    twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd,
  ]);

  // Switching metric re-reads the same rows rather than re-fetching them:
  // sales and units are both already in every row.
  const matrix = useMemo(
    () => (rows ? buildMatrix({ ...rows, metric }) : null),
    [rows, metric],
  );

  return { matrix, loading, problem };
};
