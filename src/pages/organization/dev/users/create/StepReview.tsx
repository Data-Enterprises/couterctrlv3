import { useMemo } from "react";
import { InformationCircleIcon } from "@heroicons/react/20/solid";
import type { CompanyBaseGroup, Store } from "../../../../../interfaces";
import { useOrganizationCtx } from "../../hooks";
import {
  effectiveStores,
  modeOf,
  picksInGroup,
  type AccessPicks,
} from "../access/accessSets";
import GrantModeChip from "../access/GrantModeChip";
import type { WizardStep } from "./wizardSteps";

/**
 * What is about to be written, counted.
 *
 * The old wizard's review step showed back the name and email somebody had
 * typed two screens earlier, which is why it was dropped. This one earns the
 * screen by answering the question the form cannot: **how many stores does
 * this add up to, and which of them will keep arriving on their own.**
 *
 * Every section links back to the step that set it. A review you can only
 * leave by the Back button makes somebody walk three screens to change one
 * answer.
 */
const StepReview = ({
  picks,
  companyIds,
  companyGroups,
  groupStores,
  onGoTo,
}: {
  picks: AccessPicks;
  /** The companies that will actually be written — ticked ones plus the one
   *  every held group belongs to. Not `picks.companies`, which counted only
   *  the ticks and read 0 beside a group that plainly had a company. */
  companyIds: number[];
  companyGroups: Record<number, CompanyBaseGroup[]>;
  groupStores: Record<number, Store[]>;
  onGoTo: (step: WizardStep) => void;
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

  const autoGroups = picks.baseGroups.filter(
    (id) => modeOf(picks, id) === "all",
  );
  const fixedGroups = picks.baseGroups.filter(
    (id) => modeOf(picks, id) !== "all",
  );

  /** True while any auto group's roster is still arriving — the count below
   *  would read low, and reading low is worse than reading "…". */
  const rostersPending = autoGroups.some((id) => groupStores[id] === undefined);

  const name = `${info.first_name} ${info.last_name}`.trim() || info.username;
  const initials =
    `${info.first_name?.charAt(0) ?? ""}${info.last_name?.charAt(0) ?? ""}`.toUpperCase();
  const roleLevel = [info.role, ctx.userLevels.find((l) => l.id === info.user_level)?.name]
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

  return (
    <div className="max-w-[1000px] mx-auto">
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

        <Section
          title="Access type"
          onEdit={() => onGoTo("type")}
          empty={picks.baseGroups.length === 0 ? "Nothing picked yet" : null}
        >
          {picks.baseGroups.length > 0 && (
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
        </Section>

        <Section
          title="Base groups"
          onEdit={() => onGoTo("assignments")}
          empty={
            picks.baseGroups.length === 0
              ? "No base groups. This person will not see any stores."
              : null
          }
        >
          {picks.baseGroups.map((id) => {
            const group = groupsById[id];
            const mode = modeOf(picks, id);
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
        </Section>

        <Section
          title="Companies"
          onEdit={() => onGoTo("assignments")}
          empty={companyIds.length === 0 ? "None" : null}
        >
          {companyIds.length > 0 && (
            <Row value={companyIds.map((id) => companyName(id)).join(", ")} />
          )}
        </Section>

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

/** One titled block with its own way back to the step that set it. */
const Section = ({
  title,
  onEdit,
  empty,
  children,
}: {
  title: string;
  onEdit: () => void;
  empty: string | null;
  children?: React.ReactNode;
}) => (
  <div className="flex flex-wrap gap-x-8 gap-y-3 px-5 py-4 border-b border-gray-100">
    <div className="flex-1 min-w-[160px] max-w-[200px]">
      <h3 className="text-[12.5px] font-bold text-content m-0">{title}</h3>
      <button
        onClick={onEdit}
        className="text-[11.5px] font-semibold text-brand_navy hover:underline mt-0.5"
      >
        Edit
      </button>
    </div>
    <div className="flex-[999] min-w-[300px] flex flex-col gap-1.5">
      {empty ? (
        <span className="text-[12.5px] text-content/85">{empty}</span>
      ) : (
        children
      )}
    </div>
  </div>
);

const Row = ({
  label,
  value,
  meta,
  mode,
}: {
  label?: string;
  value: string;
  meta?: string;
  mode?: "all" | "selected";
}) => (
  <div className="flex flex-wrap justify-between items-center gap-2 text-[12.5px] py-0.5">
    <span className="min-w-0">
      {label && <span className="text-content/85">{label} </span>}
      <span className="font-semibold text-content">{value}</span>
    </span>
    {(meta || mode) && (
      <span className="flex items-center gap-2 flex-shrink-0">
        {meta && <span className="text-[11.5px] text-content/85">{meta}</span>}
        {mode && <GrantModeChip mode={mode} />}
      </span>
    )}
  </div>
);

export default StepReview;
