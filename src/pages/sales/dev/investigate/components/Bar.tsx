interface BarProps {
  w?: string;
  h?: number;
}

/* ------------------------------------------------------------------ */
/* Waiting                                                             */
/* ------------------------------------------------------------------ */

/**
 * One shimmering bar, the house shape for a figure on its way.
 *
 * Widths are passed rather than random: a random width reshuffles on every
 * render and makes a waiting block flicker.
 */
const Bar = ({ w = "100%", h = 12 }: BarProps) => (
  <span
    className="block rounded bg-fill_track animate-pulse"
    style={{ width: w, height: h }}
    aria-hidden
  />
);

export default Bar;
