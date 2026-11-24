// Utils
import { applyStoreNumberToName } from "../../utils/ledgerUtils";
import { type ShareRow } from "../utils/shareBalance";
import { BALANCE_TONE, changeText, COLS, widthOf } from "../utils";

interface ShareStoreRowProps {
  row: ShareRow;
  selected: boolean;
  /** What the share move was worth, signed and formatted. */
  worth: string;
  onPick: () => void;
}

/** One store in the share balance: its name, its share bar against the slice
 *  it usually takes, and its share, change and worth. Clicking it reads that
 *  store into the rail. */
const ShareStoreRow = ({
  row: r,
  selected,
  worth,
  onPick,
}: ShareStoreRowProps) => (
  <button
    onClick={onPick}
    className={`w-full grid items-center gap-2 px-1 py-2.5 border-l-2 border-b border-b-line_hair text-left transition-colors ${
      selected ? "cc-row-selected" : "border-transparent hover:bg-fill_soft"
    }`}
    style={{ gridTemplateColumns: COLS }}
  >
    {/* Co-located stores share one storeid, so the name resolves identically
        for both and only the NUMBER tells them apart. Without this the
        falling store wore its neighbour's name. */}
    <span className="min-w-0 text-[12px] font-medium text-content truncate">
      {applyStoreNumberToName(r.storeName, r.storeNumber, r.storeNumbersForId)}
    </span>

    {/* The tick is the slice it usually takes, on the same scale. The gap
        between bar end and tick IS the change, before anybody reads a number
        — and the bar's colour is the band, which is what the section headings
        used to say. */}
    <span className="relative h-4 rounded bg-bkg block">
      <span
        className={`absolute left-0 top-0 bottom-0 rounded-l ${BALANCE_TONE[r.standing].bar}`}
        style={{ width: widthOf(r.sharePct) }}
      />
      <span
        className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-content"
        style={{ left: widthOf(r.usualPct) }}
      />
    </span>

    <span className="flex justify-end">
      <span className="text-[12.5px] font-semibold px-1.5 py-1 rounded text-center whitespace-nowrap tabular-nums bg-fill_muted text-content">
        {r.sharePct.toFixed(1)}%
      </span>
    </span>
    <span className="flex justify-end">
      <span
        className={`text-[12.5px] font-semibold px-1.5 py-1 rounded text-center whitespace-nowrap tabular-nums ${BALANCE_TONE[r.standing].pill}`}
      >
        {changeText(r.changePct)}
      </span>
    </span>
    <span className="flex justify-end">
      <span
        className={`text-[12.5px] font-semibold px-1.5 py-1 rounded text-center whitespace-nowrap tabular-nums ${BALANCE_TONE[r.standing].pill}`}
      >
        {worth}
      </span>
    </span>
  </button>
);

export default ShareStoreRow;
