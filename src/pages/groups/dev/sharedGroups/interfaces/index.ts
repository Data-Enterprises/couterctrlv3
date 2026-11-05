export type RightSide =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "group"; id: number };
