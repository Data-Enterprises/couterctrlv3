// Interfaces
import type { ThresholdValue } from "../../../interfaces";

/** Each threshold comparison's symbol. */
export const OP_LABELS: Record<ThresholdValue["op"], string> = { gt: ">", lt: "<", eq: "=" };
