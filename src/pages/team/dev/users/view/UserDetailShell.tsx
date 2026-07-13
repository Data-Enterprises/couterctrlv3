import { useEffect, useState } from "react";
import { useTeamCtx } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { getBGAssignedToUserSplit } from "../../../../../api/baseGroups";
import { setAllSelectedBaseGroups } from "../../../../../features/baseGroupSlice";
import type { JsonError } from "../../../../../interfaces";
import { roles } from "../../..";
import BasicInfoTab from "./BasicInfoTab";
import CompaniesTab from "./CompaniesTab";
import BaseGroupsTab from "./BaseGroupsTab";
import StoresTab from "./StoresTab";
import SecurityTab from "./SecurityTab";

const TABS = [
  { id: 1, label: "Basic info" },
  { id: 2, label: "Companies" },
  { id: 3, label: "Base groups" },
  { id: 4, label: "Stores" },
  { id: 5, label: "Password & security" },
];

interface UserDetailShellProps {
  onBack: () => void;
}

const UserDetailShell = ({ onBack }: UserDetailShellProps) => {
  const toast = useToast();
  const ctx = useTeamCtx();
  const [tab, setTab] = useState(1);

  const targetUser = ctx.users.find((u) => u.id === ctx.selectedUserId);
  const outranked = targetUser ? targetUser.user_level > ctx.userLevel : false;

  useEffect(() => {
    ctx.dispatch(setAllSelectedBaseGroups([]));
    if (ctx.selectedUserId) {
      getBGAssignedToUserSplit(ctx.url, ctx.token, ctx.selectedUserId)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) ctx.dispatch(setAllSelectedBaseGroups(j.active.flat()));
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  }, [ctx.selectedUserId]);

  if (outranked) return null;
  if (!targetUser) return null;

  const roleLabel = roles.find((r) => r.value == ctx.userInfo.role)?.label ?? "";
  const levelLabel = ctx.userLevels.find((l) => l.id === ctx.userInfo.user_level)?.name ?? "";
  const companyNames = targetUser.companies.map((c) => c.name).join(", ");
  const bgNames = ctx.selectedBaseGroups.map((bg) => bg.name).join(", ");

  const renderTab = () => {
    switch (tab) {
      case 1:
        return <BasicInfoTab />;
      case 2:
        return <CompaniesTab />;
      case 3:
        return <BaseGroupsTab />;
      case 4:
        return <StoresTab />;
      case 5:
        return <SecurityTab />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4">
      <button onClick={onBack} className="text-[11px] text-content/60 mb-3 self-start">
        ← Back to users
      </button>

      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg mb-4">
        <div className="w-10 h-10 rounded-full bg-[#1e2a4a] text-custom-white flex items-center justify-center text-[13px] font-semibold flex-shrink-0">
          {ctx.userInfo.first_name?.charAt(0)}
          {ctx.userInfo.last_name?.charAt(0)}
        </div>
        <div className="grid grid-cols-3 gap-x-5 gap-y-1 text-[12px] flex-1">
          <div>
            <span className="text-content/60">Name</span>
            <div className="font-medium text-content">
              {ctx.userInfo.first_name} {ctx.userInfo.last_name}
            </div>
          </div>
          <div>
            <span className="text-content/60">Username</span>
            <div className="font-medium text-content">{ctx.userInfo.username}</div>
          </div>
          <div>
            <span className="text-content/60">Email</span>
            <div className="font-medium text-content">{ctx.userInfo.email}</div>
          </div>
          <div>
            <span className="text-content/60">Company</span>
            <div className="font-medium text-content truncate">{companyNames}</div>
          </div>
          <div>
            <span className="text-content/60">Base groups</span>
            <div className="font-medium text-content truncate">{bgNames || "—"}</div>
          </div>
          <div>
            <span className="text-content/60">Role · Level</span>
            <div className="font-medium text-content">
              {roleLabel}, {levelLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-100 mb-4 flex-shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-[12px] font-semibold py-2 whitespace-nowrap border-b-2 flex-1 text-center ${
              tab === t.id ? "border-[#1e2a4a] text-[#1e2a4a]" : "border-transparent text-content"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar">{renderTab()}</div>
    </div>
  );
};

export default UserDetailShell;
