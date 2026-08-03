import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import PortalPanel from "../shared/PortalPanel";
import {
  ABOUT_FACTS,
  ABOUT_FOOTER,
  ABOUT_MISSION,
  ABOUT_SECTIONS,
  type AboutSection,
} from "./aboutContent";

interface Props {
  open: boolean;
  onClose: () => void;
  /** The footer CTA opens the walkthrough panel — in the static build this
   *  button carries `.js-demo` alongside the two in the top nav, so About
   *  hands off to Walkthrough rather than closing. */
  onBookWalkthrough: () => void;
  returnFocusTo?: HTMLElement | null;
}

const SectionList = ({ section }: { section: AboutSection }) => {
  if (!section.items?.length) return null;
  const numbered = section.listKind === "numbered";

  return (
    <ol className="mt-[18px] list-none">
      {section.items.map((item, i) => (
        <li
          key={item.term}
          className={`text-[13.8px] leading-[1.6] text-brand_slate py-3 border-t border-brand_line first:border-t-0 relative border-l-2 ${
            numbered ? "pl-[38px]" : "pl-3.5"
          } ${
            item.key
              ? "border-l-brand_green bg-brand_green_tint rounded-r-lg"
              : "border-l-transparent"
          }`}
        >
          {numbered && (
            <span
              aria-hidden="true"
              className="absolute left-0 top-[13px] font-mono text-[10px] font-semibold text-brand_green_dark"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
          )}
          <b className="block font-display text-[14.5px] font-bold text-brand_navy mb-1">
            {item.term}
          </b>
          {item.desc}
        </li>
      ))}
    </ol>
  );
};

/** One About section. Collapsible ones put the heading inside a button and
 *  fold everything below it; the rest render exactly as before, so a section
 *  that opts out is byte-for-byte the old markup.
 *
 *  The fold uses a 0fr→1fr grid row rather than max-height — it animates to
 *  the content's real height, so a section with an image doesn't need a magic
 *  number that breaks when the copy changes. */
const Section = ({ section, first }: { section: AboutSection; first: boolean }) => {
  const [open, setOpen] = useState(!section.startClosed);
  const foldable = !!section.collapsible;
  const shown = !foldable || open;

  const kicker = (
    <span className="block font-mono text-[9.5px] font-semibold tracking-[0.17em] uppercase text-brand_green_dark mb-[9px]">
      {section.kicker}
    </span>
  );

  const heading = (
    <h3 className="font-display text-[19px] font-extrabold text-brand_navy tracking-[-0.028em] leading-[1.12]">
      {section.heading}
    </h3>
  );

  const body = (
    <>
      {section.paras.map((p) => (
        <p
          key={p.slice(0, 40)}
          className="text-[14.5px] leading-[1.68] text-brand_slate mt-[11px]"
        >
          {p}
        </p>
      ))}

      {section.image && (
        <img
          src={section.image.src}
          alt={section.image.alt}
          className="block w-full h-auto rounded-[11px] border border-brand_line mt-[18px]"
        />
      )}

      <SectionList section={section} />

      {/* facts table only exists under "Who we are" */}
      {section.id === "who" && (
        <div className="mt-5 border border-brand_line rounded-[10px] px-[18px] py-1">
          {ABOUT_FACTS.map((f) => (
            <div
              key={f.k}
              className="flex justify-between gap-[18px] py-3 border-b border-brand_line last:border-b-0 text-[13.5px]"
            >
              <span className="font-mono text-[9.5px] tracking-[0.13em] uppercase text-brand_slate_2 whitespace-nowrap pt-[3px]">
                {f.k}
              </span>
              <span className="text-right text-brand_navy font-medium">{f.v}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <section
      className={first ? "" : "pt-[26px] mt-[26px] border-t border-brand_line"}
    >
      {foldable ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`about-${section.id}`}
          className="w-full flex items-start justify-between gap-4 text-left group cursor-pointer"
        >
          {/* kicker sits inside the button so the green label is part of the
              target, not a dead strip above it */}
          <span className="min-w-0">
            {kicker}
            {heading}
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className={`flex-none w-5 h-5 mt-5 text-brand_slate transition-transform duration-200 group-hover:text-brand_green_dark ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      ) : (
        <>
          {kicker}
          {heading}
        </>
      )}

      <div
        id={foldable ? `about-${section.id}` : undefined}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          shown ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">{body}</div>
      </div>
    </section>
  );
};

const AboutPanel = ({ open, onClose, onBookWalkthrough, returnFocusTo }: Props) => (
  <PortalPanel
    open={open}
    onClose={onClose}
    kicker="CounterCtrl Cloud"
    title="About us"
    width={620}
    returnFocusTo={returnFocusTo}
    footer={
      <>
        <span>{ABOUT_FOOTER}</span>
        <button
          onClick={onBookWalkthrough}
          className="font-mono text-[9.5px] tracking-[0.12em] uppercase font-semibold text-brand_green_dark hover:underline cursor-pointer"
        >
          Book a walkthrough →
        </button>
      </>
    }
  >
    <div className="px-8 pt-[26px] pb-[34px]">
      {/* mission — the one navy block in an otherwise light panel */}
      <div className="bg-brand_navy rounded-xl px-[26px] py-6 mb-[34px]">
        <span className="block font-mono text-[9.5px] font-semibold tracking-[0.17em] uppercase text-[#7FD1A0] mb-[9px]">
          {ABOUT_MISSION.kicker}
        </span>
        <p className="font-display font-bold text-[17px] leading-[1.42] tracking-[-0.02em] text-custom-white">
          {ABOUT_MISSION.lead}
          <em className="not-italic text-[#5BD98C]">{ABOUT_MISSION.emphasis}</em>
          {ABOUT_MISSION.tail}
        </p>
      </div>

      {ABOUT_SECTIONS.map((section, i) => (
        <Section key={section.id} section={section} first={i === 0} />
      ))}
    </div>
  </PortalPanel>
);

export default AboutPanel;
