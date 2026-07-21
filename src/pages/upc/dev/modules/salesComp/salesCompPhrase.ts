export type StatusTone = "up" | "down" | "flat" | "muted";
export type StatusPhrase = { text: string; tone: StatusTone };

// Matches the flat-band convention SalesCompKpis already uses for bucketing
// WoW into up/flat/down — reused here so both signals agree on what counts
// as a real move vs. noise.
const FLAT_THRESHOLD = 1;

type Direction = "up" | "flat" | "down";
type Trajectory = "improving" | "flat" | "declining";

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

// Synthesizes vs-LY direction and week-over-week trajectory into one
// plain-language verdict for the left list — two real, sometimes
// contradictory signals (an item can be down for the year but improving
// recently), rather than collapsing them into a single misleading word.
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

// Fuller, sentence-form version of the same signals behind getStatusPhrase —
// for the CTA insight strip's expanded state, where there's room to spell
// out the two-signal story instead of compressing it into a short label.
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
