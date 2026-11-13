// Interfaces

/** The shape this needs off a `User`. */
export interface MemberUser {
  id: number;
  /** Every company the user currently holds. */
  companies: number[];
}

/** One call to make: a user, and the complete list they should end up with. */
export interface CompanyPlan {
  userid: number;
  /** Whole and final — the endpoint replaces with exactly this. */
  companies: number[];
}

export type UserOutcome =
  | { userid: number; ok: true }
  | { userid: number; ok: false; reason: string };

export interface MembershipSummary {
  tone: "success" | "error";
  text: string;
  ok: number;
  failed: number;
}
