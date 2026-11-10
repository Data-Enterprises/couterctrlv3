// Interfaces
import type { ReactNode } from "react";

/** Emphasis, underlined as well as slanted.
 *
 *  Italic alone is a weak signal at this size and disappears entirely for
 *  anyone reading quickly; the underline is what makes the stressed word
 *  actually register as stressed. */
const Em = ({ children }: { children: ReactNode }) => (
  <em className="italic underline underline-offset-2 decoration-content/40">
    {children}
  </em>
);

export default Em;
