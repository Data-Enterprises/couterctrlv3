/** What the help panel shows: the list, a guide at a step, or a fix. */
export type View =
  | { mode: "home" }
  | { mode: "guide"; id: string; step: number }
  | { mode: "fix"; id: string };
