import type { ReactNode } from "react";

interface FilterBarProps {
  children: ReactNode;
  className?: string;
}

const FilterBar = ({ children, className = "" }: FilterBarProps) => {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-white flex-shrink-0 ${className}`}>
      {children}
    </div>
  );
};

export default FilterBar;
