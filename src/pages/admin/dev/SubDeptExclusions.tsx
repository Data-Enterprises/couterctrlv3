import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { useAdminPageCtx } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getUserStores } from "../../../api/user";
import {
  addSubDeptExclusion,
  getSubDeptCatalog,
  getSubDeptExclusions,
  removeSubDeptExclusion,
  type SubDeptCatalogRow,
  type SubDeptExclusionRow,
} from "../../../api/subDeptExclusions";
import type { JsonError, Store } from "../../../interfaces";
import TextFilter from "../../../components-dev/filters/TextFilter";
import SelectFilter from "../../../components-dev/filters/SelectFilter";
import Checkbox from "../../../components-dev/Checkbox";
import ConfirmModal from "../../../components-dev/ConfirmModal";
import {
  companyDeptRows,
  coverageText,
  deptState,
  differingNumbers,
  planStoreToggle,
  planToggle,
  type CompanyDeptRow,
  type ExclusionWrite,
  type StoreSubDept,
} from "./shared/subDeptExclusions";

/**
 * Which sub departments a store does not want counted in its net sales.
 *
 * The hash departments — lottery, money orders, stamps — are money the store
 * handed straight back out, and an operator seeing them inside net sales is
 * reading a number that flatters them by thousands. The backend has read
 * `sub_department_exclusions` since the table landed; what did not exist was
 * any way to write it outside pgAdmin and the Swagger docs, which is not
 * something to do in front of a customer during onboarding.
 *
 * **One store or a whole company**, chosen with the Store select: an operator
 * ringing up their first store is a different job from onboarding a twelve-
 * store chain, and the second one twelve times is how an exclusion gets
 * missed.
 *
 * The thing that makes the company view possible is that the exclusions table
 * is keyed per store, by **the store's own number** — 14 is Lottery at one
 * store and TOBACCO at another. So a chain-wide tick is a fan-out of twelve
 * different numbers, joined up here on the normalised description, which is
 * the only thing the stores agree on. None of that joining is ever written:
 * see `shared/subDeptExclusions`.
 */

const COLS =
  "grid-cols-[30px_minmax(0,24%)_72px_minmax(0,1fr)_92px_28px]";

/** How far back to look for "which departments does this store have".
 *
 *  There is no dimension table, so the answer is always "what it rang inside
 *  a window". 120 days is the default because it is quick and because a
 *  department that has not rung since spring is not one anybody is trying to
 *  keep out of this week's net sales. The longer options exist for onboarding,
 *  where a seasonal department genuinely has not rung yet. */
const WINDOWS = [
  { value: "120", label: "Last 120 days" },
  { value: "365", label: "Last year" },
  { value: "730", label: "Last 2 years" },
];

const ALL_STORES = "__all__";

/** A select with its question above it. `SelectFilter` carries no label, and
 *  three unlabelled dropdowns in a row is a guessing game. */
const Field = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-1 flex-shrink-0">
    <span className="text-[9px] font-bold uppercase tracking-wide text-content/85">
      {label}
    </span>
    {children}
  </div>
);

