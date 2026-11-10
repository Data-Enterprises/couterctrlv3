// Interfaces
import type { ReactNode } from "react";

interface DefsProps {
  rows: { t: ReactNode; d: ReactNode }[];
}

/** A list of terms and their definitions in the help. */
const Defs = ({ rows }: DefsProps) => (
  <dl className="flex flex-col gap-2.5 m-0">
    {rows.map((r, i) => (
      <div key={i} className="grid grid-cols-[8.5rem_1fr] gap-4 items-baseline">
        <dt className="m-0 text-[14px] font-bold text-brand_navy">{r.t}</dt>
        <dd className="m-0 text-[14px] leading-[1.65] text-content">{r.d}</dd>
      </div>
    ))}
  </dl>
);

export default Defs;
