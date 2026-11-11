// Hooks
import { useEffect, useRef, useState } from "react";

// Utils
import {
  NOTE_KINDS,
  lastChangedRelease,
  notesFor,
  smallerFor,
  type NoteKind,
  type Release,
} from "../../content/releaseNotes";
import { SLIDE_MS, smallerRow } from "./utils";

// Interfaces
import type { Filter } from "./interfaces";

// Components
import { createPortal } from "react-dom";
import PanelHeader from "./components/PanelHeader";
import HereCard from "./components/HereCard";
import NothingNew from "./components/NothingNew";
import KindSection from "./components/KindSection";

interface ReleaseNotesPanelProps {
  releases: Release[];
  /** Made-up notes for trying the panel out, and the panel says so. */
  sample: boolean;
  /** The route of the page it was opened from, without the leading slash. */
  href: string;
  /** That page's name, for "Nothing new on Sales this release". Null for a
   *  route the menu does not name. */
  pageName: string | null;
  onClose: () => void;
}

/**
 * Release notes, as a full-height panel sliding in from the right.
 *
 * A panel rather than a page because notes are read in passing: somebody
 * halfway through a drill-down glances at what changed and closes it without
 * losing their place. The page it was opened from sits open at the top; below
 * it New, Improvements and Fixes are folded to their counts, and a chip shows
 * one kind alone, opened.
 *
 * Dev tree for now. It moves to prod with the dev-to-prod migration, and the
 * real notes go in then.
 */
const ReleaseNotesPanel = ({
  releases,
  sample,
  href,
  pageName,
  onClose,
}: ReleaseNotesPanelProps) => {
  // Off-screen for one frame so the slide has somewhere to start; closing
  // runs it backwards and hands back once the slide is done.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const close = () => {
    setShown(false);
    window.setTimeout(onClose, SLIDE_MS);
  };
  const closeRef = useRef(close);
  closeRef.current = close;
  const panel = useRef<HTMLElement>(null);
  // Escape or a click anywhere outside closes it. The click still reaches
  // the page, so nothing has to be clicked twice.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    const onDown = (e: PointerEvent) => {
      if (!panel.current?.contains(e.target as Node)) closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, []);

  const [date, setDate] = useState(releases[0]?.date ?? "");
  const [filter, setFilter] = useState<Filter>("all");
  const [opened, setOpened] = useState<NoteKind[]>([]);
  const release = releases.find((r) => r.date === date) ?? releases[0];
  const latest = releases[0];

  const shows = (k: NoteKind) => filter === "all" || filter === k;
  const toggle = (k: NoteKind) =>
    setOpened((o) => (o.includes(k) ? o.filter((x) => x !== k) : [...o, k]));

  const here = release ? notesFor(release, href) : [];
  const hereSmaller = release ? smallerFor(release, href) : 0;
  const hereShown = here.filter((n) => shows(n.kind));
  const hereSmallerShown = shows("fix") ? hereSmaller : 0;
  const more = release ? smallerRow(release.smallerFixes) : null;

  return createPortal(
    <aside
      ref={panel}
      aria-label="Release notes"
      className={`fixed inset-y-0 right-0 z-[70] flex w-[600px] max-w-full flex-col border-l border-brand_line bg-bkg shadow-[-24px_0_48px_-16px_rgb(var(--color-brand-navy)/0.28)] transition-transform duration-200 ease-out motion-reduce:transition-none ${
        shown ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <PanelHeader
        releases={releases}
        date={release?.date ?? ""}
        onDate={setDate}
        filter={filter}
        onFilter={setFilter}
        sample={sample}
        onClose={close}
      />

      {!release ? (
        <p className="m-0 p-5 text-[13px] text-content/95">
          No release notes yet.
        </p>
      ) : (
        <div className="cc-scroll flex flex-col gap-2.5 px-5 py-3.5">
          {hereShown.length > 0 || hereSmallerShown > 0 ? (
            <HereCard
              page={pageName ?? here[0]?.page ?? ""}
              notes={hereShown}
              smaller={hereSmallerShown}
            />
          ) : null}
          {release === latest && pageName && here.length === 0 && hereSmaller === 0 ? (
            <NothingNew
              pageName={pageName}
              last={lastChangedRelease(releases, href)}
              onPick={setDate}
            />
          ) : null}
          {NOTE_KINDS.filter(shows).map((k) => {
            const notes = release.items.filter((n) => n.kind === k);
            const extra = k === "fix" ? more : null;
            return notes.length > 0 || extra ? (
              <KindSection
                key={k}
                kind={k}
                notes={notes}
                more={extra}
                open={filter === k || opened.includes(k)}
                onToggle={() => toggle(k)}
              />
            ) : null;
          })}
        </div>
      )}
    </aside>,
    document.body,
  );
};

export default ReleaseNotesPanel;
