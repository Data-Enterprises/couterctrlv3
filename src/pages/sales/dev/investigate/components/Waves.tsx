/**
 * Which of the three waves are in.
 *
 * The notebook is readable in stages — sales answer the first two tabs and
 * orders and deliveries answer the last two — so a single spinner would be
 * lying in both directions at once. Three lights say which half of the
 * screen is settled and which is still moving.
 */
const Waves = ({ sales, all }: { sales: boolean; all: boolean }) => {
  const lamps = [
    { label: "Sales", lit: sales },
    { label: "Orders", lit: all },
    { label: "Received", lit: all },
  ];
  return (
    <span
      className="hidden lg:flex items-center gap-3 flex-shrink-0"
      role="status"
      aria-label={all ? "All data loaded" : "Loading"}
    >
      {lamps.map((l) => (
        <span key={l.label} className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              l.lit
                ? "bg-severity_ok_text"
                : "bg-severity_watch_text animate-pulse"
            }`}
          />
          <span className="text-[11.5px] text-custom-white/85">{l.label}</span>
        </span>
      ))}
    </span>
  );
};

export default Waves;
