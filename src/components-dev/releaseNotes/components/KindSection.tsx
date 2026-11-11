// Utils
import {
  KIND_TITLE,
  type NoteKind,
  type ReleaseNote,
} from "../../../content/releaseNotes";
import { pageLabel } from "../utils";

// Interfaces
import type { SummaryRow } from "../interfaces";

// Components
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import NoteRow from "./NoteRow";

interface KindSectionProps {
  kind: NoteKind;
  notes: ReleaseNote[];
  /** A closing row that stands for several notes (Fixes' smaller fixes). */
  more: SummaryRow | null;
  open: boolean;
  onToggle: () => void;
}

/** One kind's notes, folded to its title and count until it is opened. */
const KindSection = ({ kind, notes, more, open, onToggle }: KindSectionProps) => (
  <section className="flex-none overflow-hidden rounded-xl bg-custom-white">
    <h3 className="m-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-content"
      >
        <ChevronDownIcon
          aria-hidden
          className={`h-4 w-4 flex-none transition-transform duration-150 ${
            open ? "" : "-rotate-90"
          }`}
        />
        <span className="flex-1 text-[14px] font-bold">{KIND_TITLE[kind]}</span>
        <span className="rounded-full bg-brand_navy/[0.08] px-2 py-0.5 text-[12px] font-semibold tabular-nums">
          {notes.length + (more ? 1 : 0)}
        </span>
      </button>
    </h3>
    {open ? (
      <ul className="m-0 list-none border-t border-brand_line p-0">
        {notes.map((n, i) => (
          <NoteRow
            key={`${n.page}|${n.text}`}
            kind={kind}
            page={pageLabel(n)}
            text={n.text}
            ruled={i > 0}
          />
        ))}
        {more ? (
          <NoteRow
            key="more"
            kind={kind}
            page={more.page}
            text={more.text}
            ruled={notes.length > 0}
          />
        ) : null}
      </ul>
    ) : null}
  </section>
);

export default KindSection;
