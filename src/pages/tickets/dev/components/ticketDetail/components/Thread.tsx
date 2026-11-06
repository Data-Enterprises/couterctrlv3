import type { TicketAttachment, TicketComment} from "../../../../../../api/tickets";


import { fileSize, stampText } from "../../../utils/ticketsUtils";

import { ChevronUpIcon, PaperClipIcon } from "@heroicons/react/24/outline";

interface ThreadProps {
  thread: React.RefObject<HTMLDivElement | null>;
  wasAtBottom: React.RefObject<boolean>;
  attachments: TicketAttachment[];
  comments: TicketComment[];
  userid: number;
  detailLoading: boolean;
  openAttachment: (attachmentId: number) => void;
  filesOpen: boolean;
  setFilesOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Thread = ({
  thread,
  wasAtBottom,
  attachments,
  comments,
  userid,
  detailLoading,
  openAttachment,
  filesOpen,
  setFilesOpen,
}: ThreadProps) => {
  return (
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
          attachments.length > 0 ? "pb-14" : "pb-3"
        }`}
      >
        {comments.map((comment) => {
          /*
           * Yours on the right, theirs on the left. An internal note keeps
           * its amber on either side: a different audience, not a speaker.
           */
          const mine = comment.userid === userid;
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

        {comments.length === 0 && !detailLoading && (
          <p className="text-[12.5px] text-content/85">
            Nothing in the thread yet.
          </p>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 border-t border-brand_line bg-custom-white shadow-[0_-4px_12px_rgb(var(--color-brand-navy)/0.08)]">
          <button
            type="button"
            onClick={() => setFilesOpen((v) => !v)}
            aria-expanded={filesOpen}
            className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-bkg"
          >
            <PaperClipIcon className="h-3.5 w-3.5 flex-shrink-0 text-content/85" />
            <span className="flex-1 text-[10.5px] font-semibold uppercase tracking-wide text-content/85">
              Files · {attachments.length}
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
                {attachments.map((file) => (
                  <div key={file.id} className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => openAttachment(file.id)}
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
  );
};

export default Thread;
