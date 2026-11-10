// Interfaces
import type { SEARCH_TYPE } from "../../../features/searchSlice";

/** One search type the picker offers. */
export interface iOption {
  id: number;
  name: string;
  type: SEARCH_TYPE;
}
