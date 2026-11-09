// Interfaces
import type {
  Direction,
  StatusPhrase,
  StatusTone,
  Trajectory,
} from "../interfaces";

// The same flat band SalesCompKpis uses for up/flat/down, so both agree on
// what counts as a real move.
const FLAT_THRESHOLD = 1;

function classifyDirection(pct: number): Direction {
  return pct > FLAT_THRESHOLD ? "up" : pct < -FLAT_THRESHOLD ? "down" : "flat";
}

function classifyTrajectory(pct: number): Trajectory {
  return pct > FLAT_THRESHOLD ? "improving" : pct < -FLAT_THRESHOLD ? "declining" : "flat";
}

const MATRIX: Record<Direction, Record<Trajectory, string>> = {
  up: {
    improving: "Up, and climbing",
    flat: "Up, holding steady",
    declining: "Up, but cooling off",
  },
  flat: {
    improving: "Flat, but picking up",
    flat: "Holding steady",
    declining: "Flat, starting to slip",
  },
  down: {
    improving: "Down, but recovering",
    flat: "Down, holding",
    declining: "Down, and slipping further",
  },
};

// Combines vs-LY direction and week-over-week trajectory into one verdict for
// the left list, since they can disagree (down for the year, improving lately).
export function getStatusPhrase(vsLYPct: number | null, wowPct: number | null): StatusPhrase {
  if (vsLYPct === null && wowPct === null) {
    return { text: "Not enough data yet", tone: "muted" };
  }

  if (vsLYPct === null) {
    if (wowPct! > FLAT_THRESHOLD) return { text: "New item, trending up", tone: "up" };
    if (wowPct! < -FLAT_THRESHOLD) return { text: "New item, trending down", tone: "down" };
    return { text: "New item, steady", tone: "flat" };
  }

  const lyDir = classifyDirection(vsLYPct);

  if (wowPct === null) {
    if (lyDir === "up") return { text: "Up vs last year", tone: "up" };
    if (lyDir === "down") return { text: "Down vs last year", tone: "down" };
    return { text: "Flat vs last year", tone: "flat" };
  }

  const trajectory = classifyTrajectory(wowPct);

  return { text: MATRIX[lyDir][trajectory], tone: lyDir };
}

const INSIGHT_MATRIX: Record<Direction, Record<Trajectory, (vsLY: number, wow: number) => string>> = {
  up: {
    improving: (vsLY, wow) =>
      `Up ${vsLY.toFixed(0)}% vs last year and still climbing — the most recent week is ${wow.toFixed(0)}% above its own recent average.`,
    flat: (vsLY) => `Up ${vsLY.toFixed(0)}% vs last year and holding steady week to week.`,
    declining: (vsLY, wow) =>
      `Up ${vsLY.toFixed(0)}% vs last year, but cooling off — the most recent week is ${Math.abs(wow).toFixed(0)}% below its own recent average.`,
  },
  flat: {
    improving: (_vsLY, wow) =>
      `Roughly flat vs last year, but picking up — the most recent week is ${wow.toFixed(0)}% above its own recent average.`,
    flat: () => "Holding steady, both vs last year and week to week.",
    declining: (_vsLY, wow) =>
      `Roughly flat vs last year, but starting to slip — the most recent week is ${Math.abs(wow).toFixed(0)}% below its own recent average.`,
  },
  down: {
    improving: (vsLY, wow) =>
      `Down ${Math.abs(vsLY).toFixed(0)}% vs last year, but the most recent week is up ${wow.toFixed(0)}% over its own recent average — likely stabilizing rather than still declining.`,
    flat: (vsLY) => `Down ${Math.abs(vsLY).toFixed(0)}% vs last year and holding at that level week to week.`,
    declining: (vsLY, wow) =>
      `Down ${Math.abs(vsLY).toFixed(0)}% vs last year and still slipping — the most recent week is down another ${Math.abs(wow).toFixed(0)}% from its own recent average.`,
  },
};

// The sentence form of getStatusPhrase's signals, for the CTA strip's
// expanded state.
export function getStatusInsight(vsLYPct: number | null, wowPct: number | null): string {
  if (vsLYPct === null && wowPct === null) {
    return "Not enough data yet to compare this item against its own history.";
  }

  if (vsLYPct === null) {
    if (wowPct! > FLAT_THRESHOLD) return `No last-year data yet, but trending up — the most recent week is ${wowPct!.toFixed(0)}% above its own recent average.`;
    if (wowPct! < -FLAT_THRESHOLD) return `No last-year data yet, but trending down — the most recent week is ${Math.abs(wowPct!).toFixed(0)}% below its own recent average.`;
    return "No last-year data yet, and sales are holding steady week to week.";
  }

  const lyDir = classifyDirection(vsLYPct);

  if (wowPct === null) {
    if (lyDir === "up") return `Up ${vsLYPct.toFixed(0)}% vs last year, over the same weeks.`;
    if (lyDir === "down") return `Down ${Math.abs(vsLYPct).toFixed(0)}% vs last year, over the same weeks.`;
    return "Roughly flat vs last year, over the same weeks.";
  }

  const trajectory = classifyTrajectory(wowPct);
  return INSIGHT_MATRIX[lyDir][trajectory](vsLYPct, wowPct);
}

/** Week label, seven days, then the week's total. */
export const WEEK_GRID = "120px repeat(7, 1fr) 1.1fr";

/** Each tone's text colour in the list. */
export const TONE_TEXT: Record<StatusTone, string> = {
  up: "text-severity_healthy_text",
  down: "text-severity_critical_text",
  flat: "text-content/85",
  muted: "text-content/85",
};

/** sameWeekDayLastYear returns ISO, which the API rejects (400, "Please use
 *  mm/dd/yyyy"), so it is reformatted to m/d/yyyy by string split: `new Date`
 *  would parse UTC midnight and roll back a day in US timezones. */
export const isoToMdy = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}/${y}`;
};
