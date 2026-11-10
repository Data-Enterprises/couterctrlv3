// Interfaces
import type { Store } from "../../../../../interfaces";

/** What one store's call came back with. */
export type StoreOutcome =
  | {
      storeid: number;
      ok: true;
      /** Auto holders of the group. Identical across a fan-out. */
      granted?: number;
      /** Single-store users the server refused to widen. */
      skippedSingleStore?: number;
      /** Grants removed for this store. */
      revoked?: number;
    }
  | { storeid: number; ok: false; reason: string };

export interface MembershipSummary {
  tone: "success" | "error";
  text: string;
  /** Stores whose call came back clean. */
  ok: number;
  failed: number;
}

export type StoreSplit = { assigned: Store[]; unassigned: Store[] };

export type ExportDataset =
  | "assigned"
  | "unassigned"
  | "assignedUsers"
  | "unassignedUsers";
