// Hooks
import { useEffect, useRef, useState } from "react";

// Redux
import { openClosing } from "../../../../features/dev/devTicketsSlice";

// Utils
import {
  PRIORITY_CLASS,
  STATUS_CLASS,
  STATUS_LABEL,
  attachmentProblem,
  fileSize,
  resolutionLabel,
  visibleLabels,
  stampText,
  whenText,
} from "../utils/ticketsUtils";
import { storeFullText, storesOf } from "../utils";

// Interfaces
import type { TicketStatus } from "../../../../api/tickets";
import type { TicketsCtx } from "../hooks";

// Components
import { CheckCircleIcon, PaperClipIcon } from "@heroicons/react/24/outline";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import SelectFilter from "../../../../components-dev/filters/SelectFilter";
import CheckBox from "../../../../components-dev/inputs/CheckBox";
import EditStoresModal from "./modals/EditStoresModal";

const TicketDetail = ({ ctx }: { ctx: TicketsCtx }) => {
  const [draft, setDraft] = useState("");
  const [internal, setInternal] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [filesOpen, setFilesOpen] = useState(false);
  const [storesOpen, setStoresOpen] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  /** Was the reader at the bottom before this batch arrived? */
  const wasAtBottom = useRef(true);

  const ticket = ctx.detail;
  const ticketId = ctx.selectedId;
  const commentCount = ctx.comments.length;

  /**
   * Polls every five seconds while the pane is open and the tab is visible.
   * There is no push (prod runs two tasks); `inFlight` stops overlapping calls.
   */
  useEffect(() => {
    if (!ticketId) return;
    let inFlight = false;
    const tick = () => {
      if (inFlight || document.visibilityState !== "visible") return;
      inFlight = true;
      void ctx.poll().finally(() => {
        inFlight = false;
      });
    };
    const handle = window.setInterval(tick, 5000);
    return () => window.clearInterval(handle);
  }, [ticketId]);

  /**
   * Follow the conversation, unless the reader has gone looking for
   * something. New messages scroll to the bottom
   */
  useEffect(() => {
    const box = thread.current;
    if (box && wasAtBottom.current) box.scrollTop = box.scrollHeight;
  }, [commentCount]);

  if (!ticket) {
    return (
      <div className="flex-1 min-h-0 overflow-hidden rounded-xl bg-custom-white shadow-lg flex items-center justify-center text-center px-6">
        <div className="max-w-[40ch]">
          <div className="text-[13px] font-semibold">
            {ctx.detailLoading ? "Opening..." : "Pick a ticket"}
          </div>
          <div className="text-[12.5px] text-content/85 mt-1.5">
            The thread, the files and what you can do to it all arrive in one
            call.
          </div>
        </div>
      </div>
    );
  }

  const closed = ticket.status === "closed";

  const send = () => {
    ctx.reply(draft, internal);
    setDraft("");
    setInternal(false);
  };

  const chooseFile = (file: File | undefined) => {
    if (!file) return;
    const problem = attachmentProblem(file, ctx.lookups?.attachments);
    setFileError(problem);
    if (!problem) ctx.attach(file);
  };

  const statusOptions = (
    ctx.lookups?.statuses ?? ["open", "in_progress", "waiting", "closed"]
  ).map((s) => ({ value: s, label: STATUS_LABEL[s] }));

  // No empty row here: SelectFilter draws one from `placeholder` already.
  const assigneeOptions = [
    ...ctx.assignees
      .filter((a) => a.is_active || a.userid === ticket.assignee_id)
      .map((a) => ({
        value: String(a.userid),
        // An inactive tech still renders, so a ticket assigned to someone
        // since deactivated shows a name rather than a gap.
        label: a.is_active ? a.name : `${a.name} (inactive)`,
      })),
  ];

  return (
    <div className="flex-1 min-h-0 overflow-hidden rounded-xl bg-custom-white shadow-lg flex flex-col">
      {/* The card's header: number, title, and the status and priority pills. */}
      <div className="flex-shrink-0 rounded-t-xl bg-brand_navy text-custom-white px-4 py-3 flex items-center gap-2.5 flex-wrap">
        <span className="font-mono text-[12.5px] text-custom-white/85">
          {ticket.ticket_number}
        </span>
        <h2 className="text-[16px] font-semibold flex-1 min-w-0 truncate">
          {ticket.title}
        </h2>
        <span
          className={`text-[11.5px] font-semibold rounded px-2 py-0.5 ${STATUS_CLASS[ticket.status]}`}
        >
          {STATUS_LABEL[ticket.status]}
        </span>
        <span
          className={`text-[11.5px] font-semibold rounded px-2 py-0.5 ${
            PRIORITY_CLASS[ticket.priority] ?? PRIORITY_CLASS.normal
          }`}
        >
          {ticket.priority[0].toUpperCase() + ticket.priority.slice(1)}
        </span>
      </div>

      <div className="flex-shrink-0 px-4 py-2.5 bg-custom-white border-b border-brand_line flex flex-col gap-2">
        {/* The ticket's own facts, under the header that names it. */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-content/85">
          {ctx.isTech && ticket.company_name && (
            <span className="font-semibold text-content">
              {ticket.company_name}
            </span>
          )}
          <span>opened by {ticket.opened_by_name}</span>
          <span aria-hidden>·</span>
          <span>{stampText(ticket.created_at)}</span>
          <span aria-hidden>·</span>
          <span>updated {whenText(ticket.updated_at)}</span>
          {ticket.category_name && (
            <>
              <span aria-hidden>·</span>
              <span>{ticket.category_name}</span>
            </>
          )}
          {/* Which stores, in full: they decide which managers can see it.
              Drawn only once the API sends them. */}
          {ticket.stores && (
            <>
              <span aria-hidden>·</span>
              <span className="font-medium text-content">
                {storeFullText(storesOf(ticket))}
              </span>
            </>
          )}
          {/* Who has it, for the readers who have no assign control below —
              a client, and a tech without canManage. */}
          {!ctx.canManage && (
            <>
              <span aria-hidden>·</span>
              <span>
                {ticket.assigned_tech
                  ? `with ${ticket.assigned_tech}`
                  : "unassigned"}
              </span>
            </>
          )}
          {visibleLabels(ticket).map((l) => (
            <span
              key={l.id}
              className="rounded px-1.5 py-[1px] text-[10.5px] font-semibold"
              style={{ background: `${l.color}22`, color: l.color }}
            >
              {l.name}
            </span>
          ))}
        </div>

        {ctx.canManage && (
          <div className="flex items-center gap-2 flex-wrap">
            {ticket.assignee_id !== ctx.userid && !closed && (
              <button
                type="button"
                onClick={() => ctx.assign(ctx.userid)}
                disabled={ctx.working}
                className="text-[12.5px] font-semibold px-3 py-1.5 rounded-lg bg-brand_navy text-custom-white hover:bg-brand_navy_hover transition-colors disabled:opacity-40"
              >
                Take it
              </button>
            )}
            <SelectFilter
              plain
              searchable
              searchPlaceholder="Find a tech..."
              placeholder="Unassigned"
              options={assigneeOptions}
              value={ticket.assignee_id ? String(ticket.assignee_id) : ""}
              onChange={(value) => ctx.assign(value ? Number(value) : null)}
              className="w-[190px]"
            />
            <SelectFilter
              plain
              placeholder="Status"
              options={statusOptions}
              value={ticket.status}
              onChange={(value) => {
                // Closing is the one move that needs something first.
                if (value === "closed") ctx.dispatch(openClosing(true));
                else if (value) ctx.move(value as TicketStatus);
              }}
              className="w-[160px]"
            />
            {ticket.stores && (
              <button
                type="button"
                onClick={() => setStoresOpen(true)}
                disabled={ctx.working}
                title="Change which stores this ticket is about"
                className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors disabled:opacity-40"
              >
                Edit stores
              </button>
            )}
          </div>
        )}
      </div>

      {/* A closed ticket says so plainly: nobody is working on it. */}
      {closed && (
        <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 bg-brand_green_tint border-b border-brand_line">
          <CheckCircleIcon className="w-4 h-4 text-brand_green_darker flex-shrink-0" />
          <span className="text-[12.5px] font-semibold text-brand_green_darker">
            Closed{ticket.closed_at ? ` ${stampText(ticket.closed_at)}` : ""}
          </span>
          {resolutionLabel(ticket) && (
            <span className="text-[11.5px] text-brand_green_darker">
              · {resolutionLabel(ticket)}
            </span>
          )}
          <div className="flex-1" />
          {ctx.canManage && (
            <button
              type="button"
              onClick={() => ctx.move("open")}
              disabled={ctx.working}
              className="text-[11.5px] font-semibold text-brand_green_darker underline underline-offset-2 disabled:opacity-40"
            >
              Reopen it
            </button>
          )}
        </div>
      )}

      {/* The thread and the files share this box; the files open over the
          foot of the thread rather than after it. */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={thread}
          onScroll={(e) => {
            const box = e.currentTarget;
            wasAtBottom.current =
              box.scrollHeight - box.scrollTop - box.clientHeight < 80;
          }}
          // Leaves room for the collapsed Files bar, so it never covers the
          // newest message.
          className={`h-full overflow-y-auto thin-scrollbar px-4 pt-3 flex flex-col gap-3 ${
            ctx.attachments.length > 0 ? "pb-14" : "pb-3"
          }`}
        >
          {ctx.comments.map((comment) => {
            /*
             * Yours on the right, theirs on the left. An internal note keeps
             * its amber on either side: a different audience, not a speaker.
             */
            const mine = comment.userid === ctx.userid;
            return (
              <div
                key={comment.id}
                className={`flex flex-col gap-1 max-w-[82%] ${
                  mine ? "self-end items-end" : "self-start items-start"
                }`}
              >
                <div className="flex items-baseline gap-2 flex-wrap px-1">
                  <span className="text-[12.5px] font-semibold">
                    {mine ? "You" : comment.author_name}
                  </span>
                  <span className="text-[11px] text-content/85">
                    {stampText(comment.created_at)}
                  </span>
                </div>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 ${
                    mine ? "rounded-br-sm" : "rounded-bl-sm"
                  } ${
                    comment.is_internal
                      ? "bg-amber-50 border border-amber-200"
                      : mine
                        ? "bg-brand_navy text-custom-white"
                        : "bg-row_selected border border-brand_line"
                  }`}
                >
                  {comment.is_internal && (
                    <div className="text-[10.5px] font-semibold uppercase tracking-wide text-amber-900 mb-1">
                      Internal note — never sent to a client
                    </div>
                  )}
                  <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap m-0">
                    {comment.comment}
                  </p>
                </div>
              </div>
            );
          })}

          {ctx.comments.length === 0 && !ctx.detailLoading && (
            <p className="text-[12.5px] text-content/85">
              Nothing in the thread yet.
            </p>
          )}
        </div>

        {ctx.attachments.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 border-t border-brand_line bg-custom-white shadow-[0_-4px_12px_rgb(var(--color-brand-navy)/0.08)]">
            <button
              type="button"
              onClick={() => setFilesOpen((v) => !v)}
              aria-expanded={filesOpen}
              className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-bkg"
            >
              <PaperClipIcon className="h-3.5 w-3.5 flex-shrink-0 text-content/85" />
              <span className="flex-1 text-[10.5px] font-semibold uppercase tracking-wide text-content/85">
                Files · {ctx.attachments.length}
              </span>
              <ChevronUpIcon
                className={`h-4 w-4 flex-shrink-0 text-content/85 transition-transform duration-300 motion-reduce:transition-none ${
                  filesOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/*
             * 0fr to 1fr rather than a height, so a list of any length opens
             * at the same speed without being measured.
             */}
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
              style={{ gridTemplateRows: filesOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <div className="flex max-h-[45vh] flex-col gap-1.5 overflow-y-auto thin-scrollbar px-4 pb-3">
                  {ctx.attachments.map((file) => (
                    <div key={file.id} className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => ctx.openAttachment(file.id)}
                        className="truncate font-mono text-[12px] text-brand_navy_hover underline underline-offset-2"
                      >
                        {file.original_filename}
                      </button>
                      <span className="flex-shrink-0 text-[11.5px] text-content/85">
                        {fileSize(file.file_size)} · {file.uploaded_by_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/*
       * A closed ticket has no composer, for anybody. A tech reopens it from
       * the strip above; a client files a new ticket.
       */}
      {!closed && (
        <div className="flex-shrink-0 border-t border-brand_line p-3 flex flex-col gap-2">
          <label htmlFor="ticket-reply" className="sr-only">
            Write a reply
          </label>
          <textarea
            id="ticket-reply"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder={
              ctx.isTech
                ? "Write a reply, or an internal note"
                : "Write a reply — a screenshot is usually the most useful thing you can send"
            }
            className="w-full border border-brand_line rounded-lg px-3 py-2 text-[13.5px] resize-none bg-custom-white"
          />
          <div data-help="reply" className="flex items-center gap-3 flex-wrap">
            {ctx.canManage && (
              <CheckBox
                id={2}
                idExtension="internal-note"
                label="Internal note"
                value={internal}
                onChange={(value) => setInternal(Boolean(value))}
                className="text-[12.5px] cursor-pointer select-none"
              />
            )}
            <div className="flex-1" />
            {fileError && (
              <span className="text-[11.5px] text-amber-900">{fileError}</span>
            )}
            <input
              ref={picker}
              type="file"
              className="hidden"
              onChange={(e) => chooseFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => picker.current?.click()}
              disabled={ctx.working}
              className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors disabled:opacity-40"
            >
              Attach
            </button>
            <button
              type="button"
              onClick={send}
              disabled={ctx.working || draft.trim() === ""}
              className="text-[12.5px] font-semibold px-4 py-1.5 rounded-lg bg-brand_navy text-custom-white hover:bg-brand_navy_hover transition-colors disabled:opacity-40"
            >
              {internal ? "Post note" : "Reply"}
            </button>
          </div>
        </div>
      )}

      {storesOpen && ctx.canManage && (
        <EditStoresModal
          ticket={ticket}
          onSave={ctx.setStores}
          onClose={() => setStoresOpen(false)}
          working={ctx.working}
        />
      )}
    </div>
  );
};

export default TicketDetail;
