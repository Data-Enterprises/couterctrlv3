import { useEffect, useMemo, useState } from "react";
import { XMarkIcon, ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { useHelpHighlight } from "./useHelpHighlight";
import type { HelpAnchor, HelpContent, HelpFix, HelpGuide } from "./helpTypes";

interface HelpPanelProps {
  content: HelpContent;
  onClose: () => void;
}

/** Kept in step with `duration-200` on the aside below. */
const SLIDE_MS = 200;

type View =
  | { mode: "home" }
  | { mode: "guide"; id: string; step: number }
  | { mode: "fix"; id: string };

const matches = (needle: string, ...hay: string[]) =>
  needle.trim() === "" ||
  hay.some((h) => h.toLowerCase().includes(needle.trim().toLowerCase()));

/**
 * The "?" help, as a panel over the screen it describes.
 *
 * Three views in one drawer: what you can do, what has gone wrong, and what
 * the words mean. Which one you are in is the only state that matters, so it
 * is one union rather than three booleans that can all be true at once.
 *
 * The panel points at the screen. Opening a term or landing on a guide step
 * sets an anchor, and whatever carries that `data-help` gets a ring drawn over
 * it. That is the whole reason this is a component and not the document it
 * used to be — a cross-origin frame cannot see the page behind it.
 */
const HelpPanel = ({ content, onClose }: HelpPanelProps) => {
  /**
   * Off-screen for one frame, so the browser has a starting transform to
   * animate from — mounting straight into the open position gives it nothing
   * to move between and the panel simply appears. Closing runs the same thing
   * backwards and tells the caller when the slide has finished, which is why
   * `onClose` is deferred rather than called on the click.
   */
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const close = () => {
    setShown(false);
    window.setTimeout(onClose, SLIDE_MS);
  };

  const [view, setView] = useState<View>({ mode: "home" });
  const [search, setSearch] = useState("");
  const [openTerm, setOpenTerm] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);

  const guide = useMemo(
    () =>
      view.mode === "guide"
        ? (content.guides.find((g) => g.id === view.id) ?? null)
        : null,
    [view, content.guides],
  );
  const fix = useMemo(
    () =>
      view.mode === "fix"
        ? (content.fixes.find((f) => f.id === view.id) ?? null)
        : null,
    [view, content.fixes],
  );

  /** The one control the panel is pointing at, if any. */
  const anchor: HelpAnchor | null =
    view.mode === "guide" && guide
      ? (guide.steps[view.step]?.anchor ?? null)
      : view.mode === "home" && openTerm
        ? (content.terms.find((t) => t.term === openTerm)?.anchor ?? null)
        : null;

  const box = useHelpHighlight(anchor);
  const pointingAtNothing = anchor !== null && box === null;

  const goHome = () => {
    setView({ mode: "home" });
    setOpenTerm(null);
    setAnswers([]);
  };

  const openGuide = (g: HelpGuide) => setView({ mode: "guide", id: g.id, step: 0 });
  const openFix = (f: HelpFix) => {
    setAnswers([]);
    setView({ mode: "fix", id: f.id });
  };

  const guides = content.guides.filter((g) => matches(search, g.title, g.desc));
  const fixes = content.fixes.filter((f) => matches(search, f.title));
  const terms = content.terms.filter((t) => matches(search, t.term, t.def));

  /* ── the fix flow: questions answered in order, then a verdict ─────────── */
  const fixTrail = useMemo(() => {
    if (!fix) return { asked: [], result: null };
    const asked: { q: (typeof fix.questions)[number]; picked?: string }[] = [];
    let current = fix.questions[0];
    let resultId: string | null = null;

    for (let i = 0; current; i++) {
      const picked = answers[i];
      asked.push({ q: current, picked });
      if (picked === undefined) break;
      const option = current.options.find((o) => o.label === picked);
      if (option?.result) {
        resultId = option.result;
        break;
      }
      const nextQ = fix.questions.find((q) => q.id === option?.next);
      if (!nextQ) break;
      current = nextQ;
    }
    return {
      asked,
      result: resultId ? (fix.results.find((r) => r.id === resultId) ?? null) : null,
    };
  }, [fix, answers]);

  const answer = (depth: number, label: string) =>
    setAnswers((prev) => [...prev.slice(0, depth), label]);

  const toneClass = (tone: "ok" | "warn" | "bad") =>
    tone === "ok"
      ? "bg-delta_positive_bg text-delta_positive_text"
      : tone === "bad"
        ? "bg-brand_danger_bg text-brand_danger"
        : "bg-severity_watch_bg text-severity_watch_text";

  return (
    <>
      {box && (
        <div
          aria-hidden="true"
          className="fixed z-[60] pointer-events-none rounded-md ring-2 ring-brand_navy"
          style={{
            top: box.top - 4,
            left: box.left - 4,
            width: box.width + 8,
            height: box.height + 8,
            boxShadow: "0 0 0 9999px rgb(var(--color-brand-navy) / 0.12)",
          }}
        />
      )}

      <aside
        aria-label="Help"
        className={`fixed top-12 right-0 bottom-0 z-[70] w-[600px] max-w-full bg-bkg border-l border-brand_line flex flex-col shadow-[-24px_0_48px_-16px_rgb(var(--color-brand-navy)/0.28)] transition-transform duration-200 ease-out motion-reduce:transition-none ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── header ───────────────────────────────────────────────────── */}
        <div className="bg-custom-white px-5 pt-4 pb-3 border-b border-brand_line flex-shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {view.mode === "home" ? (
                <>
                  <div className="text-[12px] text-content/85">
                    Help · {content.screen}
                  </div>
                  <h2 className="mt-0.5 text-[20px] font-bold text-content">
                    How can we help?
                  </h2>
                </>
              ) : (
                <>
                  <button
                    onClick={goHome}
                    className="text-[12px] font-semibold text-brand_navy"
                  >
                    ← All help for this screen
                  </button>
                  <div className="text-[12px] text-content/85 mt-1.5">
                    {content.screen}
                  </div>
                  <h2 className="text-[19px] font-bold text-content leading-tight">
                    {guide?.title ?? fix?.title}
                  </h2>
                </>
              )}
            </div>
            <button
              onClick={close}
              aria-label="Close help"
              className="w-8 h-8 flex items-center justify-center text-content/85 flex-shrink-0"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {view.mode === "home" && (
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search help"
              placeholder="Search this screen's help…"
              className="mt-3 w-full h-9 px-3 rounded-lg border border-brand_line_2 bg-custom-white text-[13px] text-content placeholder:text-brand_placeholder"
            />
          )}

          {view.mode === "guide" && guide && (
            <div className="mt-3 flex items-center gap-2.5 text-[12px] text-content/85">
              <div className="flex-1 h-1.5 rounded-full bg-brand_line overflow-hidden">
                <div
                  className="h-full bg-brand_navy"
                  style={{
                    width: `${((view.step + 1) / guide.steps.length) * 100}%`,
                  }}
                />
              </div>
              <span>
                Step {view.step + 1} of {guide.steps.length}
              </span>
            </div>
          )}
        </div>

        {/* ── body ─────────────────────────────────────────────────────── */}
        {/* `min-h-0` is load-bearing: a flex child defaults to min-height
            auto, so this grows to fit its content instead of scrolling, and
            the overflow rule above it never gets a chance to apply. */}
        <div className="flex-1 min-h-0 overflow-auto thin-scrollbar px-5 py-4">
          {view.mode === "home" && (
            <>
              <p className="text-[13px] text-content/85 mb-4">{content.purpose}</p>

              {guides.length > 0 && (
                <>
                  <h3 className="text-[15px] font-bold text-content mb-2">
                    I want to…
                  </h3>
                  <div className="bg-custom-white border border-brand_line rounded-xl overflow-hidden mb-5">
                    {guides.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => openGuide(g)}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left border-t border-brand_line first:border-t-0 hover:bg-row_selected"
                      >
                        <span className="flex-1 min-w-0">
                          <span className="block text-[13.5px] font-semibold text-content">
                            {g.title}
                          </span>
                          <span className="block text-[12.5px] text-content/85">
                            {g.desc}
                          </span>
                        </span>
                        <span className="text-[12px] text-content/85 flex-shrink-0">
                          {g.steps.length} steps
                        </span>
                        <ChevronRightIcon className="w-4 h-4 text-content/85 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {fixes.length > 0 && (
                <>
                  <h3 className="text-[15px] font-bold text-content mb-2">
                    Something looks wrong
                  </h3>
                  <div className="bg-custom-white border border-brand_line rounded-xl overflow-hidden mb-5">
                    {fixes.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => openFix(f)}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left border-t border-brand_line first:border-t-0 hover:bg-row_selected"
                      >
                        <span className="w-2 h-2 rounded-full bg-brand_danger flex-shrink-0" />
                        <span className="flex-1 text-[13.5px] font-semibold text-content">
                          {f.title}
                        </span>
                        <span className="text-[12px] text-content/85 flex-shrink-0">
                          Guided fix
                        </span>
                        <ChevronRightIcon className="w-4 h-4 text-content/85 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {terms.length > 0 && (
                <>
                  <h3 className="text-[15px] font-bold text-content">
                    What does this mean?
                  </h3>
                  <p className="text-[12.5px] text-content/85 mb-2">
                    Pick a term to see where it is on the screen.
                  </p>
                  <div className="bg-custom-white border border-brand_line rounded-xl overflow-hidden">
                    {terms.map((t) => {
                      const on = openTerm === t.term;
                      return (
                        <div
                          key={t.term}
                          className="border-t border-brand_line first:border-t-0"
                        >
                          <button
                            onClick={() => setOpenTerm(on ? null : t.term)}
                            aria-expanded={on}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-row_selected"
                          >
                            <span className="flex-1 text-[13.5px] font-bold text-content">
                              {t.term}
                            </span>
                            {t.anchor && (
                              <span className="text-[11px] font-medium text-brand_navy flex-shrink-0">
                                Show me
                              </span>
                            )}
                            {on ? (
                              <ChevronDownIcon className="w-4 h-4 text-content/85" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4 text-content/85" />
                            )}
                          </button>
                          {on && (
                            <p className="px-3.5 pb-3 text-[13px] text-content/85">
                              {t.def}
                              {t.anchor && pointingAtNothing && (
                                <span className="block mt-1.5 text-[12px] text-content/85">
                                  Not on screen right now — it appears once a
                                  search has run.
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {guides.length === 0 && fixes.length === 0 && terms.length === 0 && (
                <p className="text-[13px] text-content/85">
                  Nothing here matches “{search}”.
                </p>
              )}
            </>
          )}

          {view.mode === "guide" && guide && (
            <>
              <ol className="list-none m-0 p-0 flex flex-col gap-2">
                {guide.steps.map((s, i) => {
                  // Every step shows its instruction. Folding all but one
                  // hid what the guide is before anyone had agreed to start
                  // it — four titles say nothing about whether this is the
                  // right guide. `current` is now only which step the panel
                  // is pointing at on screen.
                  const current = i === view.step;
                  return (
                    <li
                      key={s.title}
                      className={`rounded-xl border ${
                        current
                          ? "bg-custom-white border-row_selected_border"
                          : "bg-custom-white border-brand_line"
                      }`}
                    >
                      <button
                        onClick={() => setView({ mode: "guide", id: guide.id, step: i })}
                        aria-current={current}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left"
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${
                            current
                              ? "bg-brand_navy text-custom-white"
                              : "bg-brand_line text-content"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="flex-1 text-[13.5px] font-bold text-content">
                          {s.title}
                        </span>
                      </button>
                      <div className="pl-[52px] pr-3.5 pb-3.5">
                          <p className="text-[13.5px] text-content/85">
                            {s.pre}
                            {s.chip && (
                              <span className="inline-block mx-1 px-2 rounded-md bg-brand_navy text-custom-white text-[12px] font-semibold leading-6">
                                {s.chip}
                              </span>
                            )}
                            {s.post}
                          </p>
                          {s.see && (
                            <p className="mt-2.5 px-3 py-2 rounded-lg bg-delta_positive_bg text-[13px] text-delta_positive_text">
                              <strong>You'll see:</strong> {s.see}
                            </p>
                          )}
                        {s.anchor && current && (
                          <p className="mt-2 text-[12px] font-semibold text-brand_navy">
                            {pointingAtNothing
                              ? "Not on screen right now"
                              : "← Highlighted on the screen"}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="flex justify-between gap-2 mt-3">
                <button
                  onClick={() =>
                    setView({
                      mode: "guide",
                      id: guide.id,
                      step: Math.max(0, view.step - 1),
                    })
                  }
                  disabled={view.step === 0}
                  className={`h-9 px-4 rounded-lg border border-brand_line_2 text-[12.5px] font-semibold ${
                    view.step === 0 ? "text-content/85" : "text-content bg-custom-white"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    view.step === guide.steps.length - 1
                      ? goHome()
                      : setView({ mode: "guide", id: guide.id, step: view.step + 1 })
                  }
                  className="h-9 px-5 rounded-lg bg-brand_navy text-custom-white text-[12.5px] font-semibold"
                >
                  {view.step === guide.steps.length - 1 ? "Done" : "Next"}
                </button>
              </div>

              {guide.issues && guide.issues.length > 0 && (
                <div className="mt-5 bg-custom-white border border-brand_line rounded-xl px-3.5 py-3">
                  <h3 className="text-[14px] font-bold text-content mb-1">
                    If it doesn't work
                  </h3>
                  {guide.issues.map((i) => (
                    <div
                      key={i.q}
                      className="py-2 border-t border-brand_line text-[13px]"
                    >
                      <strong className="block text-content">{i.q}</strong>
                      <span className="text-content/85">{i.a}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {view.mode === "fix" && fix && (
            <>
              {fixTrail.asked.map(({ q, picked }, depth) => (
                <section
                  key={q.id}
                  className="bg-custom-white border border-brand_line rounded-xl p-3.5 mb-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[14px] font-bold text-content">
                      {depth + 1}. {q.title}
                    </h3>
                    {depth === 0 && (
                      <button
                        onClick={() => setAnswers([])}
                        className="text-[12px] font-semibold text-brand_navy"
                      >
                        Start over
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 mt-2.5">
                    {q.options.map((o) => (
                      <button
                        key={o.label}
                        onClick={() => answer(depth, o.label)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left text-[13px] font-semibold ${
                          picked === o.label
                            ? "border-row_selected_border bg-row_selected text-content"
                            : "border-brand_line text-content hover:bg-row_selected"
                        }`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            picked === o.label ? "bg-brand_navy" : "bg-brand_line_2"
                          }`}
                        />
                        {o.label}
                      </button>
                    ))}
                  </div>
                </section>
              ))}

              {fixTrail.result ? (
                <section
                  aria-live="polite"
                  className="bg-custom-white border border-brand_line rounded-xl p-3.5"
                >
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide ${toneClass(
                      fixTrail.result.tone,
                    )}`}
                  >
                    {fixTrail.result.badge}
                  </span>
                  <h3 className="mt-2 mb-1 text-[16px] font-bold text-content">
                    {fixTrail.result.title}
                  </h3>
                  <p className="text-[13.5px] text-content/85">
                    {fixTrail.result.why}
                  </p>
                  <h4 className="mt-3 mb-1 text-[13.5px] font-bold text-content">
                    What to do
                  </h4>
                  <ol className="pl-5 text-[13.5px] text-content/85 list-decimal">
                    {fixTrail.result.todo.map((t) => (
                      <li key={t} className="mb-1">
                        {t}
                      </li>
                    ))}
                  </ol>
                </section>
              ) : (
                <p className="px-3.5 py-3 border border-dashed border-brand_line_2 rounded-xl text-[13px] text-content/85">
                  Answer above to see what's going on and what to do.
                </p>
              )}
            </>
          )}
        </div>

        {/* ── footer ───────────────────────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-brand_line bg-custom-white flex-shrink-0 text-[13px] text-content/85">
          <p className="m-0">
            Still stuck? Send your CounterCtrl rep the store number, the dates
            and a screenshot
            {content.contact ? ` — ${content.contact}` : ""}.
          </p>
        </div>
      </aside>
    </>
  );
};

export default HelpPanel;
