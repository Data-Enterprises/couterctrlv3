// Hooks
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../../../../components/toasts/hooks/useToast";

// Redux
import {
  setSubExclCatalog,
  setSubExclCompanyId,
  setSubExclExclusions,
  setSubExclStores,
} from "../../../../../features/adminPageSlice";

// API
import { getUserStores } from "../../../../../api/user";
import {
  addSubDeptExclusion,
  getSubDeptCatalog,
  getSubDeptExclusions,
  removeSubDeptExclusion,
  type SubDeptExclusionRow,
} from "../../../../../api/subDeptExclusions";

// Utils
import { companyDeptRows, ALL_STORES, CATALOG_DAYS } from "../utils";
import {
  reasonOf,
  serverDetail,
  serverStatus,
} from "../../../../../utils/serverError";

// Interfaces
import type { Store } from "../../../../../interfaces";
import type { ExclusionWrite, StoreSubDept } from "../interfaces";
import type { useAdminPageCtx } from "../../hooks";

/**
 * What Sub dept exclusions shows: the user's stores, the company and stores in
 * view, and a row per department built from the catalogue and the exclusions.
 * The lists live in Redux, so a return visit to the same scope reads nothing.
 */
export const useSubExclData = (context: ReturnType<typeof useAdminPageCtx>) => {
  const toast = useToast();
  const { dispatch } = context;
  const stores = context.subExclStores;
  const companyId = context.subExclCompanyId;
  const storeKey = context.subExclStoreKey;
  const catalog = context.subExclCatalog;
  const exclusions = context.subExclExclusions;
  const setCompanyId = (v: string) => dispatch(setSubExclCompanyId(v));
  const setExclusions = (rows: SubDeptExclusionRow[]) =>
    dispatch(setSubExclExclusions(rows));

  const [loading, setLoading] = useState<boolean>(false);
  /** Which catalogue batch is in flight, when the scope takes more than one.
   *  Null while a single batch is enough to answer. */
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  /** The stores assigned to the user, level 9 and support included: the
   *  backend refuses to read exclusions for any store the user isn't assigned,
   *  and one such store fails the whole company. `store_name` and
   *  `store_number` come back null often enough that the filters below would
   *  throw on them. */
  useEffect(() => {
    getUserStores(context.url, context.token, context.userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "Error fetching stores");
          return;
        }
        const valid = (list: Store[]) =>
          list.filter((s) => s.store_number !== null && s.store_name !== null);
        dispatch(setSubExclStores(valid(j.assigned_stores ?? [])));
      })
      .catch((err) => toast.error(reasonOf(err)));
  }, []);

  const companyOptions = useMemo(() => {
    const seen = new Map<number, string>();
    (stores ?? []).forEach((s) => {
      if (!seen.has(s.company)) seen.set(s.company, s.company_name);
    });
    return [...seen.entries()]
      .map(([id, name]) => ({ value: String(id), label: name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [stores]);

  // Lands on a company rather than on nothing: with one company — which is
  // every operator who is not DCR — an empty select is a step that only ever
  // has one answer.
  useEffect(() => {
    if (!companyId && companyOptions.length > 0) {
      setCompanyId(companyOptions[0].value);
    }
  }, [companyOptions, companyId]);

  const companyStores = useMemo(
    () =>
      (stores ?? [])
        .filter((s) => (companyId ? s.company === Number(companyId) : false))
        .sort((a, b) =>
          a.store_number.localeCompare(b.store_number, undefined, {
            numeric: true,
          }),
        ),
    [stores, companyId],
  );

  /** The stores the view is about — all of the company, or exactly one. */
  const scope = useMemo(
    () =>
      storeKey === ALL_STORES
        ? companyStores
        : companyStores.filter((s) => String(s.storeid) === storeKey),
    [companyStores, storeKey],
  );

  const scopeIds = useMemo(
    () => scope.map((s) => s.storeid).sort((a, b) => a - b),
    [scope],
  );
  const scopeSig = scopeIds.join(",");
  const loadKey = `${scopeSig}|${CATALOG_DAYS}`;

  /**
   * The catalogue and the exclusions, one call each for the whole scope.
   *
   * Both in parallel and both for every store at once: a twelve-store company
   * read a store at a time is twenty-four round trips, and the view cannot
   * draw a single row until the last of them lands.
   */
  useEffect(() => {
    if (scopeIds.length === 0) {
      dispatch(setSubExclCatalog({ rows: null, loadedFor: null }));
      setExclusions([]);
      return;
    }
    // Already read for this scope and window, on an earlier visit.
    if (context.subExclLoadedFor === loadKey) return;
    let live = true;
    setLoading(true);
    setProgress(null);
    Promise.all([
      getSubDeptCatalog(
        context.url,
        context.token,
        scopeIds,
        CATALOG_DAYS,
        (done, total) => {
          if (live && total > 1) setProgress({ done, total });
        },
      ),
      getSubDeptExclusions(context.url, context.token, scopeIds),
    ])
      .then(([catalogRows, exclResp]) => {
        if (!live) return;
        const e = exclResp.data;
        if (e.error !== 0) {
          toast.error(e.msg || "Could not read the current exclusions");
        }
        // A failed exclusions read is not cached, so the next visit tries again.
        dispatch(
          setSubExclCatalog({
            rows: catalogRows,
            loadedFor: e.error === 0 ? loadKey : null,
          }),
        );
        setExclusions(e.error === 0 ? (e.data ?? []) : []);
      })
      .catch((err) => {
        if (!live) return;
        dispatch(setSubExclCatalog({ rows: [], loadedFor: null }));
        toast.error(
          serverStatus(err) === 404
            ? "The sub department catalogue endpoint is not on this API yet"
            : reasonOf(err),
        );
      })
      .finally(() => {
        if (!live) return;
        setLoading(false);
        setProgress(null);
      });
    return () => {
      live = false;
    };
  }, [scopeSig, context.url, context.token]);

  const refetchExclusions = () =>
    getSubDeptExclusions(context.url, context.token, scopeIds)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) setExclusions(j.data ?? []);
      })
      .catch((err) => toast.error(reasonOf(err)));

  const rows = useMemo(() => {
    const subs: StoreSubDept[] = (catalog ?? []).map((r) => ({
      storeid: r.storeid,
      sub_department: r.sub_department,
      description: r.sub_department_description,
      lastRung: r.last_rung,
    }));
    return companyDeptRows(scope, subs, exclusions);
  }, [catalog, exclusions, scope]);

  return {
    companyOptions,
    companyStores,
    rows,
    loading,
    progress,
    refetchExclusions,
  };
};

