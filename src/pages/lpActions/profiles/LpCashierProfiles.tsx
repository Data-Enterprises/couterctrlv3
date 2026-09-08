import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setLpCase, toggleLpQuiet } from "../../../features/lpActionsSlice";
import LpWhoList from "./LpWhoList";
import {
  bandOf,
  buildStandings,
  peakWeek,
  type CashierStanding,
} from "./rollupStats";

/**
 * One exception across every store it happened at.
 *
 * The only view a single exception row cannot express — a store row narrows to
 * one store, and this is the question underneath it: who is doing this
 * anywhere. The store panel is the same list with a storeid.
 *
 * A frame and a heading, nothing more. All the deciding lives in `LpWhoList`,
 * so this and the store view cannot disagree about who belongs on a list.
 */
interface Props {
  onBack?: () => void;
}

const LpCashierProfiles = ({ onBack }: Props) => {
  const dispatch = useAppDispatch();
  const { rollupRows, windows, profileType, profileStore, quietOpen } =
    useAppSelector((s) => s.lpActions);

  /** For the heading's count only — the list does its own scoping. */
  const counts = useMemo(() => {
    if (!profileType) return { worth: 0, all: 0 };
    const mine = buildStandings(rollupRows, windows.length).filter(
      (s) => s.saleType === profileType,
    );
    return {
      worth: mine.filter((s) => bandOf(s) !== "quiet").length,
      all: mine.length,
    };
  }, [rollupRows, windows.length, profileType]);

  if (!profileType) return null;

  return (
    <div className="flex-shrink-0 shadow-lg" style={{ width: "63%" }}>
      <div className="bg-custom-white rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#1e2a4a] px-4 py-2.5 flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-custom-white truncate">
              {profileType} · every store
            </div>
            <div className="text-[12px] text-custom-white/85 truncate">
              {counts.worth} of {counts.all} worth looking at
            </div>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="ml-auto flex-shrink-0 text-[12px] font-medium text-custom-white/85 hover:text-custom-white transition-colors"
            >
              Close
            </button>
          )}
        </div>

        <LpWhoList
          saleType={profileType}
          storeid={profileStore}
          showQuiet={quietOpen}
          onToggleQuiet={() => dispatch(toggleLpQuiet())}
          onOpen={(c: CashierStanding) =>
            dispatch(
              setLpCase({
                // Cashier numbers are issued per store, so identity is always
                // the pair — 19 is a different person at every store.
                ref: { storeid: c.storeid, cashierNumber: c.cashierNumber },
                type: profileType,
                // Opens on their worst week. The evidence is about the week
                // that flagged; the others are the baseline it was measured
                // against.
                week: peakWeek(c).index,
              }),
            )
          }
        />
      </div>
    </div>
  );
};

export default LpCashierProfiles;
