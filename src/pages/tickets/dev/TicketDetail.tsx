import { useEffect, useRef, useState } from "react";
import { CheckCircleIcon, PaperClipIcon } from "@heroicons/react/24/outline";
import SelectFilter from "../../../components-dev/filters/SelectFilter";
import CheckBox from "../../../components-dev/inputs/CheckBox";
import { openClosing } from "../../../features/dev/devTicketsSlice";
import type { TicketStatus } from "../../../api/tickets";
import type { TicketsCtx } from "./hooks";
import {
  PRIORITY_CLASS,
  STATUS_CLASS,
  STATUS_LABEL,
  attachmentProblem,
  fileSize,
  resolutionLabel,
  stampText,
  whenText,
} from "./ticketsUtils";

/**
 * One ticket: the conversation, and what may be done to it.
 *
 * The same thread for both views. A client's payload simply has no internal
 * notes in it — they are filtered in the query, not hidden here — and the
 * controls that change a ticket are never rendered without `canManage`.
 */
const TicketDetail = ({ ctx }: { ctx: TicketsCtx }) => {
  const [draft, setDraft] = useState("");
  const [internal, setInternal] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  /** Was the reader at the bottom before this batch arrived? */
  const wasAtBottom = useRef(true);

  const ticket = ctx.detail;
  const ticketId = ctx.selectedId;
  const commentCount = ctx.comments.length;

  /**
   * Ask every five seconds, while this pane is open and the tab is being
   * looked at.
   *
   * There is no push: prod runs two tasks behind the load balancer, so a
   * socket held open to one of them could not hear a reply that arrived at
   * the other. At five seconds a reply lands in two or three, which reads as
   * live for a help desk.
   *
   * The interval is scoped to this component, so closing the pane, picking
   * another ticket or leaving the page all stop it. `inFlight` keeps a slow
   * call from becoming a queue of overlapping ones.
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
   * something.
   *
   * A message arriving while somebody is three replies up should not yank
   * them back down.
   */
  useEffect(() => {
    const box = thread.current;
    if (box && wasAtBottom.current) box.scrollTop = box.scrollHeight;
  }, [commentCount]);

  if (!ticket) {
    return (
      <div className="flex-1 min-h-0 bg-card_bg border border-brand_line rounded-xl flex items-center justify-center text-center px-6">
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

  const statusOptions = (ctx.lookups?.statuses ?? [
    "open",
    "in_progress",
    "waiting",
    "closed",
  ]).map((s) => ({ value: s, label: STATUS_LABEL[s] }));

  const assigneeOptions = [
    { value: "", label: "Unassigned" },
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
    <div className="flex-1 min-h-0 bg-card_bg border border-brand_line rounded-xl flex flex-col overflow-hidden">
      {/*
        * The card's header, and it reads as one: the number, the title and
        * the two pills that answer "where is this up to" before anything
        * else does.
        */}
      <div className="flex-shrink-0 bg-brand_navy text-custom-white px-4 py-3 flex items-center gap-2.5 flex-wrap">
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
        <div className="text-[11.5px] text-content/85">
          {ctx.isTech && ticket.company_name ? `${ticket.company_name} · ` : ""}
          opened by {ticket.opened_by_name} · {stampText(ticket.created_at)} ·
          updated {whenText(ticket.updated_at)}
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
          </div>
        )}
      </div>

      {/*
        * A closed ticket says so plainly. It is the state people most often
        * misread — the thread looks like any other conversation, and the one
        * thing they need to know is that nobody is working on it.
        */}
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

      <div
        ref={thread}
        onScroll={(e) => {
          const box = e.currentTarget;
          wasAtBottom.current =
            box.scrollHeight - box.scrollTop - box.clientHeight < 80;
        }}
        className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-4 py-3 flex flex-col gap-3"
      >
        {ctx.comments.map((comment) => {
          /*
           * Yours on the right, theirs on the left — the shape every
           * messaging app has taught people to read, so who said what is
           * answered before anybody reads a name.
           *
           * An internal note keeps its amber whichever side it lands on: it
           * is not a different speaker, it is a different audience, and
           * losing that to the alignment would lose the only thing about it
           * that matters.
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

        {ctx.attachments.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-brand_line pt-3 mt-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-content/85">
              Files · {ctx.attachments.length}
            </span>
            {ctx.attachments.map((file) => (
              <div key={file.id} className="flex items-center gap-2.5">
                <PaperClipIcon className="w-3.5 h-3.5 text-content/85 flex-shrink-0" />
                <button
                  type="button"
                  onClick={() => ctx.openAttachment(file.id)}
                  className="font-mono text-[12px] text-brand_navy_hover underline underline-offset-2 truncate"
                >
                  {file.original_filename}
                </button>
                <span className="text-[11.5px] text-content/85 flex-shrink-0">
                  {fileSize(file.file_size)} · {file.uploaded_by_name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-brand_line p-3 flex flex-col gap-2">
        {closed && (
          <span className="text-[11.5px] text-content/85">
            This ticket is closed. A reply still posts, and brings it back to
            the top of the queue.
          </span>
        )}
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
        <div className="flex items-center gap-3 flex-wrap">
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
    </div>
  );
};

export default TicketDetail;
