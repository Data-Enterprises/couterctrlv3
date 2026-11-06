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
 * Who holds one company.
 *
 * Both columns are built from the users already loaded rather than fetched per
 * company, because `GET users/` returns each user's whole `companies` list —
 * which is also the thing that makes the writes safe. See
 * `companyMembership`: `assign_user_to_company` replaces, so every call has to
 * carry the user's full resulting list, not the one company this screen is
 * about.
 *
 * Users above the acting user's own level are kept out of both columns, the
 * same guard the base group users tab applies. The endpoint takes a bare
 * userid with no level check, so this is the only thing stopping a level 7
 * rearranging a level 9.
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
   * Who this person may move at all.
   *
   * Two guards, and both have to pass: the level one stops a 7 rearranging a
   * 9, and the company one stops a manager at one company handing themselves
   * somebody from another. Before the second, this column listed every user on
   * the system -- a Bruces manager was offered Houchens staff, and the write
   * behind the button would have gone through.
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
   * An email domain actually present in the left column, for the search hint.
   *
   * A made-up example teaches nothing — somebody reads "@example.com", takes
   * it as filler and types a name anyway. Naming the commonest domain in the
   * list they are looking at makes it a thing to try. Falls back to no
   * example when the addresses have nothing in common, which is its own
   * answer: there is no domain worth suggesting.
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
   * Send a plan.
   *
   * One call per user, `allSettled`, because these are independent writes with
   * no transaction around them and the first refusal must not hide the rest.
   * The refetch afterwards means the columns show what the server holds rather
   * than what was asked of it.
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
   * The people as the server holds them now, for the plan. `assign_user_to_
   * company` replaces a person's whole list, so a plan built from the rows on
   * screen would undo a change made since they were read (in another tab, by
   * someone else). Read fresh at the moment of the write.
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
          <span className="text-[11.5px] text-content/85 ml-2">
            {assigned.length} user{assigned.length === 1 ? "" : "s"}
          </span>
        </div>
        <span className="h-4 text-[11px] font-semibold text-content/85">
          {moving ? "Saving…" : ""}
        </span>
      </div>

      <p className="text-[11.5px] text-content/85 leading-snug mb-2 max-w-[680px]">
        A company is the outer boundary of what somebody can see. Base groups
        belong to one, and a person only reaches a group inside a company they
        hold — so taking this away hides their groups in it, and the stores
        those granted.
      </p>

      {/* Says why the left column is short before somebody decides the search
          is broken. Only for people it actually narrows — a programmer sees
          everyone and would read this as a limit that is not there. */}
      {!ctx.canSeeAllCompanies && (
        <p className="text-[11.5px] text-content/85 leading-snug mb-2 max-w-[680px]">
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
        // Assign all and Unassign all take what each column is showing,
        // search included. They used to take the whole list (a legacy
        // parity choice), so one person left by a search still meant all 272.
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
