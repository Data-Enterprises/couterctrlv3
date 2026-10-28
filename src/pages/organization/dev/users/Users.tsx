import { useState } from "react";
import { useOrganizationCtx } from "../hooks";
import {
  resetUserInfo,
  setSelectedUserForm,
  setSelectedUserId,
} from "../../../../features/dev/devUsersSlice";
import UserGrid from "./UserGrid";
import UserWizard from "./create/UserWizard";

type View = "grid" | "create";

const Users = () => {
  const ctx = useOrganizationCtx();
  const [view, setView] = useState<View>("grid");

  const isDetail =
    ctx.selectedUserForm === "user_info" && ctx.selectedUserId > 0;

  const handleBack = () => {
    ctx.dispatch(resetUserInfo());
    ctx.dispatch(setSelectedUserId(0));
    ctx.dispatch(setSelectedUserForm(""));
  };

  // Edit is Add, filled in — the same four steps. Somebody above your own
  // level is not yours to edit, so their row opens nothing rather than a form
  // whose every save the server would refuse.
  if (isDetail) {
    const target = ctx.users.find((u) => u.id === ctx.selectedUserId);
    if (!target || target.user_level > ctx.userLevel) return null;
    return (
      <UserWizard
        key={ctx.selectedUserId}
        editUserId={ctx.selectedUserId}
        onComplete={handleBack}
        onCancel={handleBack}
      />
    );
  }

  if (view === "create") {
    return (
      <UserWizard
        onComplete={() => setView("grid")}
        onCancel={() => setView("grid")}
      />
    );
  }

  return <UserGrid onOpenCreate={() => setView("create")} />;
};

export default Users;
