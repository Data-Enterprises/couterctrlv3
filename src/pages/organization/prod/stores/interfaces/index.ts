// Interfaces
import type { SkippedUser } from "../../../../../api/storeAccess";

export interface StoreUserResult {
  changed: number[];
  skipped: SkippedUser[];
}

export interface Summary {
  tone: "success" | "error";
  text: string;
}

export type ExportDataset = "all" | "filtered";
