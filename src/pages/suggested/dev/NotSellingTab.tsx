import { useMemo, useState } from "react";
import { useSuggestedCtx } from "./hooks";
import {
  setNotSellingStatus,
  setNsDescFilter,
  setNsUpcFilter,
} from "../../../features/dev/devSuggestedSlice";
import { fmtLb, lostLb } from ".";
import ColFilter from "../../../components-dev/filters/ColFilter";
import { colInputStyle } from "../../../components-dev/filters/colFilterStyles";
import SortHeader from "../../../components-dev/SortHeader";
import { useTriStateSort } from "../../../utils/useTriStateSort";
import UpcContextMenu from "../../../components-dev/UpcContextMenu";
import type { NotSellingItem, NotSellingStatus } from "../../../interfaces";
import type { NotSellingFilter } from "../../../features/dev/devSuggestedSlice";

const TH =
  "px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85";
const SORT_TH =
  "w-full justify-end text-[10px] font-semibold uppercase tracking-wide text-content/85 hover:text-content";

type SortCol = "prior" | "recent" | "change" | "lost";

/** Severity, in the order a reader should care: a line that stopped outright is
 *  worse news than one that slowed, and a dead line is a cleanup job. */
const STATUS_PILL: Record<NotSellingStatus, string> = {
  stopped: "bg-severity_critical_bg text-severity_critical_text",
  declining: "bg-severity_watch_bg text-severity_watch_text",
  dead: "bg-gray-200 text-content/85",
};

/**
 * Opens on `declining`, and that ordering is the argument for the whole tab.
 *
 * Dead and stopped are visible to anyone paying attention — a case with nothing
 * in it, a line that has not scanned in a month. An item still moving at half
 * its old rate looks fine on a shelf and is being PRODUCED to the old level,
 * rotting the difference every day, and nothing else on this page surfaces it.
 */
const STATUSES: { key: NotSellingFilter; label: string; blurb: string }[] = [
  {
    key: "all",
    label: "All",
    blurb:
      "Everything that has stopped or slowed in this department, worst first. The Status column says which is which.",
  },
  {
    key: "declining",
    label: "Declining",
    blurb:
      "Still selling, but well down on its own earlier rate — production has not followed it down.",
  },
  {
    key: "stopped",
    label: "Stopped",
    blurb: "Sold in the earlier half of the lookback, nothing in the recent half.",
  },
  {
    key: "dead",
    label: "Dead",
    blurb: "Carried, but no recorded weight in either half of the window.",
  },
];

