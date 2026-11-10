// Interfaces
import type { SubDeptTotal, WindowPlan } from "../../interfaces";

export interface ExportArgs {
  row: SubDeptTotal;
  scopeLabel: string;
  plan: WindowPlan;
}
