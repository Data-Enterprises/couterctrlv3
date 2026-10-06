import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "../../../../hooks";
import { getSubs } from "../../../../api/sales";
import { fetchAllPages } from "../../../../utils/paging";
import { scopeToStoreNumber } from "../../../../utils/storeIdentity";
import { buildMatrix, type Matrix } from "../shared/deptMatrix";
import type { SubSale, SubSalesJsonResp } from "../../../../interfaces";
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";

/**
 * Every store against every department, fetched.
 *
 * ONE CALL PER STORE PER PERIOD, which looks wasteful and is not optional:
 * `subs/sub_sales` asked for a GROUP answers with the group consolidated. Its
 * rows carry `sub_department` and `sale_date` but no `storeid` and no
 * `store_number`, so there is no way to tell whose sales they are — a whole
 * group arrives looking like one store. Every other caller in the app asks it
 * for a single store, which is why nobody had hit this. `consolidated` does
 * not help either: that flag decides whether `sale_date` survives, not
 * whether stores do.
 *
 * So the fan-out is the only shape on offer. It is the same one the ledger
 * already falls back to for groups over thirty stores, and the calls go out
 * together rather than in sequence.
 *
 * Department totals only. Item rows for every store in every department would
 * be thousands of rows a store, which is why the matrix narrows to a store
 * and a department and the investigation does the rest.
 */

export interface MatrixStore {
  storeid: number;
  /** Co-located stores share a `storeid`, so a response has to be narrowed by
   *  NUMBER as well or two locations come back as one row. */
  storeNumber: string;
  storeName: string;
}

export interface Args {
  stores: MatrixStore[];
  tw: { start: string; end: string };
  lw: { start: string; end: string };
  ly: { start: string; end: string };
  metric: GradingMetric;
  enabled: boolean;
}

export interface MatrixState {
  matrix: Matrix | null;
  loading: boolean;
  /** How many of the stores asked for actually answered, so the screen can
   *  say "7 of 9" rather than quietly drawing a smaller group. */
  answered: number;
  asked: number;
  problem: string | null;
}

type Rows = { tw: SubSale[]; lw: SubSale[]; ly: SubSale[] };

export const useDeptMatrix = (args: Args): MatrixState => {
  const { url, token } = useAppSelector((state) => ({
    url: state.app.url,
    token: state.app.token,
  }));

  const [rows, setRows] = useState<Rows | null>(null);
  const [loading, setLoading] = useState(false);
  const [answered, setAnswered] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);

  const { stores, metric, enabled } = args;
  const { start: twStart, end: twEnd } = args.tw;
  const { start: lwStart, end: lwEnd } = args.lw;
  const { start: lyStart, end: lyEnd } = args.ly;

  // The caller rebuilds the store array every render, so the effect watches a
  // stable key rather than the array itself.
  const storeKey = useMemo(
    () => stores.map((s) => `${s.storeid}__${s.storeNumber}`).join("|"),
    [stores],
  );

  useEffect(() => {
    if (!enabled || stores.length === 0) return;

    let live = true;
    setLoading(true);
    setProblem(null);
    setAnswered(0);

    /** One store, one window, every page. */
    const walk = async (s: MatrixStore, start: string, end: string) => {
      const ask = (page: number) =>
        getSubs(url, token, start, end, 0, s.storeid, 1, 0, 0, page);

      const j = (await ask(1)).data as SubSalesJsonResp;
      if (j.error !== 0) throw new Error(j.msg ?? "sub_sales failed");

      const all = await fetchAllPages(j, [...(j.subs ?? [])], async (page) => {
        const b = (await ask(page)).data as SubSalesJsonResp;
        if (b.error !== 0) throw new Error(b.msg ?? `page ${page} failed`);
        return b.subs ?? [];
      });

      // A response is scoped to a storeid, which for co-located stores means
      // two locations. Narrow, then stamp the identity back on: every row
      // from here on is pooled with other stores', so each has to carry whose
      // it is.
      return scopeToStoreNumber(all, s.storeNumber).map((r) => ({
        ...r,
        storeid: s.storeid,
        store_number: s.storeNumber,
        store_name: s.storeName,
      }));
    };

    Promise.allSettled(
      stores.map((s) =>
        Promise.all([
          walk(s, twStart, twEnd),
          // A comparison period that fails costs that store's cells their
          // basis, which the grid draws blank and counts. This week failing
          // loses the store altogether, which the footer says.
          walk(s, lwStart, lwEnd).catch(() => [] as SubSale[]),
          walk(s, lyStart, lyEnd).catch(() => [] as SubSale[]),
        ]),
      ),
    )
      .then((results) => {
        if (!live) return;
        const got: Rows = { tw: [], lw: [], ly: [] };
        let ok = 0;
        results.forEach((r) => {
          if (r.status !== "fulfilled") return;
          ok++;
          got.tw.push(...r.value[0]);
          got.lw.push(...r.value[1]);
          got.ly.push(...r.value[2]);
        });
        setAnswered(ok);
        if (ok === 0) {
          setProblem("No store answered for this window.");
          setRows(null);
          return;
        }
        setRows(got);
      })
      .finally(() => live && setLoading(false));

    return () => {
      live = false;
    };
    // `stores` is watched through storeKey: the array identity changes every
    // render and would refetch the whole group each time.
  }, [url, token, storeKey, enabled, twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd]);

  // Switching metric re-reads the rows rather than re-fetching them: sales
  // and units are both already in every row.
  const matrix = useMemo(
    () => (rows ? buildMatrix({ ...rows, metric }) : null),
    [rows, metric],
  );

  return { matrix, loading, answered, asked: stores.length, problem };
};
