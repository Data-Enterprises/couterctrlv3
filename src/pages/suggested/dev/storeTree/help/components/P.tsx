// Interfaces
import type { ReactNode } from "react";

/** A body paragraph in the help. */
const P = ({ children }: { children: ReactNode }) => (
  <p className="text-[14px] leading-[1.65] text-content">{children}</p>
);

export default P;
