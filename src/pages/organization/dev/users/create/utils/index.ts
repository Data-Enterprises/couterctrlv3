// Interfaces
import type { WizardStep } from "../interfaces";
import type { GrantMode } from "../../../../../../interfaces";
import type { PanelFit } from "../../../interfaces";

export const STEP_ORDER: WizardStep[] = [
  "identity",
  "type",
  "assignments",
  "review",
];

export const STEP_TITLE: Record<WizardStep, string> = {
  identity: "User info",
  type: "Access type",
  assignments: "Assignments",
  review: "Review",
};

/** The two access types' cards: By group and By store. */
export const OPTIONS: {
  mode: GrantMode;
  title: string;
  desc: string;
  newStores: string;
  pick: string;
  best: string;
}[] = [
  {
    mode: "all",
    title: "By group",
    desc: "They see every store in the base groups you pick.",
    newStores: "Show up automatically",
    pick: "Base groups",
    best: "Managers, buyers, corporate",
  },
  {
    mode: "selected",
    title: "By store",
    desc: "They see only the stores you pick, nothing more.",
    newStores: "Must be added by hand",
    pick: "Individual stores",
    best: "Single store, small multi-store",
  },
];

/** The wizard's remaining steps, shown beside the user fields. */
export const nextUp = (editing: boolean) => [
  { t: "Access type", d: "by group or by store" },
  { t: "Assignments", d: "pick groups or stores" },
  { t: "Review", d: editing ? "check and save" : "check and create" },
];

/**
 * The panel size for each step. Every step gets a real height, not `auto`: with
 * the viewport cap, `auto` never forms a scroll container, so tall steps clipped.
 * Widths are what each step needs.
 */
export const STEP_FIT: Record<WizardStep, PanelFit> = {
  identity: { width: 1180, height: 680 },
  // 680, like User info: at 560 its two cards scrolled in a short box.
  type: { width: 1020, height: 680 },
  assignments: { width: 1360, height: 700 },
  review: { width: 1100, height: 700 },
};

/**
 * The single-store role as the form holds it: `role` is the option value from
 * `roles` stored as a number, and `1` is Single Store, the server's
 * `SINGLE_STORE_ROLE`.
 */
export const isSingleStoreRole = (role: unknown) => Number(role) === 1;

/** The identity fields `update_user` writes, for telling whether any moved. */
export const identityOf = (info: {
  first_name: string;
  last_name: string;
  email: string;
  role: number | string;
  user_level: number;
}) =>
  [info.first_name, info.last_name, info.email, String(info.role), info.user_level].join(
    "\u0000",
  );
