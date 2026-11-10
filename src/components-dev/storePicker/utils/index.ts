// Interfaces
import type { iOption } from "../interfaces";

/** The search types every user gets. */
export const options: iOption[] = [
  // { id: 1, name: "Stores", type: "Stores" },
  { id: 3, name: "Store", type: "Store" },
  { id: 2, name: "Group", type: "Group" },
];

// Only offered when the user actually holds one. A shared group is a base
// group a manager pushed to them, so most users have none and the option
// would just be a dead choice that resolves to an empty list.
export const sharedOption: iOption = { id: 4, name: "Shared", type: "Shared" };
