// Interfaces

/**
 * What Assign all and Unassign all ask before acting, on the Companies, Stores
 * and Base Groups tabs. Unassign all always asks; Assign all asks above a
 * handful. The count is named, and so is the presser when they are in the list.
 */
export interface BulkConfirm {
  message: string;
  confirmLabel: string;
}

/**
 * A company as a membership row carries it: its id and its parent. `UserCompany`
 * has both, on the signed-in user and on every user `users/` returns.
 */
export interface CompanyRef {
  company: number;
  parent_company_id?: number | null;
}

/**
 * A size the content asks the page panel for. `height: "auto"` hugs the content;
 * a number is for content with no natural height (the three-column picker,
 * whose columns scroll on their own).
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
