import { useCallback, useRef, useState } from "react";
import { fetchInvoiceCost, type InvoiceCost } from "./invoiceCost";
import type { InventoryScope } from "./inventoryData";

export interface InvoiceCostState {
  /** Which UPC `cost` belongs to. The panel checks this before reading, the
   *  same way it checks the register lines, so a slow answer for the item
   *  clicked before can't land on the one on screen. */
  upc: string | null;
  cost: InvoiceCost | null;
  loading: boolean;
}

const initial: InvoiceCostState = { upc: null, cost: null, loading: false };

/**
 * The latest invoiced cost for the item on screen.
 *
 * Runs beside `useActualPricePoints` when an item is picked. A failure resolves
 * to no invoice rather than an error: the page falls back to the item-file
 * cost, which is what it showed before, so a lost lookup costs accuracy, not
 * the page.
 */
export const useInvoiceCost = () => {
  const [state, setState] = useState<InvoiceCostState>(initial);
  const wanted = useRef<string | null>(null);

  const loadInvoiceCost = useCallback(
    async (scope: InventoryScope, upc: string) => {
      wanted.current = upc;
      setState({ upc, cost: null, loading: true });
      let cost: InvoiceCost | null = null;
      try {
        cost = await fetchInvoiceCost(scope, upc);
      } catch {
        cost = null;
      }
      if (wanted.current !== upc) return;
      setState({ upc, cost, loading: false });
    },
    [],
  );

  const resetInvoiceCost = useCallback(() => {
    wanted.current = null;
    setState(initial);
  }, []);

  return { invoice: state, loadInvoiceCost, resetInvoiceCost };
};
