// Interfaces
import type { ReactNode } from "react";

/** Why the screen is holding something back, beside a light that says it is
 *  still working. Shaped like a sentence, not a spinner. */
const LoadNote = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center gap-2.5 rounded-lg bg-custom-white shadow-card px-4 py-2.5">
    <span className="w-2 h-2 rounded-full bg-brand_navy_hover animate-pulse flex-shrink-0" />
    <span className="text-[13px] leading-snug text-content/95">{children}</span>
  </div>
);

export default LoadNote;
