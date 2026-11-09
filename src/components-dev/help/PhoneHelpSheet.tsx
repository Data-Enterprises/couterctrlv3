// Hooks
import { useState } from "react";

// Utils
import { matches } from "./utils";

// Interfaces
import type { PhoneHelp } from "./helpTypes";

// Components
import { XMarkIcon, ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import Modal from "../Modal";

interface PhoneHelpSheetProps {
  content: PhoneHelp;
  onClose: () => void;
}

/**
 * The "?" help on a phone: the screen's questions and its terms, in a sheet.
 *
 * The same words the `-mobile` documents carried, drawn by the app instead of
 * an iframe of S3 HTML, and in the desktop panel's look so the two read as one
 * help. It doesn't point at the screen the way the panel does — the sheet
 * covers the screen, so there is nothing visible to point at.
 *
 * One question open at a time, and one term: on a phone a second answer opening
 * below the first pushes the first off the top, and the reader loses their
 * place.
 */
const PhoneHelpSheet = ({ content, onClose }: PhoneHelpSheetProps) => {
  const [search, setSearch] = useState("");
  const [openQ, setOpenQ] = useState<string | null>(null);
  const [openTerm, setOpenTerm] = useState<string | null>(null);

  const questions = content.questions.filter((x) => matches(search, x.q, ...x.a));
  const terms = content.terms.filter((t) =>
    matches(search, t.term, t.def, ...(t.parts ?? []).flatMap((p) => [p.label, p.def])),
  );

  const row = "w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left";
  const chevron = (on: boolean) =>
    on ? (
      <ChevronDownIcon className="w-4 h-4 text-content/85 flex-shrink-0" />
    ) : (
      <ChevronRightIcon className="w-4 h-4 text-content/85 flex-shrink-0" />
    );

  return (
    <Modal
      isOpen
      onClose={onClose}
      padded={false}
      modalClassName="bg-bkg w-full h-[92dvh] overflow-hidden"
    >
      <div role="dialog" aria-label="Help" className="flex flex-col h-full">
        {/* ── header ───────────────────────────────────────────────────── */}
        <div className="bg-custom-white px-4 pt-3.5 pb-3 border-b border-brand_line flex-shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-content/85">Help · {content.screen}</div>
              <h2 className="mt-0.5 text-[19px] font-bold text-content">How can we help?</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close help"
              className="w-8 h-8 flex items-center justify-center text-content/85 flex-shrink-0"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          {/* 16px text, not the panel's 13: anything smaller makes iOS zoom
              the page in when the box is tapped. */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search help"
            placeholder="Search this screen's help…"
            className="mt-3 w-full h-10 px-3 rounded-lg border border-brand_line_2 bg-custom-white text-[16px] text-content placeholder:text-brand_placeholder"
          />
        </div>

        {/* ── body ─────────────────────────────────────────────────────── */}
        {/* `min-h-0` so this scrolls inside the sheet rather than growing it. */}
        <div className="flex-1 min-h-0 overflow-auto px-4 py-4">
          <p className="text-[13px] text-content/85 mb-4">{content.purpose}</p>

          {questions.length > 0 && (
            <>
              <h3 className="text-[15px] font-bold text-content mb-2">Common questions</h3>
              <div className="bg-custom-white border border-brand_line rounded-xl overflow-hidden mb-5">
                {questions.map((x) => {
                  const on = openQ === x.q;
                  return (
                    <div key={x.q} className="border-t border-brand_line first:border-t-0">
                      <button
                        onClick={() => setOpenQ(on ? null : x.q)}
                        aria-expanded={on}
                        className={row}
                      >
                        <span className="flex-1 text-[13.5px] font-semibold text-content">
                          {x.q}
                        </span>
                        {chevron(on)}
                      </button>
                      {on && (
                        <div className="px-3.5 pb-3 flex flex-col gap-2 text-[13px] text-content/85">
                          {x.a.map((para) => (
                            <p key={para}>{para}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {terms.length > 0 && (
            <>
              <h3 className="text-[15px] font-bold text-content mb-2">What the terms mean</h3>
              <div className="bg-custom-white border border-brand_line rounded-xl overflow-hidden mb-5">
                {terms.map((t) => {
                  const on = openTerm === t.term;
                  return (
                    <div key={t.term} className="border-t border-brand_line first:border-t-0">
                      <button
                        onClick={() => setOpenTerm(on ? null : t.term)}
                        aria-expanded={on}
                        className={row}
                      >
                        <span className="flex-1 text-[13.5px] font-bold text-content">
                          {t.term}
                        </span>
                        {chevron(on)}
                      </button>
                      {on && (
                        <div className="px-3.5 pb-3 text-[13px] text-content/85">
                          <p>{t.def}</p>
                          {t.parts && (
                            <ul className="mt-2 flex flex-col gap-1.5">
                              {t.parts.map((p) => (
                                <li
                                  key={p.label}
                                  className="px-2.5 py-2 rounded-lg bg-bkg border border-brand_line"
                                >
                                  <span className="block text-[12.5px] font-semibold text-content">
                                    {p.label}
                                  </span>
                                  {p.def}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {questions.length === 0 && terms.length === 0 && (
            <p className="text-[13px] text-content/85 mb-5">Nothing here matches “{search}”.</p>
          )}

          <p className="text-[12.5px] text-content/85">
            Still stuck? Contact your CounterCtrl representative.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default PhoneHelpSheet;
