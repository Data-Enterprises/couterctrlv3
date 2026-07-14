import { useTeamCtx } from "../../hooks";
import { roles } from "../../..";

interface StepReviewProps {
  onSubmit: () => void;
  onEdit: () => void;
}

const StepReview = ({ onSubmit, onEdit }: StepReviewProps) => {
  const ctx = useTeamCtx();

  const roleLabel = roles.find((r) => r.value == ctx.userInfo.role)?.label ?? "";
  const levelLabel = ctx.userLevels.find((l) => l.id === ctx.userInfo.user_level)?.name ?? "";
  const companyNames = ctx.companies
    .filter((c) => ctx.selectedNewUserStores.some((s) => s.company === c.company))
    .map((c) => c.name)
    .join(", ");
  const bgNames = ctx.selectedBaseGroups
    .filter((bg) => ctx.selectedNewUserStores.some((s) => s.base_group === bg.id))
    .map((bg) => bg.name)
    .join(", ");

  return (
    <div className="max-w-[460px]">
      <div className="flex flex-col gap-2.5 mb-4">
        <div className="flex justify-between border-b border-gray-100 pb-2">
          <span className="text-[11px] font-semibold text-content">User info</span>
          <span className="text-[11px] text-content/70 text-right">
            {ctx.userInfo.username} · {ctx.userInfo.first_name} {ctx.userInfo.last_name} · {roleLabel}, {levelLabel}
          </span>
        </div>
        <div className="flex justify-between border-b border-gray-100 pb-2">
          <span className="text-[11px] font-semibold text-content">Access</span>
          <span className="text-[11px] text-content/70 text-right">
            {companyNames || "—"} · {bgNames || "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[11px] font-semibold text-content">Stores</span>
          <span className="text-[11px] text-content/70">{ctx.selectedNewUserStores.length} selected</span>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onEdit} className="text-[12px] text-content">
          Edit
        </button>
        <button
          onClick={onSubmit}
          className="text-[12px] font-medium px-4 py-1.5 rounded-md bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 text-white"
        >
          Create user
        </button>
      </div>
    </div>
  );
};

export default StepReview;
