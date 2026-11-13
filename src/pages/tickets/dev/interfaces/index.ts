// Interfaces
import type { TicketStoreOption } from "../../../../api/tickets";

export interface StoreCompanyGroup {
  company: number | null;
  company_name: string;
  stores: TicketStoreOption[];
}
