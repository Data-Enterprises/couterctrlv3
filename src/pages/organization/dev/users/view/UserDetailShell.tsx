import { useEffect, useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { getBGAssignedToUserSplit } from "../../../../../api/baseGroups";
import { setAllSelectedBaseGroups } from "../../../../../features/dev/devBaseGroupSlice";
import type { JsonError } from "../../../../../interfaces";
import { roles } from "../../constants";
import BasicInfoTab from "./BasicInfoTab";
import AccessTab from "./AccessTab";

/**
 * Two tabs, not four. Companies, base groups and stores were three screens
 * asking three halves of one question, each saving on its own — and between
 * them they could not express a company with no stores, which had no row to
 * tick anywhere. They are now one panel with one Save.
 */
const TABS = [
  { id: 1, label: "Basic info" },
  { id: 2, label: "Access" },
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
        return <AccessTab />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 w-full">
      {/* Breadcrumb rather than a back arrow: it says where you are as well
          as where you came from, and the whole page is one level deep. */}
      <div className="flex items-center gap-2 mb-2.5 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[11.5px] font-semibold px-2 py-1 -ml-2 rounded-md text-brand_navy hover:bg-gray-50"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          Back to users
        </button>
        <span className="text-[11.5px] text-content/85" aria-hidden="true">
          /
        </span>
        <span className="text-[11.5px] text-content/85 truncate">
          {ctx.userInfo.first_name} {ctx.userInfo.last_name}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
        <div className="w-11 h-11 rounded-full bg-brand_navy text-custom-white flex items-center justify-center text-[15px] font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[17px] font-bold text-content">
              {ctx.userInfo.first_name} {ctx.userInfo.last_name}
            </span>
            {/* One chip, not two. Role and level are read together -- "Multi
                Store, Owner" is a single description of what this person is. */}
            {(roleLabel || levelLabel) && (
              <span className="text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full bg-filter_active text-brand_navy">
                {[roleLabel, levelLabel].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
          <div className="text-[12px] text-content/85 mt-0.5">
            {ctx.userInfo.username} · {ctx.userInfo.email}
          </div>
        </div>
      </div>

      {/* Left-aligned and sized to their words. Stretched across the panel
          they read as a segmented control -- two halves of one thing rather
          than two places to go. */}
      <div className="flex gap-6 border-b border-gray-100 mb-4 flex-shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-[13px] font-semibold pb-2 whitespace-nowrap border-b-2 ${
              tab === t.id
                ? "border-brand_navy text-brand_navy"
                : "border-transparent text-content/85 hover:text-content"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">{renderTab()}</div>
    </div>
  );
};

export default UserDetailShell;
