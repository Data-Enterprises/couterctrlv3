

interface KpisProps {
  cells: {
      label: string;
      value: string;
      flagged?: boolean;
      onClick?: () => void;
    }[];
}

/** Three equal tiles, on the KPI strip the rest of the app uses so a nested
 *  strip still reads as native — with one deliberate variation: the values are
 *  `font-medium`, not the canonical `font-bold`. This strip sits inside a row
 *  that is itself inside a section, and bold at that depth competes with the
 *  headline figures above it. Not drift; leave it. */
const Kpis = ({ cells }: KpisProps) => (
  <div className="grid grid-cols-3 divide-x divide-brand_navy/15 border-t border-brand_navy/15">
    {cells.map((c) => (
      <div
        key={c.label}
        onClick={c.onClick}
        className={`px-2 py-1.5 text-center min-w-0 ${
          c.onClick ? "cursor-pointer hover:bg-brand_navy/[0.06]" : ""
        }`}
      >
        <div className="text-[10px] cc-caps-strong">
          {c.label}
        </div>
        <div
          className={`text-[12px] font-medium truncate ${
            c.flagged
              ? "text-severity_watch_text"
              : c.onClick
                ? "text-brand_navy underline underline-offset-2"
                : "text-content"
          }`}
        >
          {c.value}
        </div>
      </div>
    ))}
  </div>
);

export default Kpis;
