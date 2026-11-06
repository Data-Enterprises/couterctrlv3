// Hooks
import { useCallback, useRef, useState } from "react";

// Utils
import { fetchInvoiceCost } from "../utils/invoiceCost";

// Interfaces
import type { InvoiceCostState, InvoiceCost, InventoryScope } from "../interfaces";

const initial: InvoiceCostState = { upc: null, cost: null, loading: false };

/**
 * The latest invoiced cost for the item on screen, beside
 * `useActualPricePoints`. A failure means no invoice, and the page falls back
 * to the item-file cost.
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
