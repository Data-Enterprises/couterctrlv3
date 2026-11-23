// Utils
import { money } from "../utils";

// Interfaces
import type { hashTotals } from "../../../utils/deptReport";

interface HashNoteProps {
  hash: ReturnType<typeof hashTotals>;
  compareStoreName: string;
}

/**
 * Fuel, lottery, cash accounts: outside net sales at both stores, so not
 * compared.
 *
 * The store leaves these out of its own net sales, so the Stores tab figure
 * this headline is set beside leaves them out too, and the comparison has to
 * as well or the two disagree. Named because a reader who knows Tupelo sells
 * fuel will look for it.
 */
const HashNote = ({ hash, compareStoreName }: HashNoteProps) => (
  <span>
    Outside net sales at both stores, so not compared:{" "}
    <span className="font-bold tabular-nums">{money(hash.theirs)}</span> at{" "}
    {compareStoreName}
    {hash.names.length > 0 && (
      <span className="text-content/95"> ({hash.names.join(", ")})</span>
    )}
    {hash.mine !== 0 && (
      <>
        {" "}
        &middot;{" "}
        <span className="font-bold tabular-nums">{money(hash.mine)}</span> here
      </>
    )}
    .
  </span>
);

export default HashNote;
