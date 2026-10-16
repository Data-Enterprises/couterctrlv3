import type { ReactNode } from "react";

interface FilterBarProps {
  children: ReactNode;
  className?: string;
  /**
   * What the help panel points at, as a named prop rather than a loose
   * `data-help` on the tag: this component forwards nothing, and TypeScript
   * lets a hyphenated attribute through on any element without checking it is
   * accepted — so the attribute would be dropped in silence and the help would
   * report the control as not on screen.
   */
  helpAnchor?: string;
}

const FilterBar = ({ children, className = "", helpAnchor }: FilterBarProps) => {
  return (
    <div data-help={helpAnchor} className={`flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-custom-white flex-shrink-0 ${className}`}>
      {children}
    </div>
  );
};

export default FilterBar;
