// Hooks
import { useCallback, useState } from "react";

// Components
import GridKpi from "./GridKpi";
import GridStoresOverlay from "./GridStoresOverlay";

interface StoresKpiProps {
  /** Store names, A to Z. */
  stores: string[];
}

/** The Stores figure in a KPI strip: the count, and a click drops the list
 *  of them down under it, the width of its cell. */
const StoresKpi = ({ stores }: StoresKpiProps) => {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <div className="relative">
      <GridKpi
        label="Stores"
        value={stores.length.toLocaleString()}
        onClick={() => setOpen((v) => !v)}
        open={open}
      />
      <GridStoresOverlay open={open} stores={stores} onClose={close} />
    </div>
  );
};

export default StoresKpi;
