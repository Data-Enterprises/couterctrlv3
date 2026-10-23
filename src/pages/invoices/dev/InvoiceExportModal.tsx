import { useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../components-dev/modals/ResizableModalShell";

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
 * the navy header bar, a radio list, one action at the foot — because an
 * export modal that looks like itself is one the reader has already learned.
 * What differs here is that the choices need explaining rather than listing,
 * so each carries a line always and its detail when it is the one selected.
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
  /** Both the orders export and the send are per store. */
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
        carrying
          ? `Corrections ARE applied — ${carrying}`
          : "Corrections are applied, when there are any",
        "Named _orders_corrected.csv when the suggested set is on, so two downloads are never mistaken for each other",
      ],
      needsStore: true,
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
      storageKey="export-modal:awg-invoices:v1"
      defaultWidth={560}
      defaultHeight={520}
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

        <div className="min-h-0 flex-1 overflow-y-auto">
          {OPTIONS.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-start gap-2.5 border-b border-gray-100 py-2.5 last:border-b-0"
            >
              <input
                type="radio"
                checked={choice === option.id}
                onChange={() => setChoice(option.id)}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-content">
                  {option.title}
                </p>
                <p className="mt-0.5 text-[11px] text-content/95">
                  {option.caption}
                </p>

                {/* The detail belongs to the one being chosen. All three sets
                    at once was a wall of prose on a modal whose job is a
                    choice. */}
                {choice === option.id && (
                  <ul className="mt-1.5 space-y-1">
                    {option.points.map((point) => (
                      <li
                        key={point}
                        className="flex gap-1.5 text-[11.5px] leading-snug text-content"
                      >
                        <span className="flex-none text-content/95">
                          &middot;
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </label>
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
