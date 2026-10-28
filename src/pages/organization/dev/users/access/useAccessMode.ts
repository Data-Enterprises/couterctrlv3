import { useCallback } from "react";
import { useOrganizationCtx } from "../../hooks";
import { getAllStoresInBaseGroup } from "../../../../../api/baseGroups";
import type { GrantMode, JsonError, Store } from "../../../../../interfaces";
import { heldGroupIds, picksForMode, type AccessPicks } from "./accessSets";

/**
 * Changing how a person holds their groups.
 *
 * The arithmetic is `picksForMode`, which is pure and tested. What this adds
 * is the one thing it cannot do for itself: **make sure the rosters are
 * there first.**
 *
 * Switching to By store ticks each held group's whole roster, so the switch
 * starts as a no-op and the admin unticks from there. A roster that has not
 * loaded contributes nothing — which, left alone, would quietly take every
 * store off a group the panel simply had not browsed to yet. So every held
 * group's roster is fetched before the switch is applied, not after.
 *
 * Fetched rosters are handed back to the caller's `groupStores` as well, so
 * the panel that renders the new ticks does not fetch the same lists again.
 */
export const useAccessMode = () => {
  const ctx = useOrganizationCtx();

  return useCallback(
    async (
      picks: AccessPicks,
      mode: GrantMode,
      groupStores: Record<number, Store[]>,
      onGroupStoresChange: (
        updater: (prev: Record<number, Store[]>) => Record<number, Store[]>,
      ) => void,
    ): Promise<AccessPicks> => {
      // Nothing to look up: `all` names no stores, and a mode that has not
      // changed cannot need any.
      if (mode === "all" || mode === picks.mode) {
        return picksForMode(picks, mode, groupStores);
      }

      const missing = heldGroupIds(picks).filter(
        (id) => groupStores[id] === undefined,
      );

      let rosters = groupStores;
      if (missing.length > 0) {
        const fetched = await Promise.all(
          missing.map((id) =>
            getAllStoresInBaseGroup(ctx.url, ctx.token, id)
              .then((resp) => {
                const j = resp.data;
                // A store with no name is dropped before it reaches a search
                // box, same as everywhere else that reads this endpoint.
                const stores: Store[] =
                  j.error === 0
                    ? (j.assigned_stores as Store[]).filter(
                        (s) => s.store_name != null,
                      )
                    : [];
                return [id, stores] as const;
              })
              // A roster that will not load leaves its group with no ticks,
              // which the panel shows as "0 of ?" rather than pretending.
              .catch((_err: JsonError) => [id, [] as Store[]] as const),
          ),
        );
        rosters = { ...groupStores };
        fetched.forEach(([id, stores]) => (rosters[id] = stores));
        onGroupStoresChange((prev) => {
          const next = { ...prev };
          fetched.forEach(([id, stores]) => {
            if (next[id] === undefined) next[id] = stores;
          });
          return next;
        });
      }

      return picksForMode(picks, mode, rosters);
    },
    [ctx.url, ctx.token],
  );
};
