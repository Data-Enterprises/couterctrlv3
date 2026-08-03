/** Shared pieces for the two legal panels (Terms and Conditions, Privacy
 *  Policy). Both documents arrive as JSON with the same two problems — lists
 *  that carry no lead-in sentence, and all-caps blocks that vanish when set
 *  inline — so both solve them the same way. */

/** All-caps blocks are shouted in the source precisely to be noticed, and
 *  inline caps disappear in a scrolling panel. Set them apart instead. */
export const Notice = ({ children }: { children: string }) => (
  <p className="text-[12.5px] leading-[1.6] font-semibold text-brand_navy bg-brand_paper border border-brand_line rounded-[10px] px-4 py-3.5 my-4">
    {children}
  </p>
);

export const Bullets = ({
  label,
  items,
  tone = "normal",
}: {
  label?: string;
  items: string[];
  /** `muted` is used for lists of things explicitly NOT collected, so they
   *  never read as a list of things that are. */
  tone?: "normal" | "muted";
}) => (
  <div className="mt-3.5">
    {label && (
      <span className="block font-mono text-[9.5px] font-semibold tracking-[0.13em] uppercase text-brand_green_dark mb-2">
        {label}
      </span>
    )}
    <ul className="list-none">
      {items.map((it) => (
        <li
          key={it}
          className={`relative text-[13.8px] leading-[1.6] pl-4 py-[3px] before:content-[''] before:absolute before:left-0 before:top-[11px] before:w-1.5 before:h-1.5 before:rounded-full ${
            tone === "muted"
              ? "text-brand_slate_2 before:bg-brand_line"
              : "text-brand_slate before:bg-brand_line_2"
          }`}
        >
          {it}
        </li>
      ))}
    </ul>
  </div>
);
