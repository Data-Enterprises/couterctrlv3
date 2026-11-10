// Utils
import { TEMPLATE } from "../utils";

interface HeadProps {
  cols: string[];
  template?: string;
}

/** A section's column headings, on the same grid as its rows. */
const Head = ({ cols, template }: HeadProps) => (
  <div
    className="grid gap-2.5 pl-1 py-1.5 border-b border-gray-100 text-[11.5px] font-semibold uppercase tracking-wide text-content/95"
    style={{ gridTemplateColumns: template ?? TEMPLATE[cols.length] }}
  >
    {cols.map((c, i) => (
      <span key={c} className={i === 0 ? "" : "text-right"}>
        {c}
      </span>
    ))}
  </div>
);

export default Head;
