import { useEffect, useState } from "react";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { getBGAssignedToUserSplit } from "../../../../api/baseGroups";
import { setAllSelectedBaseGroups } from "../../../../features/baseGroupSlice";
import type { JsonError } from "../../../../interfaces";
import { roles } from "../../constants";
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
  const ctx = useOrganizationCtx();
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
  const initials = `${ctx.userInfo.first_name?.charAt(0) ?? ""}${ctx.userInfo.last_name?.charAt(0) ?? ""}`;

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
    <div className="flex-1 flex flex-col min-h-0 p-4 w-[640px]">
      <button onClick={onBack} className="text-[11px] text-content/60 mb-3 self-start">
        ← Back to users
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-[#1e2a4a] text-custom-white flex items-center justify-center text-[15px] font-medium flex-shrink-0">
          {initials}
        </div>
        <div>
          <div className="text-[15px] font-medium text-content">
            {ctx.userInfo.first_name} {ctx.userInfo.last_name}
          </div>
          <div className="text-[11.5px] text-content/60">
            {ctx.userInfo.username} · {ctx.userInfo.email}
          </div>
          <div className="flex gap-1.5 mt-1.5">
            <span className="text-[10.5px] font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {roleLabel}
            </span>
            <span className="text-[10.5px] font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {levelLabel}
            </span>
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
