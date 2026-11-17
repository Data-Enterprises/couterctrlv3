// Components
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import InfoButton from "../../../../../components-dev/InfoButton";

interface ConfigHeaderProps {
  onHelp: () => void;
  /** Clears every pick and folds the rows shut; the loaded range stays. */
  onClear: () => void;
}

/** The panel's title line: Configuration, its help button, and Clear. */
const ConfigHeader = ({ onHelp, onClear }: ConfigHeaderProps) => (
  <div className="flex items-center gap-2 px-3 pt-3 pb-2 flex-shrink-0">
    <span className="text-[11px] cc-caps flex-1">Configuration</span>
    <InfoButton variant="light" onClick={onHelp} title="How this page works" />
    <button
      type="button"
      onClick={onClear}
      title="Clear every pick — the loaded range stays"
      aria-label="Clear every pick, keeping the loaded range"
      className="w-[22px] h-[22px] rounded border border-brand_line_2 cc-muted-link hover:border-brand_slate flex items-center justify-center"
    >
      <ArrowPathIcon className="w-3.5 h-3.5" />
    </button>
  </div>
);

export default ConfigHeader;
