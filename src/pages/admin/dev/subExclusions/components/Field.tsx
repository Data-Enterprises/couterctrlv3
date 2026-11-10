// Interfaces
import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  children: ReactNode;
}

/** A select with its question above it. `SelectFilter` carries no label, and
 *  three unlabelled dropdowns in a row is a guessing game. */
const Field = ({ label, children }: FieldProps) => (
  <div className="flex flex-col gap-1 flex-shrink-0">
    <span className="text-[9px] font-bold uppercase tracking-wide text-content/95">
      {label}
    </span>
    {children}
  </div>
);

export default Field;
