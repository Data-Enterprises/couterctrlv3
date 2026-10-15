import { useMemo, useState } from "react";
import type { CompanyBaseGroup, Store } from "../../../../../interfaces";
import {
  effectiveStores,
  type AccessPicks,
} from "../access/accessSets";
import TextFilter from "../../../../../components-dev/filters/TextFilter";

/**
 * What the person can actually see, and why.
 *
 * The `why` is the reason this panel exists. A list of stores answers "can
 * they open Somerset", which the old Stores tab already did. It cannot answer
 * "what happens when we open another one" — and that is the question the
 * grants above are really setting, so the screen that sets them has to show
 * its own consequence.
 *
 * Read only on purpose. Everything here is derived from the grants in the
 * panel beside it; a control here would be a second way to express the same
 * thing, and the two would disagree.
 *
 * ### Unsaved grants are included
 *
 * It reads from the picks as they stand, not from what is saved, so switching
 * a group to Auto shows the stores that arrive the moment Save is pressed. A
 * preview that only caught up afterwards would make the mode control feel
 * like it had done nothing.
 */
const EffectiveStoresPanel = ({
  picks,
  companyGroups,
  groupStores,
  directStoreIds,
  assignedStores,
}: {
  picks: AccessPicks;
  companyGroups: Record<number, CompanyBaseGroup[]>;
  groupStores: Record<number, Store[]>;
  /** Held stores no pick explains — see `CarriedAccess.stores`. */
  directStoreIds: number[];
  /** Everything the person currently holds, for names the rosters lack. */
  assignedStores: Store[];
}) => {
  const [filter, setFilter] = useState("");

  const groupsById = useMemo(() => {
    const map: Record<number, CompanyBaseGroup> = {};
    Object.values(companyGroups)
      .flat()
      .forEach((g) => {
        map[g.id] = g;
      });
    return map;
  }, [companyGroups]);

  /** Names come from whichever source has them: a group roster, the stores
   *  the person holds, or the picks themselves. */
  const storeById = useMemo(() => {
    const map = new Map<number, Store>();
    assignedStores.forEach((s) => map.set(s.storeid, s));
    Object.values(groupStores)
      .flat()
      .forEach((s) => {
        if (!map.has(s.storeid)) map.set(s.storeid, s);
      });
    picks.stores.forEach((s) => {
      if (!map.has(s.storeid)) map.set(s.storeid, s);
    });
    return map;
  }, [assignedStores, groupStores, picks.stores]);

  const viaGroups = useMemo(
    () => effectiveStores(picks, groupStores),
    [picks, groupStores],
  );

  const granted = new Set(viaGroups.map((e) => e.storeid));

  const rows = useMemo(
    () => [
      ...viaGroups.map((e) => ({
        storeid: e.storeid,
        source: groupsById[e.groupid]?.name ?? `Group ${e.groupid}`,
        mode: e.mode,
      })),
      // Direct rows last: they are the legacy shape and the ones nobody on
      // this screen granted.
      ...directStoreIds
        .filter((id) => !granted.has(id))
        .map((id) => ({ storeid: id, source: null, mode: null })),
    ],
    [viaGroups, directStoreIds, groupsById, granted],
  );

  /** An Auto group whose roster has not arrived would make the count read
   *  low, and low is worse than honest. */
  const pending = picks.baseGroups.some(
    (id) => picks.modes[id] === "all" && groupStores[id] === undefined,
  );

  const q = filter.trim().toLowerCase();
  const shown = q
    ? rows.filter((r) => {
        const store = storeById.get(r.storeid);
        return (
          (store?.store_name ?? "").toLowerCase().includes(q) ||
          (store?.store_number ?? "").toLowerCase().includes(q) ||
          (r.source ?? "").toLowerCase().includes(q)
        );
      })
    : rows;

  return (
    // A column inside the access card, and a card in its own right: the grey
    // ground made it read as scenery beside the three columns that do the
    // work, when it is the answer they add up to.
    <div className="h-full flex flex-col min-h-0 bg-custom-white">
      <div className="px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wide text-content">
            Effective stores
          </span>
          <span className="text-[10.5px] text-content/85 tabular-nums">
            {pending ? "counting…" : `${rows.length} · read only`}
          </span>
        </div>
        <TextFilter
          value={filter}
          onChange={setFilter}
          placeholder="Search stores…"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar divide-y divide-brand_navy/15">
        {shown.map((r) => {
          const store = storeById.get(r.storeid);
          return (
            <div
              key={r.storeid}
              className="flex items-baseline gap-2 px-3 py-1.5 text-[12px] text-content"
            >
              <span className="truncate flex-1" title={store?.store_name ?? ""}>
                {store?.store_name ?? `Store ${r.storeid}`}
              </span>
              {/* Where it comes from, in one word rather than a column of
                  its own: the group that grants it, or Direct when nothing
                  does and no group change can take it away. */}
              <span
                className="text-[10.5px] font-semibold text-content/85 flex-shrink-0 truncate max-w-[42%]"
                title={
                  r.mode === null
                    ? "Assigned directly, through no base group"
                    : `via ${r.source}`
                }
              >
                {r.mode === null ? "Direct" : r.source}
              </span>
            </div>
          );
        })}

        {rows.length > 0 && shown.length === 0 && (
          <div className="flex items-center justify-center py-8 px-4 text-[11.5px] text-content/85 text-center">
            No stores match
          </div>
        )}

        {rows.length === 0 && (
          <div className="flex items-center justify-center py-8 px-4 text-[11.5px] text-content/85 text-center">
            {picks.baseGroups.length === 0
              ? "No base groups held, so no stores."
              : "No stores yet — pick some, or set a group to Auto."}
          </div>
        )}
      </div>
    </div>
  );
};

export default EffectiveStoresPanel;
