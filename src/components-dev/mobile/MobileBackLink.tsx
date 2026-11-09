// Components
import { ChevronLeftIcon } from "@heroicons/react/20/solid";

interface MobileBackLinkProps {
  /** Where Back goes, e.g. "Back to stores". */
  label: string;
  onClick: () => void;
}

/** The phone's back link: a chevron and the name of the screen it returns to,
 *  top-left of a white header. The standard way back a level on the phone. */
const MobileBackLink = ({ label, onClick }: MobileBackLinkProps) => (
  <button
    type="button"
    onClick={onClick}
    className="-ml-1.5 flex items-center gap-0.5 rounded-lg py-1 pr-2 text-[12.5px] font-semibold text-content active:bg-bkg"
  >
    <ChevronLeftIcon className="h-4 w-4" />
    {label}
  </button>
);

export default MobileBackLink;
