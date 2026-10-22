import { useMemo } from "react";
import type { User } from "../../../../interfaces";

/**
 * "Show me the people who already hold company X."
 *
 * The same question on all three assign tabs — Companies, Base groups and
 * Stores — because it is the same job each time: a new company, group or
 * store is nearly always staffed from a set that already exists somewhere,
 * and the company is the thing that names that set. Picking twelve people out
 * of four hundred by typing their names is the work this removes.
 *
 * It filters **candidates**, never permissions. Each tab decides who is
 * reachable (its own level guard) and hands this only what the signed-in user
 * may already act on, so nothing here can widen what somebody can see. All it
 * does is hide rows.
 */

/** Holds nothing at all. A string because a select deals in strings, and no
 *  company id can collide with it. */
export const NO_COMPANY = "none";

const companiesOf = (u: User | undefined) => u?.companies ?? [];

/**
 * The companies worth offering, built from the people actually listed.
 *
 * Not from every company on the system: an option that can only ever return
 * an empty column is a dead end, and this list is for finding people rather
 * than for browsing the tenancy.
 *
 * `exclude` drops the company the screen is already about — on the Companies
 * tab every candidate is by definition not in it, so offering it would be a
 * filter that matches nobody.
 *
 * `reach` drops companies the viewer does not administer. A candidate can hold
 * two companies, only one of which is yours — somebody in both Houchens and
 * B and T is yours to work with through Houchens, and listing "B and T (1)"
 * offered a filter for a company the viewer has no business in and named its
 * headcount while doing it. Omit it for a viewer who sees everything; there is
 * nothing to narrow then.
 */
export const useCompanyFilterOptions = (
  users: User[],
  candidateIds: number[],
  exclude?: number,
  reach?: Set<number>,
) =>
  useMemo(() => {
    const byId = new Map(users.map((u) => [u.id, u]));
    const candidates = candidateIds.map((id) => byId.get(id));
    const counts = new Map<number, { name: string; n: number }>();
    let orphans = 0;

    candidates.forEach((u) => {
      const held = companiesOf(u);
      if (held.length === 0) {
        orphans += 1;
        return;
      }
      held.forEach((c) => {
        if (c.company === exclude) return;
        if (reach && !reach.has(c.company)) return;
        const seen = counts.get(c.company);
        if (seen) seen.n += 1;
        else counts.set(c.company, { name: c.name, n: 1 });
      });
    });

    const options = [...counts.entries()]
      .map(([id, { name, n }]) => ({ value: String(id), label: `${name} (${n})` }))
      .sort((a, b) => a.label.localeCompare(b.label));

    // Its own option, because somebody holding nothing is invisible to every
    // other filter here and is exactly who an onboarding pass is looking for.
    // Never dropped by `reach`: an account belonging to nobody is everybody's
    // to pick up.
    return orphans > 0
      ? [{ value: NO_COMPANY, label: `No company (${orphans})` }, ...options]
      : options;
  }, [users, candidateIds, exclude, reach]);

/**
 * The predicate for `AssignPanel`'s `leftPredicate`.
 *
 * Undefined when nothing is selected, which the panel reads as "no narrowing"
 * — rather than a predicate that returns true for everything, so the panel
 * can tell the two apart.
 */
export const useCompanyFilterPredicate = (users: User[], value: string) =>
  useMemo(() => {
    if (!value) return undefined;
    const byId = new Map(users.map((u) => [u.id, u]));
    return (item: { id: number }) => {
      const held = companiesOf(byId.get(item.id));
      return value === NO_COMPANY
        ? held.length === 0
        : held.some((c) => c.company === Number(value));
    };
  }, [users, value]);

