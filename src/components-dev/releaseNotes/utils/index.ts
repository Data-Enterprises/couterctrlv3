// Interfaces
import type { SectionKey } from "../interfaces";
import type { ComponentType } from "react";
import type { Release } from "../../../content/releaseNotes";

// Components
import {
  ArrowUpCircleIcon,
  GlobeAltIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/20/solid";

/**
 * How each section reads at a glance: an icon and a tint, so the four can be
 * told apart before a word is read. Brand and filter tints only — none of these
 * is a grade, so the severity and delta families stay out of it.
 */
export const LOOK: Record<
  SectionKey,
  { Icon: ComponentType<{ className?: string }>; tile: string; chip: string }
> = {
  platform: {
    Icon: GlobeAltIcon,
    tile: "bg-brand_navy text-custom-white",
    chip: "bg-row_selected text-content",
  },
  nowAvailable: {
    Icon: SparklesIcon,
    tile: "bg-brand_green_tint text-brand_green_darker",
    chip: "bg-brand_green_tint text-brand_green_darker",
  },
  updates: {
    Icon: ArrowUpCircleIcon,
    tile: "bg-filter_active text-brand_navy_hover",
    chip: "bg-filter_active text-brand_navy_hover",
  },
  fixes: {
    Icon: WrenchScrewdriverIcon,
    tile: "bg-row_selected text-brand_slate",
    chip: "bg-row_selected text-content",
  },
};

/** Short month names, for the rail's dates. */
export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "Nov 2" and "2026" for the rail, from the string rather than a `Date`. */
export const railDate = (date: string) => {
  const [y, m, d] = date.split("-");
  return { day: `${MONTHS[Number(m) - 1] ?? m} ${Number(d)}`, year: y };
};

/** How many things a section holds: pages for the page sections, bullets
 *  for Platform Updates, which has no pages. */
export const countOf = (release: Release, key: SectionKey) =>
  key === "platform" ? release.platform.length : release[key].length;
