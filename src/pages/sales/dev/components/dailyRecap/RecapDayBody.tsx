import { useMemo } from "react";
import RecapItemTable from "./RecapItemTable";
import RecapSubDeptRow from "./RecapSubDeptRow";
import { itemsBySubDept, matchesSearch } from "./recapItems";
import { count, money, pounds } from "./recapFormat";
import { HEAD, NOTE, NUM, TOTAL_ROW, subCols } from "./recapGrid";
import type {
  DayItemsState,
  RecapItem,
  RecapLeftOut,
  RecapSubDept,
} from "./recapTypes";

/**
 * What is inside a day: its sub depts, each opening to its items.
 *
 * The sub dept figures come from what the popup already holds, so they show
 * at once; only the item counts and the item lists wait on the day's read.
 *
 * With a search running, only the sub depts that sold a match are listed, open,
 * holding only the matches. The sub dept's own figures stay whole: the search
 * narrows what is listed, not what was sold.
 */
const RecapDayBody = ({
  subs,
  leftOut,
  itemsState,
  withPounds,
  openSubs,
  onToggleSub,
  search,
  showTotal,
}: {
  subs: RecapSubDept[];
  leftOut: RecapLeftOut[];
  itemsState: DayItemsState;
  withPounds: boolean;
  openSubs: Set<number>;
  onToggleSub: (id: number) => void;
  search: string;
  /** The All sub depts row: on for a picked day, where it stands in for the
   *  day row above it. */
  showTotal: boolean;
}) => {
  const items: RecapItem[] | null =
    itemsState.status === "ready" ? itemsState.items : null;
  const searching = search.trim().length > 0;

  const bySub = useMemo(() => (items ? itemsBySubDept(items) : null), [items]);
  const matchesBySub = useMemo(() => {
    if (!bySub || !searching) return bySub;
    const out = new Map<number, RecapItem[]>();
    for (const [id, list] of bySub) {
      const hits = list.filter((i) => matchesSearch(i, search));
      if (hits.length) out.set(id, hits);
    }
    return out;
  }, [bySub, searching, search]);

  const shown = searching
    ? matchesBySub
      ? subs.filter((s) => matchesBySub.has(s.id))
      : []
    : subs;
  const top = subs.length ? subs[0].net : 0;
  const cols = subCols(withPounds);

  return (
    <div>
      {!showTotal && (
        <div className={`${NOTE} flex gap-4`}>
          <span>
            <b className="tabular-nums">{items ? count(items.length) : "…"}</b> items sold
          </span>
          <span>
            <b className="tabular-nums">{subs.length}</b> sub depts
          </span>
        </div>
      )}

      <div className={HEAD} style={{ gridTemplateColumns: cols }}>
        <span />
        <span>Sub dept</span>
        <span>Share of the day</span>
        <span className={NUM}>Items</span>
        <span className={NUM}>Units</span>
        {withPounds && <span className={NUM}>Pounds</span>}
        <span className={NUM}>Sales</span>
      </div>

      {itemsState.status === "error" && (
        <div className={NOTE}>
          The items for this day could not be read. Close the day and open it
          again to retry; the sub dept figures below are unaffected.
        </div>
      )}
      {searching && !matchesBySub && itemsState.status !== "error" && (
        <div className={NOTE}>Searching this day's items…</div>
      )}
      {searching && matchesBySub && shown.length === 0 && (
        <div className={NOTE}>Nothing sold this day matches the search.</div>
      )}
      {subs.length === 0 && <div className={NOTE}>No sub dept sales this day.</div>}

      {shown.map((s) => {
        const open = searching || openSubs.has(s.id);
        const list = matchesBySub?.get(s.id) ?? [];
        return (
          <div key={s.id}>
            <RecapSubDeptRow
              sub={s}
              top={top}
              itemCount={bySub ? (bySub.get(s.id)?.length ?? 0) : null}
              withPounds={withPounds}
              open={open}
              onToggle={() => onToggleSub(s.id)}
            />
            {open &&
              (matchesBySub ? (
                <RecapItemTable items={list} withPounds={withPounds} />
              ) : itemsState.status !== "error" ? (
                <div className={`${NOTE} pl-11`}>Loading this day's items…</div>
              ) : null)}
          </div>
        );
      })}

      {showTotal && subs.length > 0 && (
        <div className={TOTAL_ROW} style={{ gridTemplateColumns: cols }}>
          <span />
          <span>All sub depts</span>
          <span />
          <span className={NUM}>{items ? count(items.length) : "…"}</span>
          <span className={NUM}>{count(subs.reduce((t, s) => t + s.units, 0))}</span>
          {withPounds && (
            <span className={NUM}>{pounds(subs.reduce((t, s) => t + s.pounds, 0))}</span>
          )}
          <span className={NUM}>{money(subs.reduce((t, s) => t + s.net, 0))}</span>
        </div>
      )}

      {leftOut.length > 0 && (
        <div className={NOTE}>
          Left out of net sales, as on the day cards:{" "}
          {leftOut.map((l, i) => (
            <span key={l.name}>
              {i > 0 && ", "}
              {l.name} <span className="tabular-nums font-semibold">{money(l.net)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecapDayBody;
