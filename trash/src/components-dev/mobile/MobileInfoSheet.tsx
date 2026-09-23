import BottomSheet from "../BottomSheet";
import type { InfoGlossaryEntry } from "../InfoPopover";

interface Props {
  title: string;
  purpose: string;
  glossary: InfoGlossaryEntry[];
  onClose: () => void;
}

/**
 * The mobile "?" — the desktop InfoPopover's content in a sheet that slides up.
 *
 * Same title / purpose / glossary shape as the desktop `*Info.ts` files, so a
 * page's help reads the same on both. A popover anchored to a header icon has
 * nowhere to sit on a phone; a bottom sheet is thumb-reachable, scrolls, and
 * closes by swipe or by tapping outside.
 */
const MobileInfoSheet = ({ title, purpose, glossary, onClose }: Props) => (
  <BottomSheet onClose={onClose}>
    <div className="flex-shrink-0 border-b border-gray-100 px-4 pb-3 pt-1">
      <div className="font-display text-[15px] font-bold text-content">{title}</div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-content/85">{purpose}</p>
    </div>
    <div className="flex flex-col gap-3.5 overflow-y-auto px-4 pb-8 pt-3">
      {glossary.map((entry) => (
        <div key={entry.term}>
          <div className="text-[13px] font-semibold text-content">{entry.term}</div>
          <div className="mt-0.5 text-[12.5px] leading-relaxed text-content/85">
            {entry.desc}
          </div>
          {entry.subEntries?.map((sub) => (
            <div key={sub.label} className="mt-1 text-[12px] leading-relaxed text-content/85">
              <span className="font-semibold text-content">{sub.label}</span> — {sub.desc}
            </div>
          ))}
        </div>
      ))}
    </div>
  </BottomSheet>
);

export default MobileInfoSheet;
