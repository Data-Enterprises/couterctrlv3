import { useRef, useState } from "react";
import { useAppSelector } from "../../../hooks";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/20/solid";
import Modal from "../../../components-dev/Modal";
import TextField from "../../../components-dev/inputs/TextField";
import SelectFilter from "../../../components-dev/filters/SelectFilter";
import { openNew } from "../../../features/dev/devTicketsSlice";
import type { TicketPriority } from "../../../api/tickets";
import type { TicketsCtx } from "./hooks";
import { attachmentProblem, fileSize } from "./ticketsUtils";
import {
  consolidate,
  getPageCalls,
  groupAsFile,
  withinBudget,
  type CallGroup,
} from "../../../utils/pageCalls";
import { originOf, searchSummary, suggestedTitle } from "./ticketOrigin";
import Checkbox from "../../../components-dev/Checkbox";

/**
 * Filing one.
 *
 * Two fields are required and the rest the queue works out for itself. There
 * is no company picker: the ticket's company is derived from whoever is
 * filing, and sending one that is not their own is a 400 rather than a silent
 * misfiling — so offering the choice would only be a way to fail.
 *
 * No assignee either. It lands in the queue and a tech takes it.
 *
 * Opened from another page's "Report an issue", it arrives knowing three
 * things nobody had to type: which page, which category that page belongs to,
 * and what was last asked for. The fourth — the response behind it — is
 * offered rather than attached, because it is the client's data and they
 * should see it leave.
 */
