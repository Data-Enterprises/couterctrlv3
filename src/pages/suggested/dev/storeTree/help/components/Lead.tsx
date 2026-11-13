// Interfaces
import type { ReactNode } from "react";

interface LeadProps {
  children: ReactNode;
}

/** The opening line of an answer, a step up from the rest.
 *
 *  Twelve answers set at one size read as one undifferentiated block — the
 *  complaint that prompted this. A heavier first sentence gives each section a
 *  topic line a reader can skim, and makes the paragraphs under it feel like
 *  support rather than more of the same. */
const Lead = ({ children }: LeadProps) => (
  <p className="text-[15px] leading-[1.6] text-content font-medium">{children}</p>
);

export default Lead;
