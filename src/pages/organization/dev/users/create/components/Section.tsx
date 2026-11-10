// Interfaces
import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  desc: string;
  last?: boolean;
  children: ReactNode;
}

/**
 * One block of the form: what it is for on the left, the fields on the right.
 */
const Section = ({ title, desc, last = false, children }: SectionProps) => (
  <div
    className={`flex flex-wrap gap-x-8 gap-y-3 px-5 py-3.5 ${
      last ? "" : "border-b border-gray-100"
    }`}
  >
    <div className="flex-1 min-w-[150px] max-w-[200px]">
      <h3 className="text-[12.5px] font-bold text-content m-0">{title}</h3>
      <p className="text-[11.5px] text-content/95 leading-snug mt-1 mb-0">
        {desc}
      </p>
    </div>
    <div className="flex-[999] min-w-[300px] grid grid-cols-1 sm:grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);

export default Section;
