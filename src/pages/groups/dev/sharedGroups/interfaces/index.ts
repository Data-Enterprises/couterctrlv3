export type RightSide =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "group"; id: number };

/** What every shared-group write answers: error 0 on success, else a message. */
export type Envelope = { error: number; msg?: string };
