import { isForbidden } from "../../../../api/sharedGroups";
import type { SharedGroupStore } from "../../../../interfaces";
import { useAdminPageCtx } from "../hooks";

/**
 * What the Shared Groups tab needs from Admin: the API, and the companies
 * Admin already scopes to this user — every company for programmers and DCR
 * support, their own companies for everyone else. Every read asks for all of
 * them at once; every write names the one company its group lives in.
 */
export const useSharedGroupsCtx = () => {
  const admin = useAdminPageCtx();
  return {
    url: admin.url,
    token: admin.token,
    companies: admin.companies.map((c) => ({ id: c.id, name: c.name })),
  };
};

/**
 * The stores a group in `company` can pick from: that company's stores from
 * /shared_groups/stores, plus whatever the group already holds, so nothing in
 * it goes missing from the list.
 */
export const storesFor = (
  all: SharedGroupStore[],
  company: number,
  current: SharedGroupStore[] = [],
) => {
  const byId = new Map<number, SharedGroupStore>();
  for (const store of all) if (store.company === company) byId.set(store.storeid, store);
  for (const store of current) if (!byId.has(store.storeid)) byId.set(store.storeid, store);
  return [...byId.values()].sort((a, b) =>
    (a.store_number ?? "").localeCompare(b.store_number ?? "", undefined, {
      numeric: true,
    }),
  );
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
