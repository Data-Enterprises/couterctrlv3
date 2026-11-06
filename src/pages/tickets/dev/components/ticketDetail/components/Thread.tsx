// Utils
import { fileSize } from "../../../utils/ticketsUtils";

// Interfaces
import type {
  TicketAttachment,
  TicketComment,
} from "../../../../../../api/tickets";

// Components
import { ChevronUpIcon, PaperClipIcon } from "@heroicons/react/24/outline";
import CommentBubble from "./CommentBubble";

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
        // Leaves room for the collapsed Files bar, so it never covers the newest message.
        className={`h-full overflow-y-auto thin-scrollbar px-4 pt-3 flex flex-col gap-3 ${
          attachments.length > 0 ? "pb-14" : "pb-3"
        }`}
      >
        {comments.map((comment) => (
          <CommentBubble
            key={comment.id}
            comment={comment}
            mine={comment.userid === userid}
          />
        ))}

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
