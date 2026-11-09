// Hooks
import { useMemo } from "react";
import { useOrganizationCtx } from "../../../hooks";

// Utils
import { roles } from "../../utils/roles";
import { effectiveStores, picksInGroup, heldGroupIds } from "../../utils";

// Interfaces
import type { AccessPicks } from "../../interfaces";
import type { WizardStep } from "../interfaces";
import type {
  BaseGroup,
  CompanyBaseGroup,
  GrantMode,
  Store,
} from "../../../../../../interfaces";

// Components
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/20/solid";
import ReviewSection from "./ReviewSection";
import Row from "./Row";

/**
 * What is about to be written, counted: how many stores it adds up to, and
 * which will keep arriving on their own. Every section links back to the step
 * that set it.
 */
const StepReview = ({
  picks,
  companyIds,
  companyGroups,
  groupStores,
  onGoTo,
  modeBefore,
  typeUnset = false,
  heldGroups = [],
}: {
  picks: AccessPicks;
  /** The companies actually written: ticked ones plus each held group's
   *  company. */
  companyIds: number[];
  companyGroups: Record<number, CompanyBaseGroup[]>;
  groupStores: Record<number, Store[]>;
  onGoTo: (step: WizardStep) => void;
  /**
   * Edit only: how the person held their groups before. When it differs from
   * `picks.mode`, the save rewrites every group they hold, and this says so.
   */
  modeBefore?: GrantMode;
  /** Edit only: the person had no access type on file, so this save sets it. */
  typeUnset?: boolean;
  /** Edit: the groups the person already holds, so a group whose company was
   *  never opened on Assignments is named rather than read "Group 66". */
  heldGroups?: BaseGroup[];
}) => {
  const ctx = useOrganizationCtx();
  const info = ctx.userInfo;

  const groupsById = useMemo(() => {
    const map: Record<number, CompanyBaseGroup> = {};
    Object.values(companyGroups)
      .flat()
      .forEach((g) => {
        map[g.id] = g;
      });
    return map;
  }, [companyGroups]);

  const companyName = (id: number) => {
    const fromAll = ctx.allCompanies.find((c) => c.id === id);
    if (fromAll) return fromAll.name;
    return ctx.companies.find((c) => c.company === id)?.name ?? `#${id}`;
  };

  const effective = useMemo(
    () => effectiveStores(picks, groupStores),
    [picks, groupStores],
  );

  // What Create saves: ticked groups plus any a ticked store implies.
  const held = heldGroupIds(picks);
  // One mode for the person, so every held group lands in one of these.
  const autoGroups = picks.mode === "all" ? held : [];
  const fixedGroups = picks.mode === "all" ? [] : held;

  /** True while any auto group's roster is still arriving — the count below
   *  would read low, and reading low is worse than reading "…". */
  const rostersPending = autoGroups.some((id) => groupStores[id] === undefined);

  const name = `${info.first_name} ${info.last_name}`.trim() || info.username;
  const initials =
    `${info.first_name?.charAt(0) ?? ""}${info.last_name?.charAt(0) ?? ""}`.toUpperCase();
  // `role` is stored as its option value ("1"), so read it back through the
  // picker's own list.
  const roleName =
    roles.find((r) => r.value === String(info.role))?.label ?? info.role;
  const roleLevel = [roleName, ctx.userLevels.find((l) => l.id === info.user_level)?.name]
    .filter(Boolean)
    .join(" · ");

  const stats = [
    { value: String(companyIds.length), label: "Companies" },
    { value: String(autoGroups.length), label: "Groups (auto)" },
    { value: String(fixedGroups.length), label: "Groups (fixed)" },
    {
      value: rostersPending ? "…" : String(effective.length),
      label: "Stores today",
    },
  ];

  const typeChanged =
    modeBefore !== undefined && modeBefore !== picks.mode && held.length > 0;
  const typeName = (m: GrantMode) => (m === "all" ? "By group" : "By store");

  return (
    <div className="max-w-[1000px] mx-auto">
      {typeUnset && held.length > 0 && (
        <div className="flex gap-2.5 items-start mb-3 px-3.5 py-3 rounded-lg bg-filter_active border border-filter_active_border">
          <InformationCircleIcon className="w-[18px] h-[18px] text-brand_navy flex-shrink-0 mt-px" />
          <span className="text-[12px] text-content leading-snug">
            <span className="font-semibold">
              Sets access type to {picks.mode === "all" ? "By group" : "By store"}.
            </span>{" "}
            This user had none on file. Saving writes all {held.length} base
            group{held.length === 1 ? "" : "s"} they hold that way.
          </span>
        </div>
      )}
      {typeChanged && (
        <div className="flex gap-2.5 items-start mb-3 px-3.5 py-3 rounded-lg bg-filter_active border border-filter_active_border">
          <ExclamationTriangleIcon className="w-[18px] h-[18px] text-brand_navy flex-shrink-0 mt-px" />
          <span className="text-[12px] text-content leading-snug">
            <span className="font-semibold">
              Access type changes from {typeName(modeBefore)} to{" "}
              {typeName(picks.mode)}.
            </span>{" "}
            Saving rewrites all {held.length} base group
            {held.length === 1 ? "" : "s"} this person holds.{" "}
            {picks.mode === "all"
              ? "They will get every store in each group, and any store added to one later."
              : "They will keep only the stores ticked on the Assignments step, and stores added to a group later will not reach them."}
          </span>
        </div>
      )}
      <div className="bg-custom-white rounded-lg shadow-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-5 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-full bg-brand_navy text-custom-white flex items-center justify-center text-[15px] font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[17px] font-bold text-content">
                  {name}
                </span>
                {roleLevel && (
                  <span className="text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full bg-filter_active text-brand_navy">
                    {roleLevel}
                  </span>
                )}
              </div>
              <div className="text-[12px] text-content/85 mt-0.5 truncate">
                {info.username}
                {info.email ? ` · ${info.email}` : ""}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 min-w-[300px] max-w-[520px]">
            {stats.map((s) => (
              <div key={s.label} className="bg-bkg rounded-lg px-3 py-2">
                <div className="text-[19px] font-bold text-content tabular-nums leading-tight">
                  {s.value}
                </div>
                <div className="text-[11px] text-content/85">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <ReviewSection
          title="Access type"
          onEdit={() => onGoTo("type")}
          empty={held.length === 0 ? "Nothing picked yet" : null}
        >
          {held.length > 0 && (
            <Row
              value={autoGroups.length > 0 ? "By group" : "By store"}
              meta={
                autoGroups.length > 0
                  ? "New stores show up automatically"
                  : "New stores must be added by hand"
              }
              mode={autoGroups.length > 0 ? "all" : "selected"}
            />
          )}
        </ReviewSection>

        <ReviewSection
          title="Base groups"
          onEdit={() => onGoTo("assignments")}
          empty={
            held.length === 0
              ? "No base groups. This person will not see any stores."
              : null
          }
        >
          {held.map((id) => {
            const group = groupsById[id] ?? heldGroups.find((g) => g.id === id);
            const mode = picks.mode;
            const total = groupStores[id]?.length;
            const count = mode === "all" ? total : picksInGroup(picks, id).length;
            return (
              <Row
                key={id}
                label={`${companyName(group?.company ?? 0)} ·`}
                value={group?.name ?? `Group ${id}`}
                meta={count === undefined ? "…" : `${count} stores`}
                mode={mode}
              />
            );
          })}
        </ReviewSection>

        <ReviewSection
          title="Companies"
          onEdit={() => onGoTo("assignments")}
          empty={companyIds.length === 0 ? "None" : null}
        >
          {companyIds.length > 0 && (
            <Row value={companyIds.map((id) => companyName(id)).join(", ")} />
          )}
        </ReviewSection>

        {autoGroups.length > 0 && (
          <div className="flex gap-2.5 items-start m-5 px-3.5 py-3 rounded-lg bg-filter_active">
            <InformationCircleIcon className="w-[18px] h-[18px] text-brand_navy flex-shrink-0 mt-px" />
            <span className="text-[12px] text-content leading-snug">
              {autoGroups.length === 1
                ? `${groupsById[autoGroups[0]]?.name ?? "One group"} is`
                : `${autoGroups.length} groups are`}{" "}
              held automatically. Stores added to{" "}
              {autoGroups.length === 1 ? "it" : "them"} later will appear for
              this user without anyone coming back here.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepReview;
