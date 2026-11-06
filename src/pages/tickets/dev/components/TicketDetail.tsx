// Hooks
import { useEffect, useRef, useState } from "react";

// Utils
import { STATUS_LABEL, attachmentProblem } from "../utils/ticketsUtils";

// Interfaces
import type { TicketsCtx } from "../hooks";

// Components
import CheckBox from "../../../../components-dev/inputs/CheckBox";
import EditStoresModal from "./modals/EditStoresModal";
import DetailHeader from "./ticketDetail/components/DetailHeader";
import TicketFacts from "./ticketDetail/components/TicketFacts";
import ManageBar from "./ticketDetail/components/ManageBar";
import ClosedStrip from "./ticketDetail/components/ClosedStrip";
import Thread from "./ticketDetail/components/Thread";

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
      <DetailHeader ticket={ticket} />

      <div className="flex-shrink-0 px-4 py-2.5 bg-custom-white border-b border-brand_line flex flex-col gap-2">
        <TicketFacts
          ticket={ticket}
          isTech={ctx.isTech}
          canManage={ctx.canManage}
        />

        {ctx.canManage && (
          <ManageBar
            ticket={ticket}
            userid={ctx.userid}
            working={ctx.working}
            closed={closed}
            dispatch={ctx.dispatch}
            assigneeOptions={assigneeOptions}
            statusOptions={statusOptions}
            setStoresOpen={setStoresOpen}
            assign={ctx.assign}
            move={ctx.move}
          />
        )}
      </div>

      {closed && (
        <ClosedStrip
          ticket={ticket}
          canManage={ctx.canManage}
          working={ctx.working}
          move={ctx.move}
        />
      )}

      <Thread
        thread={thread}
        wasAtBottom={wasAtBottom}
        attachments={ctx.attachments}
        comments={ctx.comments}
        userid={ctx.userid}
        detailLoading={ctx.detailLoading}
        openAttachment={ctx.openAttachment}
        filesOpen={filesOpen}
        setFilesOpen={setFilesOpen}
      />
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
