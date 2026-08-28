import { useState } from "react";
import InfoButton from "../../../../components/InfoButton";
import InfoPopover from "../../../../components/InfoPopover";
import type { InfoGlossaryEntry } from "../../../../components/InfoPopover";
import { useElementSize } from "./useElementSize";

/**
 * The frame around one chart: a title, a "?" for what the marks mean, and a
 * well that measures itself.
 *
 * The chart is drawn to the well's real size rather than to a fixed one, so it
 * fills whatever height the panel has left. Two monitors were showing two
 * different problems with the same 420×180: a band of dead space underneath on
 * a large screen, and a hair of overflow on a laptop.
 *
 * The size arrives as a render prop instead of a fixed prop because the first
 * paint has no measurement yet — the child is simply not called until there is
 * one, which is cheaper and steadier than drawing a zero-width chart and
 * replacing it a frame later.
 *
 * The explanation lives behind the "?" rather than under the title. A caption
 * narrating the axis is read once and then re-read on every render forever.
 */
interface Props {
  /** A short qualifier beside the title — the span it covers, usually. On the
   *  face rather than in the tooltip, because two charts counting a different
   *  period from the cards above them is the kind of thing that has to be
   *  visible without asking. */
  note?: string;
  info: {
    title: string;
    purpose: string;
    glossary: InfoGlossaryEntry[];
  };
  /** Shown instead of the chart while the read it depends on is in flight. */
  loading?: boolean;
  /** Shown when the read finished and there was nothing to draw. */
  empty?: string;
  children: (size: { width: number; height: number }) => React.ReactNode;
}

const ChartCard = ({ info, note, loading, empty, children }: Props) => {
  const [open, setOpen] = useState(false);
  const [wellRef, size] = useElementSize<HTMLDivElement>();

  return (
    <div className="rounded-lg border border-gray-200 p-3 flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
        <span className="flex-1 min-w-0 truncate">
          <span className="text-[12px] font-semibold text-content">
            {info.title}
          </span>
          {note && (
            <span className="text-[12px] text-content/85"> · {note}</span>
          )}
        </span>
        <div className="relative flex-shrink-0">
          <InfoButton
            tone="light"
            title={`About ${info.title.toLowerCase()}`}
            onClick={() => setOpen((v) => !v)}
          />
          {open && (
            <InfoPopover
              title={info.title}
              purpose={info.purpose}
              glossary={info.glossary}
              onClose={() => setOpen(false)}
            />
          )}
        </div>
      </div>

      <div ref={wellRef} className="flex-1 min-h-0 overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center text-[12px] text-content/85">
            Reading receipts…
          </div>
        ) : empty ? (
          <div className="h-full flex items-center justify-center text-[12px] text-content/85">
            {empty}
          </div>
        ) : (
          size.width > 0 && size.height > 0 && children(size)
        )}
      </div>
    </div>
  );
};

export default ChartCard;
