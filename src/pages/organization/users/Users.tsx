import { useState } from "react";
import { useOrganizationCtx } from "../hooks";
import {
  resetUserInfo,
  setSelectedUserForm,
  setSelectedUserId,
} from "../../../features/usersSlice";
import UserGrid from "./UserGrid";
import CreateUserWizard from "./create/CreateUserWizard";
import UserDetailShell from "./view/UserDetailShell";

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

  if (isDetail) {
    return <UserDetailShell onBack={handleBack} />;
  }

  if (view === "create") {
    return <CreateUserWizard onComplete={() => setView("grid")} />;
  }

  return <UserGrid onOpenCreate={() => setView("create")} />;
};

export default Users;