const prettyDate = (iso: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${Number(m)}/${Number(d)}/${y.slice(2)}`;
};

const SubDeptExclusions = () => {
  const toast = useToast();
  const context = useAdminPageCtx();

  const [stores, setStores] = useState<Store[] | null>(null);
  const [companyId, setCompanyId] = useState("");
  const [storeKey, setStoreKey] = useState(ALL_STORES);
  const [days, setDays] = useState("120");
  const [search, setSearch] = useState("");
  const [hashOnly, setHashOnly] = useState(false);

  const [catalog, setCatalog] = useState<SubDeptCatalogRow[] | null>(null);
  const [exclusions, setExclusions] = useState<SubDeptExclusionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    writes: ExclusionWrite[];
    label: string;
    want: boolean;
  } | null>(null);

  /** Same source and same scoping as the Stores tab — `store_name` and
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
        setStores([
          ...valid(j.assigned_stores ?? []),
          ...(context.canSeeAllStores ? valid(j.unassigned_stores ?? []) : []),
        ]);
      })
      .catch((err: JsonError) => toast.error(err.message));
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

  // A store number from the last company is not a store number in this one.
  useEffect(() => setStoreKey(ALL_STORES), [companyId]);

  const scopeIds = useMemo(
    () => scope.map((s) => s.storeid).sort((a, b) => a - b),
    [scope],
  );
  const scopeSig = scopeIds.join(",");

  /**
   * The catalogue and the exclusions, one call each for the whole scope.
   *
   * Both in parallel and both for every store at once: a twelve-store company
   * read a store at a time is twenty-four round trips, and the view cannot
   * draw a single row until the last of them lands.
   */
  useEffect(() => {
    if (scopeIds.length === 0) {
      setCatalog(null);
      setExclusions([]);
      return;
    }
    let live = true;
    setLoading(true);
    Promise.all([
      getSubDeptCatalog(context.url, context.token, scopeIds, Number(days)),
      getSubDeptExclusions(context.url, context.token, scopeIds),
    ])
      .then(([catResp, exclResp]) => {
        if (!live) return;
        const c = catResp.data;
        const e = exclResp.data;
        if (c.error !== 0) {
          toast.error(c.msg || "Could not read the sub departments");
          setCatalog([]);
          return;
        }
        if (e.error !== 0) {
          toast.error(e.msg || "Could not read the current exclusions");
        }
        setCatalog(c.data ?? []);
        setExclusions(e.error === 0 ? (e.data ?? []) : []);
      })
      .catch((err: JsonError & { response?: { status?: number } }) => {
        if (!live) return;
        setCatalog([]);
        toast.error(
          err.response?.status === 404
            ? "The sub department catalogue endpoint is not on this API yet"
            : err.message,
        );
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [scopeSig, days, context.url, context.token]);

  const refetchExclusions = () =>
    getSubDeptExclusions(context.url, context.token, scopeIds)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) setExclusions(j.data ?? []);
      })
      .catch((err: JsonError) => toast.error(err.message));

  const rows = useMemo(() => {
    const subs: StoreSubDept[] = (catalog ?? []).map((r) => ({
      storeid: r.storeid,
      sub_department: r.sub_department,
      description: r.sub_department_description,
      lastRung: r.last_rung,
    }));
    return companyDeptRows(scope, subs, exclusions);
  }, [catalog, exclusions, scope]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!hashOnly || r.hashHint) && (!q || r.key.includes(q) || String(r.at[0]?.sub_department).includes(q)),
    );
  }, [rows, search, hashOnly]);

  const excludedCount = rows.filter((r) => deptState(r) !== "none").length;
  const suggestedLeft = rows.filter(
    (r) => r.hashHint && deptState(r) !== "all",
  ).length;

  /**
   * Send a plan.
   *
   * `allSettled` rather than `all` because a fan-out is a dozen independent
   * writes with no transaction around them: the first failure must not hide
   * the eleven that worked, and the refetch afterwards means the screen shows
   * what the table actually holds rather than what was asked for.
   */
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
        const failed = results.filter(
          (r) =>
            r.status === "rejected" ||
            (r.status === "fulfilled" && r.value.data?.error !== 0),
        ).length;
        const done = results.length - failed;
        if (failed === 0) {
          toast.success(
            want
              ? `${label} is out of net sales at ${done} store${done === 1 ? "" : "s"}`
              : `${label} counts again at ${done} store${done === 1 ? "" : "s"}`,
          );
        } else if (done === 0) {
          toast.error(`${label} could not be changed`);
        } else {
          toast.error(
            `${label} changed at ${done} store${done === 1 ? "" : "s"}, failed at ${failed}`,
          );
        }
        return refetchExclusions();
      })
      .finally(() => setSaving(false));
  };

  /** A whole row. More than one store gets a confirmation first — a tick that
   *  silently writes twelve stores is the kind of thing somebody does once by
   *  accident and then does not trust the page again. */
  const toggleRow = (row: CompanyDeptRow, want: boolean) => {
    const writes = planToggle(row, want);
    if (writes.length === 0) return;
    if (writes.length > 1) {
      setPending({ writes, label: row.label, want });
      return;
    }
    send(writes, row.label, want);
  };

  const noStores = stores !== null && companyStores.length === 0;

  return (
    <div className="flex-1 min-h-0 flex flex-col p-3">
      <div className="flex items-end gap-2 mb-2 flex-shrink-0">
        {companyOptions.length > 1 && (
          <Field label="Company">
            <SelectFilter
              plain
              value={companyId}
              onChange={setCompanyId}
              options={companyOptions}
              searchable={companyOptions.length > 8}
            />
          </Field>
        )}
        <Field label="Store">
          <SelectFilter
            plain
            value={storeKey}
            onChange={setStoreKey}
            options={[
              {
                value: ALL_STORES,
                label: `All ${companyStores.length} stores`,
              },
              ...companyStores.map((s) => ({
                value: String(s.storeid),
                label: s.store_name,
              })),
            ]}
            searchable={companyStores.length > 8}
          />
        </Field>
        <Field label="Rang within">
          <SelectFilter
            plain
            value={days}
            onChange={setDays}
            options={WINDOWS}
          />
        </Field>
        <TextFilter
          value={search}
          onChange={setSearch}
          placeholder="Search departments…"
          className="flex-1"
        />
        <button
          onClick={() => setHashOnly((v) => !v)}
          title="Lottery, money orders, stamps and the like"
          className={`text-[11.5px] font-medium px-3 py-1.5 rounded-md flex-shrink-0 border transition-colors ${
            hashOnly
              ? "bg-brand_navy border-brand_navy text-custom-white"
              : "bg-custom-white border-gray-200 text-content hover:bg-gray-50"
          }`}
        >
          Likely hash{suggestedLeft > 0 ? ` (${suggestedLeft})` : ""}
        </button>
      </div>

      <p className="text-[11.5px] text-content/85 mb-2 leading-snug flex-shrink-0">
        An excluded department still appears in every sub-department list — it
        just stops counting towards net sales on the Performance pages.
        {rows.length > 0 && (
          <span className="font-semibold text-content">
            {" "}
            {rows.length} department{rows.length === 1 ? "" : "s"} ·{" "}
            {excludedCount} excluded
          </span>
        )}
      </p>

      <div className="border border-gray-100 rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
        <div
          className={`grid ${COLS} px-3 py-2 bg-gray-50 text-[9px] font-bold uppercase tracking-wide text-content flex-shrink-0`}
        >
          <div />
          <div>Department</div>
          <div>Number</div>
          <div>Where it stands</div>
          <div>Last rang</div>
          <div />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar divide-y divide-brand_navy/15">
          {filtered.map((row) => {
            const state = deptState(row);
            const varies = differingNumbers(row);
            const expanded = open === row.key;
            return (
              <div key={row.key}>
                <div
                  className={`grid ${COLS} px-3 py-2 text-[12px] items-center text-content even:bg-row_stripe hover:bg-gray-50`}
                >
                  <Checkbox
                    checked={state === "all"}
                    disabled={saving}
                    ariaLabel={`Exclude ${row.label} from net sales`}
                    onChange={(next) => toggleRow(row, next)}
                  />
                  <div className="truncate font-semibold" title={row.label}>
                    {row.label}
                    {row.hashHint && state === "none" && (
                      <span className="ml-1.5 text-[10px] font-semibold text-severity_watch_text">
                        likely hash
                      </span>
                    )}
                  </div>
                  <div className="truncate tabular-nums text-content/85">
                    {varies.length > 0 ? (
                      <span title={varies.join(" · ")}>varies</span>
                    ) : (
                      `#${row.at[0]?.sub_department}`
                    )}
                  </div>
                  <div className="truncate">
                    <span
                      className={
                        state === "some"
                          ? "font-semibold text-severity_watch_text"
                          : "text-content/85"
                      }
                    >
                      {coverageText(row)}
                    </span>
                  </div>
                  <div className="truncate tabular-nums text-content/85">
                    {prettyDate(row.lastRung)}
                  </div>
                  {/* Only worth opening when there is more than one store
                      behind the row — in single-store scope the row already
                      says everything the expansion would. */}
                  <div className="flex justify-end">
                    {row.at.length + row.absent.length > 1 && (
                      <button
                        onClick={() => setOpen(expanded ? null : row.key)}
                        aria-label={`${expanded ? "Hide" : "Show"} stores for ${row.label}`}
                        className="w-5 h-5 flex items-center justify-center rounded text-content/85 hover:bg-gray-100"
                      >
                        <ChevronRightIcon
                          className={`w-4 h-4 transition-transform ${
                            expanded ? "rotate-90" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {expanded && (
                  <div className="bg-bkg px-3 py-2 animate-nb-drop motion-reduce:animate-none">
                    {row.at.map((a) => (
                      <div
                        key={`${a.storeid}__${a.sub_department}`}
                        className="flex items-center gap-2 py-1 text-[11.5px] text-content"
                      >
                        <Checkbox
                          checked={a.excluded}
                          disabled={saving}
                          ariaLabel={`Exclude ${row.label} at ${a.store_name}`}
                          onChange={(next) =>
                            send(
                              planStoreToggle(row, a.storeid, next),
                              `${row.label} at ${a.store_number}`,
                              next,
                            )
                          }
                        />
                        <span className="tabular-nums font-semibold w-[46px]">
                          {a.store_number}
                        </span>
                        <span className="truncate flex-1">{a.store_name}</span>
                        <span className="tabular-nums text-content/85 w-[52px]">
                          #{a.sub_department}
                        </span>
                        <span className="tabular-nums text-content/85 w-[64px] text-right">
                          {prettyDate(a.lastRung)}
                        </span>
                      </div>
                    ))}
                    {row.absent.length > 0 && (
                      <p className="text-[11px] text-content/85 pt-1.5 leading-snug">
                        Not rung in this window at{" "}
                        <span className="font-semibold text-content">
                          {row.absent.map((s) => s.store_number).join(", ")}
                        </span>
                        . Nothing to exclude there — widen the window if the
                        department is seasonal.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              Reading sub departments…
            </div>
          )}
          {!loading && noStores && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              No stores on this company
            </div>
          )}
          {!loading && !noStores && catalog !== null && filtered.length === 0 && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content text-center px-6">
              {rows.length === 0
                ? "No sub departments rang in this window. Try a longer one."
                : "No departments match that search"}
            </div>
          )}
        </div>
      </div>

      {pending && (
        <ConfirmModal
          title={pending.want ? "Exclude at every store?" : "Count it again?"}
          message={
            pending.want
              ? `${pending.label} will stop counting towards net sales at ${pending.writes.length} stores. Each store is written with its own sub-department number.`
              : `${pending.label} will count towards net sales again at ${pending.writes.length} stores.`
          }
          confirmLabel={
            pending.want
              ? `Yes, exclude at ${pending.writes.length}`
              : `Yes, count at ${pending.writes.length}`
          }
          onConfirm={() => {
            send(pending.writes, pending.label, pending.want);
            setPending(null);
          }}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
};

export default SubDeptExclusions;
