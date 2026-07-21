import { useMemo } from "react";
import { useOrganizationCtx } from "../../hooks";
import { roles } from "../../constants";
import type { CompanyBaseGroup } from "../../../../interfaces";
import type { SelectableStore } from "../../types";

interface StepReviewProps {
  selectedStores: SelectableStore[];
  companyGroups: Record<number, CompanyBaseGroup[]>;
  onSubmit: () => void;
  onEditStep: (step: number) => void;
  canSubmit: boolean;
}

const StepReview = ({
  selectedStores,
  companyGroups,
  onSubmit,
  onEditStep,
  canSubmit,
}: StepReviewProps) => {
  const ctx = useOrganizationCtx();

  const groupsById = useMemo(() => {
    const map: Record<number, CompanyBaseGroup> = {};
    Object.values(companyGroups)
      .flat()
      .forEach((g) => {
        map[g.id] = g;
      });
    return map;
  }, [companyGroups]);

  const companyName = (id: number) =>
    ctx.companies.find((c) => c.company === id)?.name ?? "";

  const roleLabel =
    roles.find((r) => r.value == ctx.userInfo.role)?.label ?? "";
  const levelLabel =
    ctx.userLevels.find((l) => l.id === ctx.userInfo.user_level)?.name ?? "";

  const rollup = useMemo(() => {
    const byGroup = new Map<number, SelectableStore[]>();
    selectedStores.forEach((s) => {
      const list = byGroup.get(s.base_group) ?? [];
      list.push(s);
      byGroup.set(s.base_group, list);
    });
    return Array.from(byGroup.entries()).map(([groupId, stores]) => ({
      groupId,
      count: stores.length,
      groupName: groupsById[groupId]?.name ?? "",
      companyId: groupsById[groupId]?.company,
    }));
  }, [selectedStores, groupsById]);

  const companyCount = new Set(selectedStores.map((s) => s.company)).size;
  const groupCount = new Set(selectedStores.map((s) => s.base_group)).size;
  const initials = `${ctx.userInfo.first_name?.charAt(0) ?? ""}${ctx.userInfo.last_name?.charAt(0) ?? ""}`;

  return (
    <div className="max-w-[460px]">
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

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <div className="bg-gray-50 rounded-lg py-2.5 text-center">
          <div className="text-[17px] font-medium text-content">
            {companyCount}
          </div>
          <div className="text-[10.5px] text-content/60">Companies</div>
        </div>
        <div className="bg-gray-50 rounded-lg py-2.5 text-center">
          <div className="text-[17px] font-medium text-content">
            {groupCount}
          </div>
          <div className="text-[10.5px] text-content/60">Base groups</div>
        </div>
        <div className="bg-gray-50 rounded-lg py-2.5 text-center">
          <div className="text-[17px] font-medium text-content">
            {selectedStores.length}
          </div>
          <div className="text-[10.5px] text-content/60">Stores</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-content/60">
            Authorization
          </span>
          <button
            onClick={() => onEditStep(1)}
            className="text-[10.5px] text-blue-700 font-medium"
          >
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          <div>
            <div className="text-[10px] text-content/50">Role</div>
            <div className="text-[12px] text-content">{roleLabel}</div>
          </div>
          <div>
            <div className="text-[10px] text-content/50">Level</div>
            <div className="text-[12px] text-content">{levelLabel}</div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-content/60">
            Identity
          </span>
          <button
            onClick={() => onEditStep(1)}
            className="text-[10.5px] text-blue-700 font-medium"
          >
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          <div>
            <div className="text-[10px] text-content/50">Username</div>
            <div className="text-[12px] text-content">
              {ctx.userInfo.username}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-content/50">Email</div>
            <div className="text-[12px] text-content truncate">
              {ctx.userInfo.email}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-content/60">
            Assignments
          </span>
          <button
            onClick={() => onEditStep(2)}
            className="text-[10.5px] text-blue-700 font-medium"
          >
            Edit
          </button>
        </div>
        <div className="max-h-[180px] overflow-y-auto thin-scrollbar">
          {rollup.map((r) => (
            <div
              key={r.groupId}
              className="flex justify-between text-[12px] py-1 border-t border-gray-100"
            >
              <span className="text-content/70">
                {r.groupName}{" "}
                <span className="text-content/40">
                  · {companyName(r.companyId ?? 0)}
                </span>
              </span>
              <span className="text-content">{r.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className={`w-full text-[13px] font-medium py-2.5 rounded-lg text-custom-white ${
            canSubmit
              ? "bg-[#1e2a4a] hover:bg-[#1e2a4a]/85"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Create user
        </button>
        {!canSubmit && (
          <div className="text-[11px] text-red-600 text-center mt-2">
            Finish the User info and Assignments steps before creating this
            user
          </div>
        )}
      </div>
    </div>
  );
};

export default StepReview;
