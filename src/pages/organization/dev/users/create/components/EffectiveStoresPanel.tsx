// Hooks
import { useMemo, useState } from "react";

// Utils
import { effectiveStores } from "../../utils";

// Interfaces
import type { AccessPicks } from "../../interfaces";
import type { BaseGroup, CompanyBaseGroup, Store } from "../../../../../../interfaces";

// Components
import TextFilter from "../../../../../../components-dev/filters/TextFilter";

interface EffectiveStoresPanelProps {
  picks: AccessPicks;
  companyGroups: Record<number, CompanyBaseGroup[]>;
  groupStores: Record<number, Store[]>;
  /** Held stores no pick explains — see `CarriedAccess.stores`. */
  directStoreIds: number[];
  /** Everything the person currently holds, for names the rosters lack. */
  assignedStores: Store[];
  /** The groups they hold, for names before their company is opened. */
  heldGroups?: BaseGroup[];
}

/**
 * What the person can actually see, and why (which group grants each store,
 * or Direct). Read only: it is derived from the grants beside it. Reads the
 * picks as they stand, unsaved changes included.
 */
const EffectiveStoresPanel = ({
  picks,
  companyGroups,
  groupStores,
  directStoreIds,
  assignedStores,
  heldGroups = [],
}: EffectiveStoresPanelProps) => {
  const [filter, setFilter] = useState("");

  const groupsById = useMemo(() => {
    const map: Record<number, { name: string }> = {};
    heldGroups.forEach((g) => {
      map[g.id] = g;
    });
    Object.values(companyGroups)
      .flat()
      .forEach((g) => {
        map[g.id] = g;
      });
    return map;
  }, [companyGroups, heldGroups]);

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

  /** A group held By group whose roster has not arrived would make the count read
   *  low, and low is worse than honest. */
  const pending = picks.baseGroups.some(
    (id) => picks.mode === "all" && groupStores[id] === undefined,
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
    // A column inside the access card, and a card in its own right: it is the
    // answer the three columns add up to.
    <div className="h-full flex flex-col min-h-0 bg-custom-white">
      <div className="px-3 py-2.5 border-b border-line_hair flex-shrink-0">
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wide text-content">
            Effective stores
          </span>
          <span className="text-[10.5px] text-content/95 tabular-nums">
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
              {/* Where it comes from: the granting group, or Direct when no
                  group does (and no group change can take it away). */}
              <span
                className="text-[10.5px] font-semibold text-content/95 flex-shrink-0 truncate max-w-[42%]"
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
          <div className="flex items-center justify-center py-8 px-4 text-[11.5px] text-content/95 text-center">
            No stores match
          </div>
        )}

        {rows.length === 0 && (
          <div className="flex items-center justify-center py-8 px-4 text-[11.5px] text-content/95 text-center">
            {picks.baseGroups.length === 0
              ? "No base groups held, so no stores."
              : "No stores yet — tick a group, or pick its stores By store."}
          </div>
        )}
      </div>
    </div>
  );
};

export default EffectiveStoresPanel;
