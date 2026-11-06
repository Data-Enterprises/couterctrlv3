// Hooks
import { createContext, useContext, useEffect } from "react";

// Interfaces
import type { PanelFit } from "../interfaces";

/** Consumed directly by `Organization`, which owns the panel. No provider
 *  component lives here: a module exporting both a component and a hook
 *  breaks fast refresh for everything that imports it. */
export const PanelFitContext = createContext<(fit: PanelFit | null) => void>(
  () => undefined,
);

/**
 * Ask the surrounding panel to take a particular size while this is mounted.
 *
 * The panel is otherwise a saved, dragged rectangle, which is right for a
 * grid — those are lists somebody wants bigger or smaller — and wrong for a
 * form, which has one correct size and looked, at the remembered 1600px, like
 * a form that had failed to load.
 *
 * Releases on unmount, so the dragged size comes back the moment the form
 * closes. Passing `null` releases it too, for a view that only sometimes
 * wants to drive the size.
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
