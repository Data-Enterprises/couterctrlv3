// Hooks
import { useMemo, useState } from "react";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { useBaseGroupsCtx } from "../../hooks";
import { useMarkUsersStale } from "../../utils/usersStale";
import {
  useCompanyFilterOptions,
  useCompanyFilterPredicate,
} from "../../utils/companyFilter";

// API
import { assignUserToCompany, getAllUsers } from "../../../../../api/user";

// Utils
import { canAdministerUser, companyReach } from "../../utils";
import { peopleConfirm } from "../../utils/bulkConfirm";
import { planAdd, planRemove, summarize } from "../utils";

// Interfaces
import type { CompanyPlan, MemberUser, UserOutcome } from "../interfaces";
import type { JsonError, User } from "../../../../../interfaces";

// Components
import AssignPanel from "../../../../../components-dev/AssignPanel";
import CompanyFilterSelect from "../../components/CompanyFilterSelect";

/**
 * Who holds one company, built from the users already loaded: each carries its
 * whole `companies` list, which every write must send (`assign_user_to_company`
 * replaces; see `companies/utils`). Users above the acting level are kept off
 * both columns: the endpoint checks no levels.
 */
const CompanyUsersPanel = ({
  company,
  users,
  onChanged,
}: {
  company: { id: number; name: string };
  users: User[];
  /** Re-read the users, so both columns show what the server now holds. */
  onChanged: () => void;
}) => {
  const ctx = useBaseGroupsCtx();
  const toast = useToast();
  const markUsersStale = useMarkUsersStale();
  const [moving, setMoving] = useState(false);
  /** Narrows the left column to people who already hold another company —
   *  empty means no narrowing. See `companyOptions`. */
  const [heldFilter, setHeldFilter] = useState("");

  /** The families the viewer administers through, read from each of their
   *  companies' `parent_company_id`. */
  const reach = useMemo(
    () => companyReach(ctx.ownMemberships),
    [ctx.ownMemberships],
  );

  /**
   * Who this person may move at all. Both guards must pass: level (a 7 can't
   * move a 9) and company reach (`mayAdminister`).
   */
  const reachable = useMemo(
    () =>
      users.filter(
        (u) =>
          u.user_level <= ctx.userLevel &&
          canAdministerUser(u.companies ?? [], reach, ctx.canSeeAllCompanies),
      ),
    [users, ctx.userLevel, reach, ctx.canSeeAllCompanies],
  );

  /** `UserCompany.company` is the company id; `.id` is the link row, which is
   *  a different number and the one easy to grab by mistake. */
  const asMember = (u: User): MemberUser => ({
    id: u.id,
    companies: (u.companies ?? []).map((c) => c.company),
  });

  const holds = (u: User) =>
    (u.companies ?? []).some((c) => c.company === company.id);

  const assigned = reachable.filter(holds);
  const unassigned = reachable.filter((u) => !holds(u));

  const byId = useMemo(
    () => new Map(reachable.map((u) => [u.id, u])),
    [reachable],
  );

  /**
   * The commonest email domain in the left column, for the search hint; none
   * when the addresses share nothing.
   */
  const commonDomain = useMemo(() => {
    const counts = new Map<string, number>();
    unassigned.forEach((u) => {
      const at = (u.email ?? "").lastIndexOf("@");
      if (at < 0) return;
      const domain = u.email.slice(at).toLowerCase();
      counts.set(domain, (counts.get(domain) ?? 0) + 1);
    });
    const best = [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )[0];
    // One lone address proves nothing about the list; two is a pattern.
    return best && best[1] > 1 ? best[0] : null;
  }, [unassigned]);

  const unassignedIds = useMemo(() => unassigned.map((u) => u.id), [unassigned]);
  const companyOptions = useCompanyFilterOptions(
    reachable,
    unassignedIds,
    company.id,
    // Undefined for somebody who sees everything, so the list stays whole for
    // them rather than being narrowed by companies they happen to hold.
    ctx.canSeeAllCompanies ? undefined : reach,
  );
  const heldPredicate = useCompanyFilterPredicate(reachable, heldFilter);

  /**
   * Send a plan: one call per user, `allSettled` so one refusal can't hide the
   * rest, then refetch so the columns show what the server holds.
   */
  const run = async (plans: CompanyPlan[], direction: "in" | "out") => {
    if (plans.length === 0) {
      toast.success(summarize([], company.name, direction).text);
      return;
    }
    setMoving(true);

    const settled = await Promise.allSettled(
      plans.map((p) =>
        assignUserToCompany(ctx.url, ctx.token, p.userid, p.companies),
      ),
    );

    const outcomes: UserOutcome[] = settled.map((res, i) => {
      const userid = plans[i].userid;
      if (res.status === "rejected") {
        return {
          userid,
          ok: false,
          reason: (res.reason as JsonError).message ?? "The server refused it.",
        };
      }
      const j = res.value.data;
      return j.error === 0
        ? { userid, ok: true }
        : { userid, ok: false, reason: j.msg ?? "The server refused it." };
    });

    const summary = summarize(outcomes, company.name, direction);
    setMoving(false);
    onChanged();
    markUsersStale();
    if (summary.tone === "success") toast.success(summary.text);
    else toast.error(summary.text);
  };

  /**
   * The people as the server holds them now, read fresh at the moment of the
   * write: `assign_user_to_company` replaces a person's whole list, so a plan
   * from stale rows could undo someone else's change.
   */
  const freshMembers = async (ids: number[]) => {
    const resp = await getAllUsers(ctx.url, ctx.token);
    const j = resp.data;
    if (j.error !== 0) throw new Error(j.msg || "Could not re-read the users");
    const fresh = new Map(((j.users ?? []) as User[]).map((u) => [u.id, u]));
    // Only people this viewer may administer, as the columns are.
    return ids
      .filter((id) => byId.has(id))
      .map((id) => fresh.get(id))
      .filter((u): u is User => u !== undefined)
      .map(asMember);
  };

  const planFresh = async (
    ids: number[],
    plan: (members: MemberUser[]) => CompanyPlan[],
    direction: "in" | "out",
  ) => {
    setMoving(true);
    try {
      await run(plan(await freshMembers(ids)), direction);
    } catch (err) {
      toast.error((err as JsonError).message);
    } finally {
      // run() returns early on an empty plan without clearing it.
      setMoving(false);
    }
  };

  const handleAssign = (ids: number[]) =>
    void planFresh(ids, (m) => planAdd(m, company.id), "in");

  const handleUnassign = (ids: number[]) =>
    void planFresh(ids, (m) => planRemove(m, company.id), "out");

  const toItem = (u: User) => ({
    id: u.id,
    label: u.username,
    sublabel: u.email || undefined,
  });

  return (
    <div className="w-full" data-help="companies">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div>
          <span className="text-[15px] font-semibold text-content">
            {company.name}
          </span>
          <span className="text-[11.5px] text-content/95 ml-2">
            {assigned.length} user{assigned.length === 1 ? "" : "s"}
          </span>
        </div>
        <span className="h-4 text-[11px] font-semibold text-content/95">
          {moving ? "Saving…" : ""}
        </span>
      </div>

      <p className="text-[11.5px] text-content/95 leading-snug mb-2 max-w-[680px]">
        A company is the outer boundary of what somebody can see. Base groups
        belong to one, and a person only reaches a group inside a company they
        hold — so taking this away hides their groups in it, and the stores
        those granted.
      </p>

      {/* Says why the left column is short, for those it narrows (not
          programmers, who see everyone). */}
      {!ctx.canSeeAllCompanies && (
        <p className="text-[11.5px] text-content/95 leading-snug mb-2 max-w-[680px]">
          You can add people from{" "}
          <span className="font-semibold">your own companies</span> and people
          who hold no company yet. Somebody in a company you do not hold has to
          be added by an administrator there.
        </p>
      )}

      <AssignPanel
        leftTitle="Not in this company"
        rightTitle="In this company"
        leftItems={unassigned.map(toItem)}
        rightItems={assigned.map(toItem)}
        onAssign={handleAssign}
        onUnassign={handleUnassign}
        // Assign all and Unassign all take what each column shows, search
        // included.
        moving={moving}
        confirmBulk={(direction, ids) =>
          peopleConfirm({ direction, ids, me: ctx.userid, what: company.name, always: true })
        }
        leftPredicate={heldPredicate}
        searchHint={
          <>
            Searches usernames <span className="font-semibold">and emails</span>
            {commonDomain ? (
              <>
                {" "}
                — type{" "}
                <span className="font-semibold text-content">
                  {commonDomain}
                </span>{" "}
                to pull back everyone on it.
              </>
            ) : (
              "."
            )}
          </>
        }
        leftFilters={
          <CompanyFilterSelect
            value={heldFilter}
            onChange={setHeldFilter}
            options={companyOptions}
          />
        }
      />
    </div>
  );
};

export default CompanyUsersPanel;
