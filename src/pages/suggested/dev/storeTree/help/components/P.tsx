// Interfaces
import type { ReactNode } from "react";

interface PProps {
  children: ReactNode;
}

/** A body paragraph in the help. */
const P = ({ children }: PProps) => (
  <p className="text-[14px] leading-[1.65] text-content">{children}</p>
);

export default P;
