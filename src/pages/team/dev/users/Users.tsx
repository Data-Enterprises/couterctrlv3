import { useState } from "react";
import { useTeamCtx } from "../hooks";
import { resetUserInfo, setSelectedUserForm, setSelectedUserId } from "../../../../features/usersSlice";
import { resetSelectedBaseGroups, setAllSelectedBaseGroups, setStoresWithBGID } from "../../../../features/baseGroupSlice";
import UserGrid from "./UserGrid";
import CreateUserWizard from "./create/CreateUserWizard";
import UserDetailShell from "./view/UserDetailShell";

type SubTab = "browse" | "delete" | "create";

const Users = () => {
  const ctx = useTeamCtx();
  const [subTab, setSubTab] = useState<SubTab>("browse");

  const isDetail = ctx.selectedUserForm === "user_info" && ctx.selectedUserId > 0;

  const handleTabChange = (tab: SubTab) => {
    setSubTab(tab);
    ctx.dispatch(resetUserInfo());
    ctx.dispatch(setSelectedUserId(0));
    ctx.dispatch(setSelectedUserForm(""));
    ctx.dispatch(resetSelectedBaseGroups());
    ctx.dispatch(setStoresWithBGID([]));
    ctx.dispatch(setAllSelectedBaseGroups([]));
  };

  const handleBack = () => {
    ctx.dispatch(resetUserInfo());
    ctx.dispatch(setSelectedUserId(0));
    ctx.dispatch(setSelectedUserForm(""));
  };

  if (isDetail) {
    return <UserDetailShell onBack={handleBack} />;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex border-b border-gray-100 flex-shrink-0">
        {(["browse", "delete", "create"] as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`text-[12px] font-semibold py-2.5 whitespace-nowrap border-b-2 flex-1 text-center capitalize ${
              subTab === t ? "border-[#1e2a4a] text-[#1e2a4a]" : "border-transparent text-content"
            }`}
          >
            {t === "browse" ? "Users" : t}
          </button>
        ))}
      </div>

      {subTab === "browse" && <UserGrid mode="info" />}
      {subTab === "delete" && <UserGrid mode="delete" />}
      {subTab === "create" && <CreateUserWizard onComplete={() => setSubTab("browse")} />}
    </div>
  );
};

export default Users;
