// Interfaces
import type { Figures } from "../interfaces";

interface ChangeProps {
  now: Figures;
  after: Figures | null;
  pick: (f: Figures) => string;
  unchanged?: boolean;
}

/**
 * One figure, now and after.
 *
 * "Now → after" only on a row the fix will change; a row already at the typed
 * cost says so, rather than showing the same number twice and leaving the
 * reader to spot that nothing moved.
 */
const Change = ({ now, after, pick, unchanged = false }: ChangeProps) => (
  <td className="px-2.5 py-2 text-right tabular-nums text-content whitespace-nowrap">
    {after ? (
      <>
        <span className="text-content/95">{pick(now)}</span>
        <span className="text-content/95"> → </span>
        <span className="font-bold text-severity_watch_text">{pick(after)}</span>
      </>
    ) : (
      <>
        {pick(now)}
        {unchanged && (
          <span className="block text-[10.5px] text-content/95">no change</span>
        )}
      </>
    )}
  </td>
);

export default Change;
