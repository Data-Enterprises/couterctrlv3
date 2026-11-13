// Utils
import { KIND_TITLE, type NoteKind } from "../../../content/releaseNotes";
import { KIND_LOOK } from "../utils";

interface NoteRowProps {
  kind: NoteKind;
  text: string;
  /** The page it is on. Left out in the You're here card, which names the
   *  page once. */
  page?: string;
  /** A hairline above every row but the first. */
  ruled: boolean;
}

/** One release note: its kind's icon tile, the page, the sentence. */
const NoteRow = ({ kind, text, page, ruled }: NoteRowProps) => {
  const { Icon, tile } = KIND_LOOK[kind];
  return (
    <li
      className={`flex items-center gap-3 px-3.5 py-2.5 ${
        ruled ? "border-t border-brand_line" : ""
      }`}
    >
      <span
        aria-hidden
        className={`flex h-[26px] w-[26px] flex-none items-center justify-center rounded-md ${tile}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <span className="sr-only">{KIND_TITLE[kind]}: </span>
        {page ? (
          <div className="cc-caps text-[11.5px] text-brand_slate">{page}</div>
        ) : null}
        <p className="m-0 text-[13.5px] leading-normal text-content">{text}</p>
      </div>
    </li>
  );
};

export default NoteRow;
