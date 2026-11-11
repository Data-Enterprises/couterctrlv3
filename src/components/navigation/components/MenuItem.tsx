// Interfaces
import type { ComponentType, SVGProps } from "react";

// Components
import { ChevronRightIcon } from "@heroicons/react/24/outline";

interface MenuItemProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  onClick: () => void;
  /** Short grey text on the right, e.g. "Attaches this page". */
  hint?: string;
  /** A chevron on the right: the row opens something. */
  opens?: boolean;
  /** Sign out: red. */
  danger?: boolean;
  /** Inside the Environment panel, which has its own grey ground. */
  inPanel?: boolean;
  testId?: string;
}

/** One row of the avatar menu: an icon, a label, and a hint or a chevron. */
const MenuItem = ({ icon: Icon, label, onClick, hint, opens, danger, inPanel, testId }: MenuItemProps) => (
  <button
    type="button"
    role="menuitem"
    data-testid={testId}
    onClick={onClick}
    className={`w-full flex items-center gap-3 h-10 px-2.5 rounded-lg text-left text-[13px] transition-colors ${
      danger
        ? "font-medium text-brand_danger hover:bg-brand_danger_bg"
        : inPanel
          ? "font-medium text-content hover:bg-custom-white"
          : "text-content hover:bg-brand_navy/[0.05]"
    }`}
  >
    <Icon className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
    <span className="flex-1">{label}</span>
    {hint ? <span className="text-[11px] text-brand_slate">{hint}</span> : null}
    {opens ? <ChevronRightIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" /> : null}
  </button>
);

export default MenuItem;
