// Interfaces
import type { TicketStatus } from "../../../../../../api/tickets";
import type { QueueTab } from "../../../../../../features/dev/devTicketsSlice";

/** Closed has its own folder in the rail, so it is not one of the statuses
 *  you narrow an open pile by. */
export const STATUSES: TicketStatus[] = ["open", "in_progress", "waiting"];

/**
 * The tabs, worked through in order. Urgent is a button beside Refresh, not
 * a tab; a client has two tabs and no Urgent button.
 */
export const QUEUE: { key: QueueTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unassigned", label: "Unassigned" },
  { key: "mine", label: "Mine" },
  { key: "closed", label: "Closed" },
];

export const CLIENT_QUEUE: { key: QueueTab; label: string }[] = [
  { key: "all", label: "Open" },
  { key: "closed", label: "Closed" },
];

export const PRIORITIES = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];
