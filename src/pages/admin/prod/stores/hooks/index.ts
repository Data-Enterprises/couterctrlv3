// Hooks
import { useEffect, useState } from "react";
import { useToast } from "../../../../../components/toasts/hooks/useToast";

// Redux
import { setStoreRecords } from "../../../../../features/adminPageSlice";

// API
import { getUserStores } from "../../../../../api/user";
import {
  createNewStore,
  deactivateStore,
  reactivateStore,
  setNewStoreName,
} from "../../../../../api/admin";

// Utils
import { withClosedMark, withoutClosedMark } from "../../utils";
import { reasonOf } from "../../../../../utils/serverError";

// Interfaces
import type { Store } from "../../../../../interfaces";
import type { StoreForm } from "../interfaces";
import type { useAdminPageCtx } from "../../hooks";

/**
 * The Stores tab's list read and saves: it reads the stores on mount, and
 * creates, renames, closes and re-opens them. The pop-ups and the save in
 * flight are here too; nothing to keep once the tab is left.
 */
export const useStoreEdits = (context: ReturnType<typeof useAdminPageCtx>) => {
  const toast = useToast();
  const { dispatch } = context;
  const [creating, setCreating] = useState<boolean>(false);
  const [editing, setEditing] = useState<Store | null>(null);
  const [deactivating, setDeactivating] = useState<Store | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  /** The backend can return a null store_name or store_number despite the
   *  type claiming string, and the search below throws on a null
   *  `toLowerCase`. */
  const validOnly = (list: Store[]) =>
    list.filter((s) => s.store_number !== null && s.store_name !== null);

  const fetchStores = () => {
    getUserStores(context.url, context.token, context.userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "Error fetching stores");
          return;
        }
        dispatch(
          setStoreRecords([
            ...validOnly(j.assigned_stores ?? []),
            // Below level 9 the unassigned half is other operators' stores.
            ...(context.canSeeAllStores
              ? validOnly(j.unassigned_stores ?? [])
              : []),
          ]),
        );
      })
      .catch((err) => toast.error(reasonOf(err)));
  };

  useEffect(fetchStores, []);

  const handleCreate = (form: StoreForm) => {
    setSaving(true);
    createNewStore(
      context.url,
      context.token,
      form.storeid,
      form.store_number,
      form.store_name,
      form.company,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "The store could not be created");
          return;
        }
        toast.success(`${form.store_name} created`);
        setCreating(false);
        fetchStores();
      })
      .catch((err) => toast.error(reasonOf(err)))
      .finally(() => setSaving(false));
  };

  const handleRename = (form: StoreForm) => {
    if (!editing) return;
    setSaving(true);
    setNewStoreName(
      context.url,
      context.token,
      editing.storeid,
      form.store_name,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "The store could not be renamed");
          return;
        }
        toast.success(`Renamed to ${form.store_name}`);
        setEditing(null);
        fetchStores();
      })
      .catch((err) => toast.error(reasonOf(err)))
      .finally(() => setSaving(false));
  };

  // Close or re-open a store, and move the CLOSED marker in its name with it.
  const changeStatus = (store: Store, next: "deactivate" | "reactivate") => {
    const call = next === "deactivate" ? deactivateStore : reactivateStore;
    const verb = next === "deactivate" ? "closed" : "re-opened";
    const wanted =
      next === "deactivate"
        ? withClosedMark(store.store_name)
        : withoutClosedMark(store.store_name);

    call(context.url, context.token, store.storeid)
      .then(async (resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "The store could not be updated");
          return;
        }
        setDeactivating(null);

        if (wanted === store.store_name) {
          toast.success(`${store.store_name} ${verb}`);
          return;
        }

        try {
          const r = await setNewStoreName(
            context.url,
            context.token,
            store.storeid,
            wanted,
          );
          if (r.data.error !== 0)
            throw new Error(r.data.msg ?? "rename failed");
          toast.success(`${wanted} ${verb}`);
        } catch {
          toast.warn(
            `${store.store_name} ${verb}, but the name could not be updated to "${wanted}". Rename it with the pencil.`,
          );
        }
      })
      .catch((err) => toast.error(reasonOf(err)))
      .finally(() => fetchStores());
  };

  return {
    creating,
    setCreating,
    editing,
    setEditing,
    deactivating,
    setDeactivating,
    saving,
    handleCreate,
    handleRename,
    changeStatus,
  };
};
