// Utils
import { smallerText } from "../utils";

// Interfaces
import type { ReleaseNote } from "../../../content/releaseNotes";

// Components
import NoteRow from "./NoteRow";

interface HereCardProps {
  /** The page the panel was opened from. */
  page: string;
  notes: ReleaseNote[];
  /** That page's smaller fixes, drawn as one closing row. */
  smaller: number;
}

/** The page the panel was opened from, always open at the top. */
const HereCard = ({ page, notes, smaller }: HereCardProps) => (
  <section
    data-testid="release-notes-here"
    className="flex-none overflow-hidden rounded-xl border cc-row-selected"
  >
    <div className="flex items-center gap-2 px-3.5 pb-1 pt-3">
      <h3 className="m-0 text-[15px] font-bold text-content">{page}</h3>
      <span className="rounded-full bg-brand_navy px-2 py-0.5 text-[11px] font-semibold text-custom-white">
        You&rsquo;re here
      </span>
    </div>
    <ul className="m-0 list-none p-0 pb-1">
      {notes.map((n) => (
        <NoteRow key={`${n.page}|${n.text}`} kind={n.kind} text={n.text} ruled={false} />
      ))}
      {smaller > 0 ? (
        <NoteRow key="more" kind="fix" text={smallerText(smaller)} ruled={false} />
      ) : null}
    </ul>
  </section>
);

export default HereCard;
