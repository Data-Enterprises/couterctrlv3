import { useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../components-dev/modals/ResizableModalShell";
import Checkbox from "../../../components-dev/Checkbox";

/**
 * The three things you can do with a read file, side by side.
 *
 * They were three buttons on the toolbar — "Export CSV", "Export as orders",
 * "Send" — which said what each one *did* and nothing about how they differ.
 * They differ a lot: two ignore every correction on the page and one does
 * not, two produce a file and one talks to the server, and they carry
 * different rows about different things. None of that fits on a button.
 *
 * Built like every other export modal on the dev tree — the resizable shell,
 * the navy header bar, a list of choices, one action at the foot — because an
 * export modal that looks like itself is one the reader has already learned.
 * What differs here is that the choices need explaining rather than listing,
 * so every one shows what it carries, all the time. Revealing that only for
 * the selected one meant clicking each in turn to compare them, which is the
 * one thing a reader opens this to do.
 *
 * The house `Checkbox`, not a native radio. These are mutually exclusive and
 * a radio group is the stricter semantic, but the native control looks like
 * the operating system rather than like this app, and its focus ring was
 * being clipped by the list's own scroll box. Exclusivity lives in the
 * handler instead: picking one is picking one.
 */

type Choice = "raw" | "orders" | "send";

interface Props {
  onClose: () => void;
  /** The file's own records, as decoded. */
  onRaw: () => void;
  /** The POS order layout, corrections applied. */
  onOrders: () => void;
  /** Upload for decoding and archiving, corrections written in. */
  onSend: () => void;
  sending: boolean;
  fileName: string;
  /** Only the send is per store -- the endpoint takes one. The orders export
   *  does not ask, because a file carries several AWG stores and the
   *  pipeline maps them off `storenumber`. */
  storeChosen: boolean;
  handEditCount: number;
  suggestedApplied: boolean;
}

const InvoiceExportModal = ({
  onClose,
  onRaw,
  onOrders,
  onSend,
  sending,
  fileName,
  storeChosen,
  handEditCount,
  suggestedApplied,
}: Props) => {
  const [choice, setChoice] = useState<Choice>("orders");

  /** What the corrected choices are carrying, in words, or null when there is
   *  nothing to carry — in which case "corrections applied" would be
   *  promising something that does not exist. */
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

  const OPTIONS: {
    id: Choice;
    title: string;
    caption: string;
    points: string[];
    needsStore?: boolean;
  }[] = [
    {
      id: "raw",
      title: "Raw CSV",
      caption: "Every record in the file, exactly as decoded",
      points: [
        "One row per record — lines, deals, allowances, taxes, the lot",
        "Nothing summed and nothing derived",
        "Corrections are NOT applied. This is what the file says, which is the thing to compare a corrected invoice against.",
      ],
    },
    {
      id: "orders",
      title: "Orders CSV",
      caption: "The invoices in the POS order layout, ready to load",
      points: [
        "One row per billed line, one order per invoice",
        "Costs worked out per case, money at four places",
        "storeid and vendor_id are left for the pipeline — the file carries AWG's own store number per invoice, and a file can hold several stores",
        carrying
          ? `Corrections ARE applied — ${carrying}`
          : "Corrections are applied, when there are any",
        "Named _orders_corrected.csv when the suggested set is on, so two downloads are never mistaken for each other",
      ],
    },
    {
      id: "send",
      title: "Send",
      caption: "Upload the file for the server to decode and archive",
      points: [
        "Goes to invoices/parse_edi against the chosen store",
        carrying
          ? `Corrections ARE applied — the file is rebuilt with ${carrying} written into it`
          : "Corrections are written into the file when there are any",
        "The server decodes what it receives, so what it archives is what you corrected",
      ],
      needsStore: true,
    },
  ];

  const selected = OPTIONS.find((o) => o.id === choice)!;
  const blocked = selected.needsStore && !storeChosen;
  const canGo = !blocked && !sending;

  const run = () => {
    if (choice === "raw") onRaw();
    else if (choice === "orders") onOrders();
    else onSend();
  };

  return (
    <ResizableModalShell
      onClose={onClose}
      // v2: the default grew when nothing collapsed any more. The key
      // carries the version because a stored size wins over a default, so
      // anyone who had opened the old one would never see the new height.
      storageKey="export-modal:awg-invoices:v2"
      defaultWidth={620}
      defaultHeight={820}
    >
      <div className="flex items-center gap-3 bg-brand_navy px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-custom-white">
            Export or send
          </p>
          <p className="truncate text-[10px] text-custom-white/95">
            {fileName}
            {carrying ? ` · carries ${carrying}` : " · nothing corrected"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-custom-white/95 transition-colors hover:text-custom-white"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-content/95">
          Select what to take
        </p>

        {/* px-1 so a focus ring is not shaved off by the scroll box --
            the ring sits outside the control's own 15px. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-1">
          {OPTIONS.map((option) => (
            <div
              key={option.id}
              className="border-b border-gray-100 py-2.5 last:border-b-0"
            >
              {/* The box pairs with the title, so it lines up with the thing
                  it names rather than floating against the middle of a
                  paragraph. */}
              <Checkbox
                checked={choice === option.id}
                onChange={() => setChoice(option.id)}
                label={
                  <span className="text-[13px] font-medium text-content">
                    {option.title}
                  </span>
                }
              />
              <p className="ml-[23px] mt-0.5 text-[11px] text-content/95">
                {option.caption}
              </p>
              <ul className="ml-[23px] mt-1.5 space-y-1">
                {option.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-1.5 text-[11.5px] leading-snug text-content"
                  >
                    <span className="flex-none text-content/95">&middot;</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[11.5px] text-brand_danger">
            {blocked ? "Choose a store first" : ""}
          </span>
          <button
            onClick={run}
            disabled={!canGo}
            className="flex flex-none items-center gap-1.5 rounded-md bg-brand_navy px-3 py-1.5 text-[12px] font-medium text-custom-white transition-colors hover:bg-brand_navy/85 disabled:opacity-40"
          >
            {choice === "send" ? (
              <>
                <ArrowUpTrayIcon className="h-3.5 w-3.5" />
                {sending ? "Sending…" : "Send"}
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                Download CSV
              </>
            )}
          </button>
        </div>
      </div>
    </ResizableModalShell>
  );
};

export default InvoiceExportModal;
