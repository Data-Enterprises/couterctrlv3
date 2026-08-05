import { useEffect, useRef } from "react";
import PortalPanel from "../shared/PortalPanel";
import {
  PERSPECTIVES_PANEL,
  PERSPECTIVE_SEATS,
  type PerspectiveSeat,
  type SeatId,
} from "./perspectivesContent";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Which seat is showing. Controlled by the page, because the strip buttons
   *  open the panel *and* select a seat in one click. */
  seat: SeatId;
  onSeatChange: (seat: SeatId) => void;
  /** `next.action` — one seat sends the visitor to About, one to Walkthrough,
   *  the same panel-to-panel handoff About already makes. */
  onOpenAbout: () => void;
  onOpenWalkthrough: () => void;
  returnFocusTo?: HTMLElement | null;
}

/** One seat's pane. Rendered for the active seat only — the panes are long and
 *  keeping three mounted would put two hidden copies of every heading in the
 *  accessibility tree. */
const Pane = ({
  seat,
  onNext,
}: {
  seat: PerspectiveSeat;
  onNext: () => void;
}) => (
  <div
    id={`pv-${seat.id}`}
    role="tabpanel"
    aria-labelledby={`pv-tab-${seat.id}`}
    tabIndex={0}
    className="outline-none"
  >
    <span className="block font-mono text-[9.5px] font-semibold tracking-[0.17em] uppercase text-brand_green_dark mb-[9px]">
      {seat.eyebrow}
    </span>

    <h3 className="font-display text-[19px] font-extrabold text-brand_navy tracking-[-0.028em] leading-[1.12]">
      {seat.question}
    </h3>

    <p className="text-[14.5px] leading-[1.68] text-brand_slate mt-[11px]">
      {seat.answer}
    </p>

    {seat.groups.map((group, gi) => (
      <div
        key={group.role ?? "ungrouped"}
        className={group.role && gi > 0 ? "mt-[22px]" : "mt-[18px]"}
      >
        {group.role && (
          <span className="block font-mono text-[9.5px] font-semibold tracking-[0.15em] uppercase text-brand_green_dark mb-2">
            {group.role}
          </span>
        )}

        <ul className="list-none">
          {group.items.map((item) => (
            <li
              key={item.title}
              className="text-[13.8px] leading-[1.6] text-brand_slate py-3 border-t border-brand_line first:border-t-0"
            >
              <b className="block font-display text-[14.5px] font-bold text-brand_navy mb-1">
                {item.title}
              </b>
              {item.body}
            </li>
          ))}
        </ul>
      </div>
    ))}

    {/* Where you'd actually be sitting — mono chips, same treatment as the
        carousel's neutral chips. */}
    <div className="flex items-center gap-2 flex-wrap mt-[22px] pt-[18px] border-t border-brand_line">
      <span className="font-mono text-[9.5px] font-semibold tracking-[0.15em] uppercase text-brand_slate_2">
        Where
      </span>
      {seat.where.map((w) => (
        <span
          key={w}
          className="font-mono text-[10px] tracking-[0.11em] uppercase border border-brand_line_2 text-brand_navy bg-custom-white rounded-md px-3 py-[7px] shadow-[0_1px_2px_rgba(15,36,64,.05)]"
        >
          {w}
        </span>
      ))}
    </div>

    <button
      type="button"
      onClick={onNext}
      className="mt-[18px] text-left font-display text-[13.5px] font-semibold text-brand_green_dark hover:underline cursor-pointer"
    >
      {seat.next.text}
    </button>
  </div>
);

const PerspectivesPanel = ({
  open,
  onClose,
  seat,
  onSeatChange,
  onOpenAbout,
  onOpenWalkthrough,
  returnFocusTo,
}: Props) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Switching seats returns you to the top. Without it, coming from a scrolled
  // Departments pane drops you into the middle of Operators.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [seat]);

  const active = PERSPECTIVE_SEATS.find((s) => s.id === seat) ?? PERSPECTIVE_SEATS[0];

  /** Left/Right move between tabs, which is what a tablist is expected to do
   *  once it has the role. */
  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const i = PERSPECTIVE_SEATS.findIndex((s) => s.id === seat);
    const next =
      e.key === "ArrowRight"
        ? (i + 1) % PERSPECTIVE_SEATS.length
        : (i - 1 + PERSPECTIVE_SEATS.length) % PERSPECTIVE_SEATS.length;
    onSeatChange(PERSPECTIVE_SEATS[next].id);
    tabsRef.current
      ?.querySelector<HTMLButtonElement>(`#pv-tab-${PERSPECTIVE_SEATS[next].id}`)
      ?.focus();
  };

  return (
    <PortalPanel
      open={open}
      onClose={onClose}
      kicker={PERSPECTIVES_PANEL.kicker}
      title={PERSPECTIVES_PANEL.title}
      width={620}
      returnFocusTo={returnFocusTo}
      bodyRef={bodyRef}
      footer={
        <>
          <span>{PERSPECTIVES_PANEL.footer}</span>
          <button
            onClick={onOpenWalkthrough}
            className="font-mono text-[9.5px] tracking-[0.12em] uppercase font-semibold text-brand_green_dark hover:underline cursor-pointer"
          >
            Book a walkthrough →
          </button>
        </>
      }
    >
      <div className="px-8 pt-[26px] pb-[34px]">
        <p className="text-[14.5px] leading-[1.68] text-brand_slate">
          {PERSPECTIVES_PANEL.lead}
          <b className="font-semibold text-brand_navy">
            {PERSPECTIVES_PANEL.leadEmphasis}
          </b>
          {PERSPECTIVES_PANEL.leadTail}
        </p>

        <div
          ref={tabsRef}
          role="tablist"
          aria-label="Perspectives"
          onKeyDown={onTabKey}
          className="flex items-stretch gap-1 mt-[22px] mb-[26px] border-b border-brand_line"
        >
          {PERSPECTIVE_SEATS.map((s) => {
            const on = s.id === seat;
            return (
              <button
                key={s.id}
                id={`pv-tab-${s.id}`}
                role="tab"
                type="button"
                aria-selected={on}
                aria-controls={`pv-${s.id}`}
                tabIndex={on ? 0 : -1}
                onClick={() => onSeatChange(s.id)}
                className={`font-display text-[13.5px] font-semibold px-3 pb-2.5 -mb-px border-b-2 transition-colors cursor-pointer ${
                  on
                    ? "border-brand_green text-brand_green_dark"
                    : "border-transparent text-brand_slate hover:text-brand_navy"
                }`}
              >
                {s.tabLabel}
              </button>
            );
          })}
        </div>

        <Pane
          seat={active}
          onNext={
            active.next.action === "open_about" ? onOpenAbout : onOpenWalkthrough
          }
        />
      </div>
    </PortalPanel>
  );
};

export default PerspectivesPanel;
