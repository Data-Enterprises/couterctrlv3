// Interfaces

export type TrendStatus =
  | "accelerating"
  | "declining"
  | "stopped"
  | "reduced-availability"
  | "growing"
  | "new";

export type TrendTone = "up" | "down" | "flat" | "muted";

export type TrendPhrase = { text: string; tone: TrendTone };
