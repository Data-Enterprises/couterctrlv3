import { useAppSelector } from "../../../../hooks";
import { isForbidden } from "../../../../api/sharedGroups";
import type { SharedGroupStore } from "../../../../interfaces";
import { useAdminPageCtx } from "../hooks";

/**
 * What the Shared Groups tab needs from Admin.
 *
 * A shared group is a search filter an owner builds and hands to other users.
 * It never grants or revokes store access (that's Base Groups), so the stores
 * offered here are the ones the acting user can already see — their own
 * assigned stores in the group's company — plus whatever the group already
 * holds, so nothing in it goes missing from the list.
 */
export const useSharedGroupsCtx = () => {
  const admin = useAdminPageCtx();
  const assignedStores = useAppSelector((s) => s.user.assignedStores);

  const companyStores = (company: number, current: SharedGroupStore[] = []) => {
    const byId = new Map<number, SharedGroupStore>();
    for (const store of assignedStores) {
      if (store.company === company) {
        byId.set(store.storeid, {
          storeid: store.storeid,
          store_number: store.store_number,
          store_name: store.store_name,
        });
      }
    }
    for (const store of current) byId.set(store.storeid, store);
    return [...byId.values()].sort((a, b) =>
      (a.store_number ?? "").localeCompare(b.store_number ?? "", undefined, {
        numeric: true,
      }),
    );
  };

  return {
    url: admin.url,
    token: admin.token,
    userid: admin.userid,
    companies: admin.companies.map((c) => ({ id: c.id, name: c.name })),
    companyStores,
  };
};

/** One store's label, the way every list on this tab prints it. */
export const storeLabel = (s: SharedGroupStore) =>
  [s.store_number, s.store_name ?? `Store ${s.storeid}`]
    .filter(Boolean)
    .join(" - ");

/** The router's level gate answers 403, not an envelope — say what it means. */
export const errorText = (err: unknown) =>
  isForbidden(err)
    ? "Shared groups need owner level (7) or above."
    : ((err as { message?: string })?.message ?? "Something went wrong");