const NewTicketModal = ({
  ctx,
  from,
  onClose,
}: {
  ctx: TicketsCtx;
  /** Where the reporter was when they raised it. Absent when the form is
   *  opened from the help desk itself, which is nowhere in particular. */
  from?: { from: string; page?: string; area?: string } | null;
  /** Filing from another page closes back to that page rather than to the
   *  queue, so the caller says what closing means. */
  onClose?: () => void;
}) => {
  const search = useAppSelector((state) => state.search);

  const origin = from?.from
    ? originOf({ reportFrom: from.from, page: from.page, area: from.area })
    : null;
  const summary = origin ? searchSummary(search, origin.href) : null;
  /**
   * Everything the page fetched, one entry per endpoint, read once at mount.
   *
   * Once, because a call made while the form is open is the form's own doing
   * rather than anything the client was looking at. Grouped, because a paged
   * fetch is several calls to one path and listing them separately makes one
   * table look like twelve problems.
   *
   * Trimmed to a budget here rather than at send: somebody should not tick a
   * box for something that is going to be dropped.
   */
  const [{ kept, dropped }] = useState(() =>
    from?.from
      ? withinBudget(consolidate(getPageCalls()))
      : { kept: [] as CallGroup[], dropped: [] as CallGroup[] },
  );
  const [skip, setSkip] = useState<Set<string>>(new Set());
  // Open when there is little to read, folded when the list would push the
  // fields people actually have to fill in off the screen.
  const [evidenceOpen, setEvidenceOpen] = useState(kept.length <= 3);
  const chosen = kept.filter((g) => !skip.has(g.key));

  const [title, setTitle] = useState(origin ? suggestedTitle(origin) : "");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [category, setCategory] = useState(() => {
    if (!origin?.category) return "";
    const match = ctx.lookups?.categories?.find(
      (c) => c.name === origin.category,
    );
    return match ? String(match.id) : "";
  });
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  const limits = ctx.lookups?.attachments;

  /**
   * Take what the picker gave, minus what it cannot send.
   *
   * De-duplicated by name because a picker can be opened repeatedly, and
   * checked here as well as by the endpoint — a ticket should not end up
   * filed with half its evidence missing.
   */
  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const chosen = Array.from(list);
    const problem = chosen.map((f) => attachmentProblem(f, limits)).find(Boolean);
    setFileError(problem ?? null);
    const good = chosen.filter((f) => !attachmentProblem(f, limits));
    setFiles((have) => {
      const names = new Set(have.map((f) => f.name));
      return [...have, ...good.filter((f) => !names.has(f.name))];
    });
    // Without this, picking the same file twice fires no change event.
    if (picker.current) picker.current.value = "";
  };

  const close = () => (onClose ? onClose() : ctx.dispatch(openNew(false)));
  const ready = title.trim() !== "" && description.trim() !== "";

  const priorities = (ctx.lookups?.priorities ?? [
    "low",
    "normal",
    "high",
    "urgent",
  ]).map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }));

  const categories = [
    { value: "", label: "None" },
    ...(ctx.lookups?.categories ?? []).map((c) => ({
      value: String(c.id),
      label: c.name,
    })),
  ];

  return (
    <Modal
      isOpen
      onClose={close}
      modalClassName="bg-card_bg w-[620px] max-w-[94vw] max-h-[88vh] flex flex-col"
    >
      {/* Header, body, footer. The form is taller than a laptop screen once a
          page has half a dozen datasets on it, so only the middle moves: the
          heading says what this is and Send it is the control that must never
          scroll out of reach, and neither is any use halfway up. */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2.5">
        <h2 className="text-[17px] font-semibold">New ticket</h2>
        <p className="text-[12.5px] text-content/85 mt-1">
          {origin?.page
            ? `About ${origin.page}. Two fields are needed; the rest is filled in.`
            : "Two fields are needed. Everything else the help desk works out."}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto thin-scrollbar px-4 pb-4">

        {/*
          * What came with you from the page.
          *
          * Shown rather than asked about. "Is this about your last search?"
          * makes somebody remember; a line naming the store and the dates
          * lets them check, and a tick they can clear means the data leaves
          * only because they let it.
          */}
        {origin && (summary || kept.length > 0) && (
          <div className="rounded-lg border border-brand_line bg-bkg px-3 py-2.5">
            <div className="font-mono text-[9.5px] uppercase tracking-wider text-content/85">
              From {origin.area ? `${origin.area} · ` : ""}
              {origin.page ?? origin.href}
            </div>

            {summary && (
              <div className="mt-1 text-[12.5px] font-medium">{summary}</div>
            )}

            {kept.length > 0 && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => setEvidenceOpen((v) => !v)}
                  aria-expanded={evidenceOpen}
                  className="flex w-full items-center gap-1.5 text-left text-[11.5px] text-content/85"
                >
                  <span className="flex-1">
                    Attach what this page loaded ({chosen.length} of{" "}
                    {kept.length})
                  </span>
                  <ChevronDownIcon
                    className={`h-4 w-4 flex-none transition-transform duration-200 motion-reduce:transition-none ${
                      evidenceOpen ? "" : "-rotate-90"
                    }`}
                  />
                </button>

                {/* Its own scroll, capped: a page with a dozen datasets
                    should not be the reason somebody cannot reach the
                    description field. */}
                {evidenceOpen && (
                  <div className="mt-1.5 flex max-h-[168px] flex-col gap-1 overflow-y-auto thin-scrollbar pr-1">
                    {kept.map((group) => (
                      <Checkbox
                        key={group.key}
                        checked={!skip.has(group.key)}
                        onChange={(on) =>
                          setSkip((have) => {
                            const next = new Set(have);
                            if (on) next.delete(group.key);
                            else next.add(group.key);
                            return next;
                          })
                        }
                        label={
                          <span className="min-w-0 truncate text-[12px] text-content">
                            {group.label}
                          </span>
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Named rather than silently missing: a tech reading the
                    ticket should know something was too big to send, not
                    wonder why a dataset is absent. */}
                {/* Named rather than silently missing: a tech reading the
                    ticket should know something did not come, not wonder why
                    a dataset is absent. */}
                {dropped.length > 0 && (
                  <div className="mt-1.5 text-[11px] text-content/85">
                    Too large to send —{" "}
                    {dropped.map((g) => g.label).join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <TextField
          label="Title"
          value={title}
          placeholder="Printer jam at lane 3"
          onChange={setTitle}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-medium">What is happening</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Receipt printer stops after about ten receipts..."
            className="w-full border border-brand_line rounded-lg px-3 py-2 text-[13.5px] resize-none bg-custom-white"
          />
          <span className="text-[11px] text-content/85">
            This becomes the first message in the thread, so the tech reads it
            where the conversation is.
          </span>
        </label>

        <div className="flex gap-3">
          <label className="flex-1 flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium">Priority</span>
            <SelectFilter
              plain
              options={priorities}
              value={priority}
              onChange={(value) => setPriority((value || "normal") as TicketPriority)}
              className="w-full"
            />
          </label>
          <label className="flex-1 flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium">Category</span>
            <SelectFilter
              plain
              searchable
              searchPlaceholder="Find a category..."
              placeholder="None"
              options={categories}
              value={category}
              onChange={setCategory}
              className="w-full"
            />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[12.5px] font-medium">Screenshots</span>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              ref={picker}
              type="file"
              multiple
              accept={limits?.extensions.join(",")}
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => picker.current?.click()}
              className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
            >
              Choose files
            </button>
            <span className="text-[11.5px] text-content/85">
              {limits
                ? `${limits.extensions.join(" ")} · up to ${fileSize(limits.maxBytes)}`
                : "A screenshot is usually the most useful thing you can send."}
            </span>
          </div>

          {files.map((one) => (
            <div
              key={one.name}
              className="flex items-center gap-2 bg-custom-white border border-brand_line rounded-lg px-3 py-1.5"
            >
              <span className="font-mono text-[12px] flex-1 min-w-0 truncate">
                {one.name}
              </span>
              <span className="text-[11.5px] text-content/85">
                {fileSize(one.size)}
              </span>
              <button
                type="button"
                onClick={() =>
                  setFiles((have) => have.filter((f) => f.name !== one.name))
                }
                aria-label={`Remove ${one.name}`}
                className="text-content/85 hover:text-content transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}

          {fileError && (
            <span className="text-[11.5px] text-amber-900">{fileError}</span>
          )}
        </div>

        <p className="text-[11.5px] text-content/85 bg-custom-white border border-brand_line rounded-lg px-3 py-2 m-0">
          It files under your own company and lands in the queue unassigned.
        </p>
      </div>

      <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-brand_line px-4 py-3">
          <button
            type="button"
            onClick={close}
            className="text-[12.5px] font-medium px-4 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              void ctx.file(
                {
                  title,
                  description,
                  priority,
                  category_id: category ? Number(category) : null,
                },
                chosen.length ? [...files, ...chosen.map(groupAsFile)] : files,
                // Filed from another page: there is no pane here to open it
                // into, so the form closes and the toast is the receipt.
                onClose,
              )
            }
            disabled={!ready || ctx.working}
            className="text-[12.5px] font-semibold px-5 py-1.5 rounded-lg bg-brand_navy text-custom-white hover:bg-brand_navy_hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {ctx.working
              ? files.length
                ? "Sending and attaching..."
                : "Sending..."
              : "Send it"}
          </button>
      </div>
    </Modal>
  );
};

export default NewTicketModal;