const NotSellingTab = ({
  subDepartment,
}: {
  subDepartment: number | null;
}) => {
  const ctx = useSuggestedCtx();
  const { sort, handleSort, applySort } = useTriStateSort<SortCol>();
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; upc: string } | null>(
    null,
  );
  const [draftDesc, setDraftDesc] = useState("");
  const [draftUpc, setDraftUpc] = useState("");

  const ns = ctx.notSelling;
  const recentDays = ns?.window.recent.days ?? 0;

  /** `counts` on the payload is store-wide across every department, so the chip
   *  numbers have to be counted here or they would claim another department's
   *  items belong to this one. */
  const forDept = useMemo(
    () =>
      (ns?.items ?? []).filter((r) => r.sub_department === subDepartment),
    [ns, subDepartment],
  );

  /** Column filters run before the status split, so the chip counts describe
   *  the rows a click would actually show rather than the unfiltered set. */
  const matching = useMemo(() => {
    const desc = ctx.nsDescFilter.trim().toLowerCase();
    const upc = ctx.nsUpcFilter.trim().toLowerCase();
    return forDept.filter((r) => {
      if (desc && !(r.product_description ?? "").toLowerCase().includes(desc))
        return false;
      if (upc && !String(r.product_code).toLowerCase().includes(upc)) return false;
      return true;
    });
  }, [forDept, ctx.nsDescFilter, ctx.nsUpcFilter]);

  const counts = useMemo(() => {
    const c: Record<NotSellingFilter, number> = {
      all: matching.length,
      dead: 0,
      stopped: 0,
      declining: 0,
    };
    for (const r of matching) c[r.status] += 1;
    return c;
  }, [matching]);

  const rows = applySort<NotSellingItem>(
    matching.filter(
      (r) => ctx.notSellingStatus === "all" || r.status === ctx.notSellingStatus,
    ),
    (r, col) =>
      col === "prior"
        ? r.prior_lb_per_day
        : col === "recent"
          ? r.recent_lb_per_day
          : col === "change"
            ? (r.change_ratio ?? null)
            : lostLb(r, recentDays),
  );

  /** Rates sum because they are all per-day over the same window; the change is
   *  recomputed from the two totals rather than averaged from the rows, which
   *  would weight a 0.06 lb/day line the same as a 3.6 lb/day one. */
  const totals = useMemo(() => {
    const prior = rows.reduce((s, r) => s + (r.prior_lb_per_day ?? 0), 0);
    const recent = rows.reduce((s, r) => s + (r.recent_lb_per_day ?? 0), 0);
    return {
      prior,
      recent,
      change: prior > 0 ? recent / prior - 1 : null,
      lost: rows.reduce((s, r) => s + lostLb(r, recentDays), 0),
    };
  }, [rows, recentDays]);
  const active = STATUSES.find((s) => s.key === ctx.notSellingStatus)!;

  if (!ns) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-1">
        <p className="text-[13px] font-medium text-content">
          No not-selling data
        </p>
        <p className="text-[11px] text-content/85">
          The response came back without it
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-shrink-0 px-3 pt-2 pb-2.5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUSES.map((s) => {
            const on = ctx.notSellingStatus === s.key;
            return (
              <button
                key={s.key}
                title={s.blurb}
                onClick={() => ctx.dispatch(setNotSellingStatus(s.key))}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                  on
                    ? "bg-[#1e2a4a] text-custom-white border-[#1e2a4a]"
                    : "bg-custom-white text-content/85 border-gray-200 hover:border-gray-300"
                }`}
              >
                {s.label} · {counts[s.key].toLocaleString()}
              </button>
            );
          })}
          <span className="ml-auto text-[10px] text-content/85 tabular-nums">
            recent {ns.window.recent.days}d vs prior {ns.window.prior.days}d ·
            down past {(ns.decline_threshold * 100).toFixed(0)}%
          </span>
        </div>
        <p className="text-[10.5px] text-content/85 mt-1.5 leading-snug">
          {active.blurb}
        </p>
      </div>

      <div className="flex-1 overflow-auto thin-scrollbar">
        {rows.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-[11px] text-content/85">
            Nothing {active.label.toLowerCase()} in this department
          </div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="sticky top-0 bg-gray-100 border-b border-gray-100 z-10">
                <th className={`${TH} text-left`} style={{ overflow: "visible" }}>
                  <ColFilter
                    label="Item"
                    active={!!ctx.nsDescFilter}
                    onApply={() => ctx.dispatch(setNsDescFilter(draftDesc))}
                    onClear={() => {
                      ctx.dispatch(setNsDescFilter(""));
                      setDraftDesc("");
                    }}
                  >
                    <input
                      autoFocus
                      style={colInputStyle}
                      placeholder="Search description…"
                      value={draftDesc}
                      onChange={(e) => setDraftDesc(e.target.value)}
                    />
                  </ColFilter>
                </th>
                <th
                  className={`${TH} text-left w-32`}
                  style={{ overflow: "visible" }}
                >
                  <ColFilter
                    label="UPC"
                    active={!!ctx.nsUpcFilter}
                    onApply={() => ctx.dispatch(setNsUpcFilter(draftUpc))}
                    onClear={() => {
                      ctx.dispatch(setNsUpcFilter(""));
                      setDraftUpc("");
                    }}
                  >
                    <input
                      autoFocus
                      style={colInputStyle}
                      placeholder="Search UPC…"
                      value={draftUpc}
                      onChange={(e) => setDraftUpc(e.target.value)}
                    />
                  </ColFilter>
                </th>
                <th className={`${TH} text-left w-24`}>Status</th>
                <th className={`${TH} text-right whitespace-nowrap`}>
                  <SortHeader col="prior" label="Prior lb/day" sort={sort} onSort={handleSort} className={SORT_TH} />
                </th>
                <th className={`${TH} text-right whitespace-nowrap`}>
                  <SortHeader col="recent" label="Recent lb/day" sort={sort} onSort={handleSort} className={SORT_TH} />
                </th>
                <th className={`${TH} text-right whitespace-nowrap`}>
                  <SortHeader col="change" label="Change" sort={sort} onSort={handleSort} className={SORT_TH} />
                </th>
                <th
                  className={`${TH} text-right whitespace-nowrap`}
                  title="Pounds this item used to sell over the recent window and now does not. Ours, not the endpoint's — it is what ranks the list by cost rather than by status."
                >
                  <SortHeader col="lost" label="Lost lb" sort={sort} onSort={handleSort} className={SORT_TH} />
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.product_code}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setCtxMenu({ x: e.clientX, y: e.clientY, upc: String(r.product_code) });
                  }}
                  className="border-b border-[#1e2a4a]/15 even:bg-row_stripe hover:bg-gray-50 transition-colors"
                >
                  <td className="px-3 py-2 text-content font-medium">
                    {r.product_description ?? String(r.product_code)}
                  </td>
                  <td className="px-3 py-2 text-content/85 tabular-nums">
                    {r.product_code}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold capitalize ${STATUS_PILL[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-content">
                    {fmtLb(r.prior_lb_per_day)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-content">
                    {fmtLb(r.recent_lb_per_day)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.change_ratio === null ? (
                      <span className="text-content/85">—</span>
                    ) : (
                      <span className="text-severity_critical_text font-semibold">
                        {(r.change_ratio * 100).toFixed(0)}%
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-content font-semibold">
                    {fmtLb(lostLb(r, recentDays))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="sticky bottom-0 bg-gray-50 border-t-2 border-content/70 font-bold text-[14px]">
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2 text-right text-content/85" colSpan={2}>
                  Totals · {rows.length.toLocaleString()} items
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-content/85">
                  {fmtLb(totals.prior)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-content/85">
                  {fmtLb(totals.recent)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {totals.change === null ? (
                    <span className="text-content/85">—</span>
                  ) : (
                    <span className="text-severity_critical_text">
                      {(totals.change * 100).toFixed(0)}%
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-content/85">
                  {fmtLb(totals.lost)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {ctxMenu && (
        <UpcContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          upc={ctxMenu.upc}
          allUpcs={rows.map((r) => String(r.product_code))}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  );
};

export default NotSellingTab;
