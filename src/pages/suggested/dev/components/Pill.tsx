// Utils
import { PILL } from "../utils";

// Interfaces
import type { ReactNode } from "react";

/** A source pill in the help, toned like the page's. */
const Pill = ({ tone, children }: { tone: keyof typeof PILL; children: ReactNode }) => (
  <span
    className={`inline-block px-2 py-0.5 rounded text-[13px] font-semibold whitespace-nowrap ${PILL[tone]}`}
  >
    {children}
  </span>
);

export default Pill;
