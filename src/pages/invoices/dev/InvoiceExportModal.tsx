import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
} from "@heroicons/react/20/solid";
import Modal from "../../../components-dev/Modal";

/**
 * The three things you can do with a read file, side by side.
 *
 * They were three buttons on the toolbar — "Export CSV", "Export as orders",
 * "Send" — which said what each one *did* and nothing about how they differ.
 * They differ a lot: two of them ignore every correction on the page and one
 * does not, two produce a file and one talks to the server, and they carry
 * different rows about different things.
 *
 * None of that fits in a button. It fits here, where the choice is being
 * made, so nobody has to learn it once and remember it.
 */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** The file's own records, as decoded. */
  onRaw: () => void;
  /** The POS order layout, corrections applied. */
  onOrders: () => void;
  /** Upload for decoding and archiving. */
  onSend: () => void;
  sending: boolean;
  /** Both the orders export and the send are per store. */
  storeChosen: boolean;
  /** How many figures have been typed by hand, and whether the suggested set
   *  is on — named on the two choices that carry them and the one that
   *  does not. */
  handEditCount: number;
  suggestedApplied: boolean;
}

const Choice = ({
  icon,
  name,
  what,
  points,
  action,
  onClick,
  disabled,
  disabledWhy,
  primary = false,
}: {
  icon: React.ReactNode;
  name: string;
  what: string;
  points: string[];
  action: string;
  onClick: () => void;
  disabled?: boolean;
  disabledWhy?: string;
  primary?: boolean;
}) => (
  <div className="rounded-lg border border-gray-200 bg-custom-white p-3.5">
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex-none text-brand_navy">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[14px] font-bold text-content">
          {name}
        </p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-content">{what}</p>
        <ul className="mt-1.5 space-y-0.5">
          {points.map((point) => (
            <li
              key={point}
              className="flex gap-1.5 text-[12px] leading-snug text-content"
            >
              <span className="flex-none text-content/85">&middot;</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
    <div className="mt-3 flex items-center justify-end gap-2">
      {disabled && disabledWhy && (
        <span className="text-[11.5px] text-brand_danger">{disabledWhy}</span>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`flex-none rounded-lg px-3.5 py-2 font-display text-[13px] font-semibold disabled:opacity-50 ${
          primary
            ? "bg-brand_navy text-custom-white hover:bg-brand_navy_hover"
            : "border border-gray-200 bg-custom-white text-content hover:bg-bkg"
        }`}
      >
        {action}
      </button>
    </div>
  </div>
);

const InvoiceExportModal = ({
  isOpen,
  onClose,
  onRaw,
  onOrders,
  onSend,
  sending,
  storeChosen,
  handEditCount,
  suggestedApplied,
}: Props) => {
  /** What the corrected choices are carrying, in words, or null when there is
   *  nothing to carry — in which case saying "with corrections applied" would
   *  be promising something that does not exist. */
  const carrying = (() => {
    const parts: string[] = [];
    if (handEditCount > 0) {
      parts.push(
        `${handEditCount} ${handEditCount === 1 ? "correction" : "corrections"} typed by hand`,
      );
    }
    if (suggestedApplied) parts.push("the suggested corrections");
    return parts.length > 0 ? parts.join(" and ") : null;
  })();

  const noStore = "Choose a store first";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      modalClassName="bg-bkg w-full max-w-[600px]"
    >
      <div className="flex flex-col gap-2.5">
        <div>
          <p className="font-display text-[16px] font-bold text-content">
            Export or send
          </p>
          <p className="mt-0.5 text-[12.5px] text-content">
            {carrying
              ? `This file carries ${carrying}. Only two of these three take them.`
              : "Nothing has been corrected on this file, so all three describe the same figures."}
          </p>
        </div>

        <Choice
          icon={<DocumentTextIcon className="h-5 w-5" />}
          name="Raw CSV"
          what="Every record in the file, exactly as decoded."
          points={[
            "One row per record — lines, deals, allowances, taxes, the lot",
            "Nothing summed and nothing derived",
            "Corrections are NOT applied — this is what the file says, which is the thing to compare a corrected invoice against",
          ]}
          action="Download"
          onClick={onRaw}
        />

        <Choice
          icon={<ArrowDownTrayIcon className="h-5 w-5" />}
          name="Orders CSV"
          what="The invoices in the POS order layout, ready to load."
          points={[
            "One row per billed line, one order per invoice",
            "Costs worked out per case, money at four places",
            carrying
              ? `Corrections ARE applied — ${carrying}`
              : "Corrections are applied, when there are any",
            "Named _orders_corrected.csv when the suggested set is on, so two downloads are never mistaken for each other",
          ]}
          action="Download"
          onClick={onOrders}
          disabled={!storeChosen}
          disabledWhy={noStore}
        />

        <Choice
          icon={<ArrowUpTrayIcon className="h-5 w-5" />}
          name="Send"
          what="Upload the file for the server to decode and archive."
          points={[
            "Goes to invoices/parse_edi against the chosen store",
            carrying
              ? `Corrections ARE applied — the file is rebuilt with ${carrying} written into it`
              : "Corrections are written into the file when there are any",
            "The server decodes what it receives, so what it archives is what you corrected",
          ]}
          action={sending ? "Sending…" : "Send"}
          onClick={onSend}
          disabled={sending || !storeChosen}
          disabledWhy={!storeChosen ? noStore : undefined}
          primary
        />
      </div>
    </Modal>
  );
};

export default InvoiceExportModal;
