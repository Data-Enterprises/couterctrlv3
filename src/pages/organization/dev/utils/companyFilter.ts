// Hooks
import { useMemo } from "react";

// Interfaces
import type { User } from "../../../../interfaces";

/**
 * "Show me the people who already hold company X", on all three assign tabs.
 * It filters candidates, never permissions: each tab passes only who the
 * viewer may already act on, so this can only hide rows.
 */

/** Holds nothing at all. A string because a select deals in strings, and no
 *  company id can collide with it. */
export const NO_COMPANY = "none";

const companiesOf = (u: User | undefined) => u?.companies ?? [];

/**
 * The companies worth offering, built from the people listed.
 *
 * `exclude` drops the company the screen is about (no candidate is in it).
 * `reach` drops companies the viewer does not administer: someone in Houchens
 * and B and T is yours through Houchens, but B and T is not yours to filter by.
 * Omit `reach` for a viewer who sees everything.
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

    // Its own option: someone holding nothing is who onboarding looks for, and
    // `reach` never drops them, since an account with no company is anyone's.
    return orphans > 0
      ? [{ value: NO_COMPANY, label: `No company (${orphans})` }, ...options]
      : options;
  }, [users, candidateIds, exclude, reach]);

/**
 * The predicate for `AssignPanel`'s `leftPredicate`. Undefined when nothing is
 * picked, so the panel can tell "no narrowing" from "matches everything".
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

