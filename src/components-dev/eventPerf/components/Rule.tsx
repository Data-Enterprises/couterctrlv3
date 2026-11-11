// Interfaces
import type { ReactNode } from "react";

interface RuleProps {
  children?: ReactNode;
}

/** A rule with a caption sitting in it, the way a till roll breaks sections. */
const Rule = ({ children }: RuleProps) =>
  children ? (
    <div className="my-2.5 flex items-center gap-2">
      <span className="h-px flex-1 bg-fill_track" />
      <span className="font-mono text-[11px] font-bold tracking-wider text-content">
        {children}
      </span>
      <span className="h-px flex-1 bg-fill_track" />
    </div>
  ) : (
    <div className="my-2 border-t border-dashed border-line_strong" />
  );

export default Rule;
