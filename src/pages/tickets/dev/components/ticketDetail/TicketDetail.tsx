// Hooks
import { useEffect, useRef, useState } from "react";
import { useTicketsCtx } from "../../hooks";

// Utils
import { STATUS_LABEL, attachmentProblem } from "../../utils/ticketsUtils";

// Components
import EditStoresModal from "../modals/EditStoresModal";
import DetailHeader from "./components/DetailHeader";
import TicketFacts from "./components/TicketFacts";
import ManageBar from "./components/ManageBar";
import ClosedStrip from "./components/ClosedStrip";
import Thread from "./components/Thread";
import Composer from "./components/Composer";

/** The open ticket's pane: header, facts, manage bar, closed strip, thread and reply box. It polls for new comments every five seconds and keeps the thread scrolled to the newest one. */
const TicketDetail = () => {
  const ctx = useTicketsCtx();
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
          <div className="text-[12.5px] text-content/95 mt-1.5">
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
        <Composer
          draft={draft}
          setDraft={setDraft}
          isTech={ctx.isTech}
          canManage={ctx.canManage}
          internal={internal}
          setInternal={setInternal}
          fileError={fileError}
          picker={picker}
          chooseFile={chooseFile}
          working={ctx.working}
          send={send}
        />
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
