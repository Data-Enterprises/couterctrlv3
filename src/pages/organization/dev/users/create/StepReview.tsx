import { useMemo } from "react";
import type { CompanyBaseGroup, Store } from "../../../../../interfaces";
import { useOrganizationCtx } from "../../hooks";
import {
  effectiveStores,
  modeOf,
  picksInGroup,
  type AccessPicks,
} from "../access/accessSets";
import GrantModeChip from "../access/GrantModeChip";

/**
 * What is about to be written, counted.
 *
 * The old wizard's review step showed back the name and email somebody had
 * typed two screens earlier, which is why it was dropped. This one earns the
 * screen by answering the question the form cannot: **how many stores does
 * this add up to, and which of them will keep arriving on their own.**
 *
 * `Effective today` is deliberately hedged in its own label. A group held as
 * `auto` has no fixed answer — the number is what the group contains right
 * now, and the point of holding it that way is that the number will change.
 */
const StepReview = ({
  picks,
  companyIds,
  companyGroups,
  groupStores,
}: {
  picks: AccessPicks;
  /** The companies that will actually be written — ticked ones plus the one
   *  every held group belongs to. Not `picks.companies`, which counted only
   *  the ticks and read 0 beside a group that plainly had a company. */
  companyIds: number[];
  companyGroups: Record<number, CompanyBaseGroup[]>;
  groupStores: Record<number, Store[]>;
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
  const rostersPending = autoGroups.some(
    (id) => groupStores[id] === undefined,
  );

  const name = `${info.first_name} ${info.last_name}`.trim() || info.username;

  const stats: { value: string; label: string }[] = [
    { value: String(companyIds.length), label: "Companies" },
    { value: String(autoGroups.length), label: "Groups (auto)" },
    { value: String(fixedGroups.length), label: "Groups (fixed)" },
    {
      value: rostersPending ? "…" : String(effective.length),
      label: "Effective today",
    },
  ];

  return (
    <div className="max-w-[640px]">
      <div className="bg-custom-white rounded-lg shadow-card px-5 py-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-semibold text-content">{name}</span>
          {info.role && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-filter_active text-brand_navy">
              {info.role}
            </span>
          )}
        </div>
        <div className="text-[12px] text-content/85 mt-0.5">
          {info.username}
          {info.email ? ` · ${info.email}` : ""}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-bkg rounded-lg shadow-card-sm px-3 py-2 text-center"
            >
              <div className="text-[19px] font-bold text-content tabular-nums leading-tight">
                {s.value}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[9px] font-bold uppercase tracking-wide text-content mt-3 mb-1.5">
        Base group access
      </div>
      {picks.baseGroups.length === 0 ? (
        <div className="bg-custom-white rounded-lg shadow-card px-5 py-4 text-[12px] text-content/85">
          No base groups. This person will not see any stores.
        </div>
      ) : (
        <div className="bg-custom-white rounded-lg shadow-card divide-y divide-brand_navy/15 overflow-hidden">
          {picks.baseGroups.map((id) => {
            const group = groupsById[id];
            const mode = modeOf(picks, id);
            const total = groupStores[id]?.length;
            const count =
              mode === "all" ? total : picksInGroup(picks, id).length;
            return (
              <div
                key={id}
                className="flex items-center justify-between gap-2 px-5 py-2.5"
              >
                <span className="text-[12.5px] text-content truncate">
                  <span className="text-content/85">
                    {companyName(group?.company ?? 0)} ·{" "}
                  </span>
                  <span className="font-semibold">
                    {group?.name ?? `Group ${id}`}
                  </span>
                </span>
                <span className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11.5px] text-content/85 tabular-nums">
                    {count === undefined ? "…" : `${count} stores`}
                  </span>
                  <GrantModeChip mode={mode} />
                </span>
              </div>
            );
          })}
        </div>
      )}

      {companyIds.length > 0 && (
        <>
          <div className="text-[9px] font-bold uppercase tracking-wide text-content mt-3 mb-1.5">
            Companies
          </div>
          <div className="bg-custom-white rounded-lg shadow-card px-5 py-3 text-[12px] text-content">
            {companyIds.map((id) => companyName(id)).join(", ")}
          </div>
        </>
      )}

      {autoGroups.length > 0 && (
        <p className="text-[11.5px] text-content/85 leading-snug mt-3">
          {autoGroups.length === 1 ? "One group is" : `${autoGroups.length} groups are`}{" "}
          held automatically, so stores added to{" "}
          {autoGroups.length === 1 ? "it" : "them"} later will appear for this
          person without anyone coming back here.
        </p>
      )}
    </div>
  );
};

export default StepReview;
