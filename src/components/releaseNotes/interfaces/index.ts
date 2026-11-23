// Interfaces
import type { NoteKind } from "../../../content/releaseNotes";

/** What the chips show: every kind, or one. */
export type Filter = NoteKind | "all";

/** A closing row that stands for several notes, like the smaller fixes. */
export interface SummaryRow {
  page: string;
  text: string;
}
