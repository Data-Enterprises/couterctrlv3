// Utils
import {
  KIND_TITLE,
  type NoteKind,
  type Release,
  type ReleaseNote,
  type SmallerFixes,
} from "../../../content/releaseNotes";

// Interfaces
import type { ComponentType } from "react";
import type { Filter, SummaryRow } from "../interfaces";

// Components
import {
  ArrowUpIcon,
  SparklesIcon,
  WrenchIcon,
} from "@heroicons/react/20/solid";

/** How long the panel takes to slide in or out. */
export const SLIDE_MS = 200;

/**
 * Each kind's icon and tile, so a row says what it is before it is read.
 * Navy only: none of these is a grade, so the severity and delta families
 * stay out of it.
 */
export const KIND_LOOK: Record<
  NoteKind,
  { Icon: ComponentType<{ className?: string }>; tile: string }
> = {
  new: { Icon: SparklesIcon, tile: "bg-brand_navy text-custom-white" },
  improvement: {
    Icon: ArrowUpIcon,
    tile: "bg-brand_navy/[0.08] text-brand_navy",
  },
  fix: { Icon: WrenchIcon, tile: "border border-brand_line text-brand_navy" },
};

/** The chips across the top, All first. */
export const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: KIND_TITLE.new },
  { key: "improvement", label: KIND_TITLE.improvement },
  { key: "fix", label: KIND_TITLE.fix },
];

/** "And 7 smaller fixes." */
export const smallerText = (n: number) =>
  `And ${n} smaller fix${n === 1 ? "" : "es"}.`;

/** A note's page label, saying when the page itself is new. */
export const pageLabel = (n: ReleaseNote) =>
  n.newPage ? `${n.page} · new page` : n.page;

/** The release picker's label for one release. */
export const releaseLabel = (r: Release, latest: boolean) =>
  latest ? `${r.dateText} · Latest` : r.dateText;

/** The Fixes section's closing row: every page's smaller fixes, counted
 *  together. Null when there are none. */
export const smallerRow = (list: SmallerFixes[]): SummaryRow | null => {
  const count = list.reduce((n, s) => n + s.count, 0);
  if (count === 0) return null;
  return {
    page: list.length === 1 ? list[0].page : `${list.length} pages`,
    text: smallerText(count),
  };
};
