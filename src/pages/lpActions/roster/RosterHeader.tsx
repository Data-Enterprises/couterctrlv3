import { useState } from "react";
import { useAppSelector } from "../../../hooks";
import InfoButton from "../../../components/InfoButton";
import InfoPopover from "../../../components/InfoPopover";
import HeaderIconButton from "../../../components/HeaderIconButton";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { LP_ACTIONS_INFO } from "../lpActionsInfo";

/**
 * The panel's navy header — structure and copy unchanged.
 *
 * Re-rooting the list underneath it is not a reason to touch this. The header
 * and everything below it are separately-approved pieces, and the only thing
 * that moves here is what the count counts: cashiers on the roster rather than
 * store-and-type rows.
 *
 * `infoOpen` is the one piece of state on this page that stays local. It is
 * not data and it is not view state anyone would want back after navigating
 * away — a legend that reopens itself on return would be a bug, not a feature.
 */
interface Props {
  /** Cashiers currently shown, after both filters. */
  count: number;
  onSearchOpen: () => void;
  /** Widen the baseline by a week. Lives beside the weeks note because that
   *  note is what it changes — the control and its label in one place. */
  onAddWeek: () => void;
  addingWeek: boolean;
}

const RosterHeader = ({
  count,
  onSearchOpen,
  onAddWeek,
  addingWeek,
}: Props) => {
  const { scopeLabel, weeks } = useAppSelector((s) => s.lpActions);
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="flex-shrink-0 bg-[#1e2a4a] rounded-t-xl px-4 pt-1 pb-2.5 flex flex-col gap-0">
      <div className="flex items-center gap-2 min-h-[26px]">
        <span className="min-w-0 flex-1 text-custom-white font-semibold text-[13px] truncate">
          {scopeLabel || "Exceptions"}
        </span>
        <span className="flex-shrink-0 text-[14px] font-semibold text-custom-white">
          {count}
        </span>
      </div>

      <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-custom-white/[0.08]">
        <HeaderIconButton onClick={onSearchOpen} title="New search">
          <MagnifyingGlassIcon className="w-3.5 h-3.5" />
        </HeaderIconButton>
        <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />
        <span className="text-[12px] text-custom-white/85">
          {weeks} weeks &middot; latest week graded on the {weeks - 1} before it
        </span>
        <button
          onClick={onAddWeek}
          disabled={addingWeek}
          className="flex-shrink-0 text-[12px] font-medium text-custom-white/85 hover:text-custom-white underline disabled:opacity-60 disabled:cursor-default transition-colors"
        >
          {addingWeek ? "Adding…" : "+ week"}
        </button>
        <div className="flex-1" />
        <div className="relative flex-shrink-0">
          <InfoButton onClick={() => setInfoOpen((v) => !v)} />
          {infoOpen && (
            <InfoPopover
              title={LP_ACTIONS_INFO.title}
              purpose={LP_ACTIONS_INFO.purpose}
              glossary={LP_ACTIONS_INFO.glossary}
              onClose={() => setInfoOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RosterHeader;
