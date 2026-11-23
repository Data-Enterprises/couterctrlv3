// Hooks
import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../hooks";
import { useForgetDeletedGroup } from "../../../../../hooks/useForgetDeletedGroup";
import { useToast } from "../../../../../components/toasts/hooks/useToast";

// Redux
import { setGroups, type Group } from "../../../../../features/groupSlice";

// API
import { getGroups } from "../../../../../api/groups";
import {
  getSharedGroupStores,
  getSharedGroupUsers,
} from "../../../../../api/sharedGroups";

// Utils
import { errorText } from "../utils";

// Interfaces
import type {
  SharedGroup,
  SharedGroupStoreRow,
  SharedGroupStoresResp,
  SharedGroupUser,
  SharedGroupUsersResp,
} from "../../../../../interfaces";
import type { Envelope } from "../interfaces";

export const useSharedGroupsCtx = () => {
  const { url, token } = useAppSelector((s) => s.app);
  const { userid, userLevel } = useAppSelector((s) => s.user);
  return { url, token, userid, userLevel };
};

export const useRefreshMyGroups = () => {
  const dispatch = useAppDispatch();
  const forgetDeletedGroup = useForgetDeletedGroup();
  const { url, token } = useAppSelector((s) => s.app);

  return (deletedId?: number) => {
    if (deletedId) forgetDeletedGroup(deletedId);
    getGroups(url, token)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") dispatch(setGroups(j.groups as Group[]));
      })
      .catch(() => {});
  };
};

/**
 * One shared group's users and stores, read for whichever tab is open and
 * dropped when another group opens, plus the one way every write answers.
 */
export const useSharedGroupLists = (group: SharedGroup) => {
  const ctx = useSharedGroupsCtx();
  const toast = useToast();
  const [subTab, setSubTab] = useState<"users" | "stores">("stores");
  const [users, setUsers] = useState<SharedGroupUser[] | null>(null);
  const [stores, setStores] = useState<SharedGroupStoreRow[] | null>(null);
  const activeGroupId = useRef(group.id);

  useEffect(() => {
    activeGroupId.current = group.id;
    setSubTab("stores");
    setUsers(null);
    setStores(null);
  }, [group.id]);

  const loadUsers = () => {
    const forGroup = group.id;
    getSharedGroupUsers(ctx.url, ctx.token)
      .then((resp) => {
        if (activeGroupId.current !== forGroup) return;
        const j: SharedGroupUsersResp = resp.data;
        if (j.error === 0) setUsers(j.users);
        else toast.error(j.msg || "Could not load users");
      })
      .catch((err) => toast.error(errorText(err)));
  };

  const loadStores = () => {
    const forGroup = group.id;
    getSharedGroupStores(ctx.url, ctx.token, group.id)
      .then((resp) => {
        if (activeGroupId.current !== forGroup) return;
        const j: SharedGroupStoresResp = resp.data;
        if (j.error === 0) setStores(j.stores);
        else toast.error(j.msg || "Could not load stores");
      })
      .catch((err) => toast.error(errorText(err)));
  };

  useEffect(() => {
    if (subTab === "users") loadUsers();
    else loadStores();
  }, [group.id, subTab]);

  /** Every write answers the same envelope; this reads it the same way. */
  const write = (
    p: Promise<{ data: Envelope }>,
    ok: string,
    fail: string,
    after: () => void,
  ): Promise<void> =>
    p
      .then((resp) => {
        if (resp.data.error === 0) {
          toast.success(ok);
          after();
        } else {
          toast.error(resp.data.msg || fail);
        }
      })
      .catch((err) => toast.error(errorText(err)));

  return { subTab, setSubTab, users, stores, loadUsers, loadStores, write };
};
