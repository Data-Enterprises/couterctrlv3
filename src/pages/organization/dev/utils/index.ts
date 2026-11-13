// Utils
import { isSupportUser } from "../../../../utils/supportUsers";
import { roles } from "../users/utils/roles";
import { accessLabel } from "./userFilters";
import { rowsToCsv } from "../../../../utils/csvExport";

// Interfaces
import type { CompanyRef, PanelFit, Tab } from "../interfaces";
import type { BaseGroup, User, UserLevel } from "../../../../interfaces";

/**
 * Who sees past their own assignments: level 9, or DCR support. A programmer
 * sets up tenancies they hold none of; support fields calls about stores they
 * are never assigned (see `utils/supportUsers`).
 */
export const seesEverything = (userLevel: number, email: string) =>
  userLevel === 9 || isSupportUser(email);

/**
 * Which family a company is in: its parent's id, or its own when it has none,
 * the backend's `coalesce(parent_company_id, id)`. Houchens (1), Food Giant (4),
 * Sonic (6), Ace (17) and Brooks (21) are family 1; everyone else stands alone.
 * DCR (5) is not in it. A missing `parent_company_id` reads as standing alone.
 */
export const familyOf = (c: CompanyRef): number => c.parent_company_id ?? c.company;

/**
 * The families the viewer administers through: holding Food Giant reaches
 * Sonic (both family 1); holding Bruces reaches Bruces.
 */
export const companyReach = (viewerCompanies: CompanyRef[]): Set<number> =>
  new Set(viewerCompanies.map(familyOf));

/**
 * Whether the signed-in user may administer this person at all. The server's
 * `assign_user_to_company` takes a bare userid with no ownership check, so
 * this gate is what stops someone moving people out of another company.
 *
 * Three ways in, and no others:
 *
 *  - **Sees everything.** Level 9 and DCR support (`seesEverything`).
 *  - **Holds no company.** A new account is anyone's to onboard.
 *  - **Is inside the viewer's reach.** In a family one of the viewer's
 *    companies is in (`companyReach`), not just the company on screen.
 *
 * The level guard (`user_level <= ctx.userLevel`) still applies; both must pass.
 * Only the candidate list is narrowed: people already in the company are in reach.
 */
export const canAdministerUser = (
  candidateCompanies: CompanyRef[],
  reach: Set<number>,
  canSeeAll: boolean,
): boolean => {
  if (canSeeAll) return true;
  if (candidateCompanies.length === 0) return true;
  return candidateCompanies.some((c) => reach.has(familyOf(c)));
};

/**
 * The base groups somebody may administer: the ones they hold (`active`),
 * not every group in their companies. Holding the company is not enough;
 * anything else lets someone grant access they don't have.
 */
export const heldGroupIds = (rows: BaseGroup[]): Set<number> =>
  new Set(rows.filter((g) => g.active === 1).map((g) => g.id));

/**
 * Companies worth listing: those with at least one group on offer, from the
 * same rows (each carries its `company`).
 */
export const companiesWithHeldGroups = (rows: BaseGroup[]): Set<number> =>
  new Set(rows.filter((g) => g.active === 1).map((g) => g.company));

/**
 * Narrow a company's groups to the ones on offer. `canSeeAll` short-circuits,
 * so a programmer sees every group even before `held` has loaded.
 */
export const visibleGroups = <T extends { id: number }>(
  groups: T[],
  canSeeAll: boolean,
  held: Set<number>,
): T[] => (canSeeAll ? groups : groups.filter((g) => held.has(g.id)));

/**
 * Narrow a list of companies the same way. Nothing held and not `canSeeAll`
 * gives an empty list: no base groups, none to administer.
 */
export const visibleCompanyList = <T extends { id: number }>(
  companies: T[],
  canSeeAll: boolean,
  withHeld: Set<number>,
): T[] =>
  canSeeAll ? companies : companies.filter((c) => withHeld.has(c.id));

/**
 * The groups the Add/Edit wizard lists for a company, by the Base Groups tab's
 * rule: everything for someone who sees everything, else the groups the editor
 * holds. A group the edited person already holds is always listed; `mayChange`
 * says whether the editor may touch it (read-only when not).
 */
export const wizardGroups = <T extends { id: number }>(
  groups: T[],
  canSeeAll: boolean,
  editorHeld: Set<number>,
  personHeld: Set<number>,
): T[] =>
  canSeeAll
    ? groups
    : groups.filter((g) => editorHeld.has(g.id) || personHeld.has(g.id));

/** Whether the editor may give or take this group. */
export const mayChangeGroup = (
  id: number,
  canSeeAll: boolean,
  editorHeld: Set<number>,
): boolean => canSeeAll || editorHeld.has(id);

/** A yyyy-mm-dd date as mm/dd/yyyy, or N/A when missing. */
export const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  const split = dateStr.split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};

/** The users export as CSV, roles named. */
export const buildUsersCsv = (
  users: User[],
  userLevels: UserLevel[],
  label: string,
) => {
  const renderRoleText = (role: number | null) =>
    roles.find((r) => r.value == role)?.label ?? "";
  const renderLvlText = (lvl: number) =>
    userLevels.find((l) => l.id === lvl)?.name ?? "N/A";

  const headers = [
    "Username",
    "First name",
    "Last name",
    "Email",
    "Role",
    "Level",
    "Access",
    "Last visited",
  ];
  const rows = users.map((u) => [
    u.username,
    u.first_name || "",
    u.last_name || "",
    u.email ?? "",
    renderRoleText(u.role),
    renderLvlText(u.user_level),
    accessLabel(u.access_mode),
    formatDate(u.last_visit),
  ]);
  return `${label}\n${rowsToCsv(headers, rows)}`;
};

/**
 * Owner: who may see what is an administrator's job, not a manager's.
 * Levels run 1 basic, 2 user, 5 manager, 7 owner, 9 programmer.
 */
export const OWNER_LEVEL = 7;

/**
 * Each tab's size until its content asks otherwise (`usePanelFit`). Heights
 * are explicit: every tab scrolls inside, so `auto` would collapse it.
 */
export const TAB_FIT: Record<Tab, PanelFit> = {
  users: { width: 1200, height: 660 },
  companies: { width: 1320, height: 660 },
  baseGroups: { width: 1320, height: 660 },
  stores: { width: 1320, height: 660 },
};

/**
 * The tabs, in order, and the lowest level that sees each (`null` is everyone).
 *
 * - Users: managers and up.
 * - Companies, Base Groups and Stores: owners and up.
 *
 * Below level 5 there is no tab, and the page says so (an address still reaches it).
 */
export const TABS: { id: Tab; label: string; minLevel: number | null }[] = [
  { id: "users", label: "Users", minLevel: 5 },
  // Owner and up for all three. Companies comes first: it is the outer
  // boundary, since a group only reaches people who hold its company.
  { id: "companies", label: "Companies", minLevel: OWNER_LEVEL },
  { id: "baseGroups", label: "Base Groups", minLevel: OWNER_LEVEL },
  { id: "stores", label: "Stores", minLevel: OWNER_LEVEL },
];
