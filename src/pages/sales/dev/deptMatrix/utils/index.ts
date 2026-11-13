/** Distance from 100, in five steps a side. The over-100 ramp is the app's
 *  own heat ramp from `heatColor`; the under-100 ramp is its mirror in the
 *  severity red, because being under is a problem and being over usually is
 *  not — a single symmetric ramp would claim they are the same thing. */
export const UNDER: Array<[string, string]> = [
  ["#f2dede", "#8e1010"],
  ["#e3bcbc", "#7a0d0d"],
  ["#cf8f8f", "#f4f7f8"],
  ["#a83c3c", "#f4f7f8"],
  ["#931010", "#f4f7f8"],
];

/** The over-100 ramp: background and text colour per step. */
export const OVER: Array<[string, string]> = [
  ["#e6f1fb", "#185fa5"],
  ["#b5d4f4", "#0c447c"],
  ["#85b7eb", "#0c447c"],
  ["#378add", "#f4f7f8"],
  ["#185fa5", "#f4f7f8"],
];

/** Index points per shade step, and the band around 100 left unshaded. */
export const STEP = 9;
export const DEPT_BAND = 2;

/** A cell's background and text colour for its index, plain within the band. */
export const shade = (index: number | null, band: number) => {
  if (index === null) return { background: "", color: "" };
  const d = index - 100;
  if (Math.abs(d) <= band) return { background: "", color: "" };
  const step = Math.min(4, Math.floor((Math.abs(d) - band) / STEP));
  const [bg, fg] = d < 0 ? UNDER[step] : OVER[step];
  return { background: bg, color: fg };
};
