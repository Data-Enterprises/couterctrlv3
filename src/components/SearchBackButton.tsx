// Components
import { ArrowLeftIcon } from "@heroicons/react/20/solid";

interface SearchBackButtonProps {
  /** Usually "Back to results". */
  label: string;
  onClick: () => void;
}

/** The full-width bar under a search card that closes a re-search and goes
 *  back to the results already loaded. */
const SearchBackButton = ({ label, onClick }: SearchBackButtonProps) => (
  <button
    onClick={onClick}
    className="w-full py-2.5 flex items-center justify-center gap-1.5 transition-colors"
    style={{ background: "rgb(var(--color-brand-navy) / 0.07)", borderRadius: 10 }}
  >
    <ArrowLeftIcon className="w-4 h-4 text-brand_navy" />
    <span className="text-brand_navy font-semibold text-[13px] underline underline-offset-2">
      {label}
    </span>
  </button>
);

export default SearchBackButton;
