import { useEffect } from "react";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { getUserStores } from "../../../../api/user";
import { assignUserToStore, unassignUserFromStore } from "../../../../api/team";
import { setRefresh, setSelectedUserStores, setStoresAssignedForUser, setStoresUnassignedForUser } from "../../../../features/usersSlice";
import { setRefreshStores } from "../../../../features/userSlice";
import type { JsonError, Store } from "../../../../interfaces";
import AssignPanel from "../../components/AssignPanel";

const StoresTab = () => {
  const toast = useToast();
  const ctx = useOrganizationCtx();

  const getStores = (userid: number) => {
    const filterNulls = (arr: Store[]) => arr.filter((store) => store.store_name !== null);
    getUserStores(ctx.url, ctx.token, userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const stores = {
            assigned: filterNulls(j.assigned_stores).sort(
              (a: Store, b: Store) => parseInt(a.store_number) - parseInt(b.store_number),
            ),
            unassigned: filterNulls(j.unassigned_stores).sort(
              (a: Store, b: Store) => parseInt(a.store_number) - parseInt(b.store_number),
            ),
          };
          ctx.dispatch(setSelectedUserStores(stores));
          ctx.dispatch(setRefresh(true));
        }
      })
      .catch((err: JsonError) => toast.error("Error fetching available stores " + err.message));
  };

  useEffect(() => {
    if (!ctx.selectedUserId) return;
    getStores(ctx.selectedUserId);
  }, [ctx.selectedUserId]);

  const handleAssign = (ids: number[]) => {
    if (ids.length === 0) return;
    ctx.dispatch(setStoresAssignedForUser(ids));
    assignUserToStore(ctx.url, ctx.token, ctx.selectedUserId, ids)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0 && ctx.selectedUserId === ctx.userid) {
          ctx.dispatch(setRefreshStores(true));
        }
      })
      .catch((err: JsonError) => toast.error("Error assigning store " + err.message));
  };

  const handleUnassign = (ids: number[]) => {
    if (ids.length === 0) return;
    ctx.dispatch(setStoresUnassignedForUser(ids));
    unassignUserFromStore(ctx.url, ctx.token, ctx.selectedUserId, ids)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0 && ctx.selectedUserId === ctx.userid) {
          ctx.dispatch(setRefreshStores(true));
        }
      })
      .catch((err: JsonError) => toast.error("Error: " + err.message));
  };

  return (
    <AssignPanel
      leftTitle="Unassigned"
      rightTitle="Assigned"
      leftItems={ctx.selectedUserStores.unassigned.map((s) => ({ id: s.storeid, label: s.store_name, sublabel: s.company_name }))}
      rightItems={ctx.selectedUserStores.assigned.map((s) => ({ id: s.storeid, label: s.store_name, sublabel: s.company_name }))}
      onAssign={handleAssign}
      onUnassign={handleUnassign}
    />
  );
};

export default StoresTab;
