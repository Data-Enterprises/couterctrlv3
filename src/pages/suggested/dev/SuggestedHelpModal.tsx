// Hooks
import { useRef, useState } from "react";

// Utils
import { NAVY } from "./utils";
import { SECTIONS } from "./utils/helpSections";

// Components
import { XMarkIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../components-dev/modals/ResizableModalShell";

/**
 * The page's explainer, opened from the store panel's "?".
 *
 * Long-form on purpose. The short glossary a popover can hold answers "what is
 * this column"; the questions people actually arrive with are "why is Saturday
 * different from Wednesday" and "does this know what is in my case", and those
 * need a paragraph and a worked example each.
 *
 * Ported from a standalone document, retyped in the app's vocabulary: navy
 * rather than the warm accent it was drawn in, the severity tokens for the
 * source pills, the system stack rather than three webfonts the app does not
 * load, and nothing under 12px.
 *
 * Every figure is the author's and is reproduced verbatim.
 */
const SuggestedHelpModal = ({ onClose }: { onClose: () => void }) => {
  const scroller = useRef<HTMLDivElement>(null);
  const [landed, setLanded] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  /**
   * Jump links, done with `scrollIntoView` rather than an `href="#id"`.
   *
   * A bare hash scrolls whichever element is the scrolling ancestor. Inside a
   * modal that is usually the panel, but where it is not, the PAGE behind the
   * modal moves instead and the modal appears frozen. A hash write can also
   * collide with the app's router. `scrollIntoView` finds the right container
   * on its own and changes no URL state.
   */
  const jump = (id: string) => {
    const target = scroller.current?.querySelector<HTMLElement>(`#${id}`);
    if (!target) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    // Focus so keyboard and screen-reader users land where sighted ones do.
    target.focus({ preventScroll: true });

    // Brief mark on the heading: the scroll happens inside the panel, so
    // without a cue it is not obvious anything moved.
    setLanded(id);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLanded(null), 1700);
  };

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="help-modal:suggested:v1"
      defaultWidth={880}
      defaultHeight={860}
    >
      <div
        className="flex-shrink-0 px-4 py-[11px] flex items-start justify-between"
        style={{ background: NAVY }}
      >
        <div>
          <div className="text-[15px] font-bold text-custom-white">
            Reading Suggested Weight
          </div>
          <div className="text-[13px] font-normal text-custom-white/85 mt-0.5">
            How the number is worked out, what it covers, and what it doesn&rsquo;t.
          </div>
        </div>
        <button
          onClick={onClose}
          title="Close"
          className="text-custom-white/85 hover:text-custom-white transition-colors flex-shrink-0"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* A tray, so the answer cards below have something to lift off. */}
      <div
        ref={scroller}
        className="flex-1 overflow-y-auto thin-scrollbar bg-gray-50 px-5 py-5"
      >
        <nav className="rounded-lg border border-gray-200 bg-custom-white shadow-md px-4 py-3.5 mb-4">
          <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-brand_navy mb-2.5">
            Questions
          </div>
          <ol className="flex flex-col gap-1.5 m-0 p-0 list-none">
            {SECTIONS.map((sec, i) => (
              <li key={sec.id}>
                <button
                  onClick={() => jump(sec.id)}
                  className="group w-full text-left flex items-baseline gap-3"
                >
                  <span className="w-5 flex-shrink-0 text-[13px] font-bold tabular-nums text-brand_navy/50 group-hover:text-brand_navy transition-colors">
                    {i + 1}
                  </span>
                  <span className="text-[14px] text-content group-hover:text-brand_navy group-hover:underline underline-offset-2 transition-colors">
                    {sec.q}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {SECTIONS.map((sec, i) => (
          <section
            key={sec.id}
            id={sec.id}
            // -1 keeps it focusable for the jump without putting a block of
            // text into the tab order.
            tabIndex={-1}
            className={`rounded-lg border bg-custom-white shadow-md outline-none mb-4 transition-colors duration-700 ${
              landed === sec.id ? "border-brand_navy/40" : "border-gray-200"
            }`}
            style={{ scrollMarginTop: "0.5rem" }}
          >
            {/* Question band, then the answer. One card per question is what
                makes this read as a Q&A rather than a page with rules through
                it — twelve headings on one surface all carried the same weight
                however they were set. The numeral matches the contents list,
                same twelve in the same order, so it is structure rather than
                ornament. */}
            <div className="flex items-baseline gap-3 px-5 pt-4 pb-3.5 border-b border-gray-100">
              <span
                className={`w-6 flex-shrink-0 text-[13px] font-bold tabular-nums text-custom-white rounded text-center py-0.5 transition-colors duration-700 ${
                  landed === sec.id ? "bg-brand_navy" : "bg-brand_navy/55"
                }`}
              >
                {i + 1}
              </span>
              <h2
                className={`text-[19px] font-bold leading-snug m-0 tracking-[-0.01em] transition-colors duration-700 ${
                  landed === sec.id ? "text-brand_navy" : "text-content"
                }`}
              >
                {sec.q}
              </h2>
            </div>
            <div className="flex flex-col gap-3.5 px-5 py-4">{sec.body}</div>
          </section>
        ))}

        <footer className="px-1 pt-2 pb-1 text-[13px] leading-relaxed text-content/85">
          Figures shown are real, from one store over a twelve-week window.
          Departments covered are the ones that sell by the pound &mdash; meat,
          produce and deli scale items.
        </footer>
      </div>
    </ResizableModalShell>
  );
};

export default SuggestedHelpModal;
