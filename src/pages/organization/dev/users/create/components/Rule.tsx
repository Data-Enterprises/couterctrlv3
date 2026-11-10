// Interfaces
import type { ReactNode } from "react";

// Components
import { CheckIcon } from "@heroicons/react/20/solid";

/** A rule, and whether the password meets it yet. Live rather than a static
 *  list: a tick that never moves is decoration. */
const Rule = ({ met, children }: { met: boolean; children: ReactNode }) => (
  <div className="flex items-center gap-2 text-[12px] py-1">
    <CheckIcon
      className={`w-4 h-4 flex-shrink-0 ${
        met ? "text-severity_healthy_text" : "text-content/95 opacity-40"
      }`}
    />
    <span className={met ? "text-content" : "text-content/95"}>{children}</span>
  </div>
);

export default Rule;
