import { useRef, useState } from "react";
import { PaperClipIcon } from "@heroicons/react/24/outline";
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

  const ticket = ctx.detail;

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
      <div className="flex-shrink-0 px-4 py-3 bg-custom-white border-b border-brand_line flex flex-col gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-mono text-[12.5px] text-content/85">
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
        <div className="text-[11.5px] text-content/85">
          {ctx.isTech && ticket.company_name ? `${ticket.company_name} · ` : ""}
          opened by {ticket.opened_by_name} · {stampText(ticket.created_at)} ·
          updated {whenText(ticket.updated_at)}
        </div>

        {ctx.canManage && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {ticket.assignee_id !== ctx.userid && (
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

      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-4 py-3 flex flex-col gap-3">
        {ctx.comments.map((comment) => (
          <div
            key={comment.id}
            className={`flex flex-col gap-1 ${
              comment.is_internal
                ? "bg-amber-50 border border-amber-200 rounded-lg p-3"
                : ""
            }`}
          >
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[13px] font-semibold">
                {comment.userid === ctx.userid ? "You" : comment.author_name}
              </span>
              <span className="text-[11.5px] text-content/85">
                {stampText(comment.created_at)}
              </span>
              {comment.is_internal && (
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-amber-900">
                  Internal note — never sent to a client
                </span>
              )}
            </div>
            <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap m-0">
              {comment.comment}
            </p>
          </div>
        ))}

        {ctx.comments.length === 0 && !ctx.detailLoading && (
          <p className="text-[12.5px] text-content/85">
            Nothing in the thread yet.
          </p>
        )}

        {ctx.attachments.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-brand_line pt-3">
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
