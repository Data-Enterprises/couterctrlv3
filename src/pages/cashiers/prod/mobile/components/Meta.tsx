// Interfaces
import type { ReactNode } from "react";

interface MetaProps {
  label: string;
  children: ReactNode;
}

/**
 * One labelled figure on a row's second line; the label is set apart by case
 * and letter-spacing, not opacity.
 */
const Meta = ({ label, children }: MetaProps) => (
  <>
    <span className="uppercase tracking-wider">{label}</span>{" "}
    <span className="font-semibold text-content">{children}</span>
  </>
);

export default Meta;