/**
 * Sending exclusion writes, and the saving flag while they are out.
 *
 * `allSettled` rather than `all` because a fan-out is a dozen independent
 * writes with no transaction around them: the first failure must not hide
 * the eleven that worked, and the refetch afterwards means the screen shows
 * what the table actually holds rather than what was asked for.
 */
export const useExclusionWrites = (
  context: ReturnType<typeof useAdminPageCtx>,
  refetchExclusions: () => Promise<unknown>,
) => {
  const toast = useToast();
  const [saving, setSaving] = useState<boolean>(false);

  const send = (writes: ExclusionWrite[], label: string, want: boolean) => {
    if (writes.length === 0) return;
    setSaving(true);
    Promise.allSettled(
      writes.map((w) =>
        w.op === "add"
          ? addSubDeptExclusion(
              context.url,
              context.token,
              w.storeid,
              w.sub_department,
              w.sub_department_description,
            )
          : removeSubDeptExclusion(
              context.url,
              context.token,
              w.storeid,
              w.sub_department,
            ),
      ),
    )
      .then((results) => {
        const failures = results.filter(
          (r) =>
            r.status === "rejected" ||
            (r.status === "fulfilled" && r.value.data?.error !== 0),
        );
        const failed = failures.length;
        const done = results.length - failed;
        // The first refusal's reason, such as a store with no company.
        const first = failures[0];
        const reason = !first
          ? undefined
          : first.status === "rejected"
            ? serverDetail(first.reason)
            : first.value.data?.msg;
        const why = reason ? `: ${reason}` : "";
        if (failed === 0) {
          toast.success(
            want
              ? `${label} is out of net sales at ${done} store${done === 1 ? "" : "s"}`
              : `${label} counts again at ${done} store${done === 1 ? "" : "s"}`,
          );
        } else if (done === 0) {
          toast.error(`${label} could not be changed${why}`);
        } else {
          toast.error(
            `${label} changed at ${done} store${done === 1 ? "" : "s"}, failed at ${failed}${why}`,
          );
        }
        return refetchExclusions();
      })
      .finally(() => setSaving(false));
  };

  return { saving, send };
};
