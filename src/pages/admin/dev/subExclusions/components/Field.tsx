// Interfaces
import type { ReactNode } from "react";

/** A select with its question above it. `SelectFilter` carries no label, and
 *  three unlabelled dropdowns in a row is a guessing game. */
const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1 flex-shrink-0">
    <span className="text-[9px] font-bold uppercase tracking-wide text-content/85">
      {label}
    </span>
    {children}
  </div>
);

export default Field;
