// Interfaces

/**
 * What Assign all and Unassign all ask before they act, on the Companies,
 * Stores and Base Groups tabs. Neither asked: Unassign all on Companies took
 * the company off everyone, the person pressing it included, in one click.
 *
 * Unassign all always asks. Assign all asks above a handful, where a slip
 * would be a lot to undo. The count is named, and so is the person pressing
 * it when they are in the list.
 */
export interface BulkConfirm {
  message: string;
  confirmLabel: string;
}

/**
 * A company as a membership row carries it: its id, and what it belongs under.
 *
 * `UserCompany` has both, on the signed-in user (from the sign-in response)
 * and on every user `users/` returns.
 */
export interface CompanyRef {
  company: number;
  parent_company_id?: number | null;
}

/**
 * A size the content asks the page panel for.
 *
 * `height: "auto"` means "as tall as what is in me" — the panel stops being a
 * box with a drag handle and becomes a card around a form. A number means the
 * content needs room it cannot derive, which is the three-column picker: its
 * columns scroll independently, so they have no natural height at all and an
 * auto one would collapse them to nothing.
 */
export interface PanelFit {
  width: number;
  height: number | "auto";
}

/** The users grid's sortable columns. */
export type UserSortKey = "first" | "last" | "role" | "level" | "access" | "visited";

export interface UserSort {
  key: UserSortKey;
  desc: boolean;
}

export type ExportDataset = "all" | "filtered";

export type Tab = "users" | "companies" | "baseGroups" | "stores";
