// Hooks
import { createContext, useContext, useEffect } from "react";

// Interfaces
import type { PanelFit } from "../interfaces";

/** Read directly by `Organization`, which owns the panel. No provider
 *  component here, so fast refresh keeps working. */
export const PanelFitContext = createContext<(fit: PanelFit | null) => void>(
  () => undefined,
);

/**
 * Ask the surrounding panel for a size while this is mounted. Releases on
 * unmount; passing `null` releases it too.
 */
export const usePanelFit = (fit: PanelFit | null) => {
  const onFit = useContext(PanelFitContext);
  const width = fit?.width;
  const height = fit?.height;

  useEffect(() => {
    onFit(
      width === undefined || height === undefined ? null : { width, height },
    );
    return () => onFit(null);
  }, [onFit, width, height]);
};
