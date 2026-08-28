import { useState } from "react";
import { useAppSelector } from "../../../hooks";
import InfoButton from "../../../components/InfoButton";
import InfoPopover from "../../../components/InfoPopover";
import HeaderIconButton from "../../../components/HeaderIconButton";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { formatDateSimple } from "../../../utils";
import { LP_ACTIONS_INFO } from "../lpActionsInfo";

/**
 * The panel's navy header, in the app's two-row shape.
 *
 * Row one is the period and the count, which is what the graded pages lead
 * with everywhere else. Row two is the scope — the store or group the walk ran
 * against — beside the control that would change it, so the thing being looked
 * at and the way to look at something else sit together.
 *
 * `infoOpen` is the one piece of state on this page that stays local. It is
 * not data and it is not view state anyone would want back after navigating
 * away — a legend that reopens itself on return would be a bug, not a feature.
 */
interface Props {
  /** Cashiers currently shown, after both filters. */
  count: number;
  onSearchOpen: () => void;
}

const RosterHeader = ({ count, onSearchOpen }: Props) => {
  const { scopeLabel, windows } = useAppSelector((s) => s.lpActions);
  const [infoOpen, setInfoOpen] = useState(false);

  const first = windows[0];
  const last = windows[windows.length - 1];
  const range =
    first && last
      ? `${formatDateSimple(first.start)} – ${formatDateSimple(last.end)}`
      : "";

  return (
    <div className="flex-shrink-0 bg-[#1e2a4a] rounded-t-xl px-4 pt-1 pb-2.5 flex flex-col gap-0">
      <div className="flex items-center gap-2 min-h-[26px]">
        <span className="min-w-0 flex-1 text-custom-white font-semibold text-[13px] truncate">
          {range}
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
        <span className="min-w-0 flex-1 text-[12px] text-custom-white/85 truncate">
          {scopeLabel || "All stores"}
        </span>
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
